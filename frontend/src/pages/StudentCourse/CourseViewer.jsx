// v2/src/pages/StudentCourse/CourseViewer.jsx

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourseById,
  createRazorpayOrder,
  verifyRazorpayPayment,
  fetchEnrollmentStatus,
  resetEnrollment,
  BACKEND_URL,
} from "../../store";
import { BookOpen, Layers, Clock, Loader2, User, Play, ArrowLeft } from "lucide-react";
import PaymentModal from "../../components/PaymentModal";
import { marked } from 'marked';

const loadRazorpayCheckout = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout requires a browser."));
  }

  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
};

const CourseViewer = () => {
  // --- 1. HOOK CALLS (MUST BE UNCONDITIONAL) ---
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    currentCourse: course,
    loading: courseLoading,
    error: courseError,
  } = useSelector((state) => state.courses);
  const {
    currentEnrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useSelector((state) => state.enrollment);
  const { entities: teacherEntities } = useSelector((state) => state.teachers);
  const currentUser = useSelector((state) => state.auth?.user);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const redirectTimeoutRef = useRef(null);
  const apiBase = BACKEND_URL;

  const loading = courseLoading || enrollmentLoading || isProcessing;

  const rawBg =
    course && course.imageUrl
      ? course.imageUrl
      : "https://placehold.co/1200x300/4c7c9f/ffffff?text=Course+Introduction";
  const courseBgUrl = useMemo(() => {
    if (!rawBg) {
      return "https://placehold.co/1200x300/4c7c9f/ffffff?text=Course+Introduction";
    }

    if (rawBg.startsWith("http://") || rawBg.startsWith("https://")) {
      return rawBg;
    }

    if (rawBg.startsWith("/uploads/")) {
      return `${apiBase}${rawBg}`;
    }

    if (/^course-.*\.(png|jpe?g|webp|gif)$/i.test(rawBg)) {
      return `${apiBase}/uploads/courses/${rawBg}`;
    }

    return rawBg.startsWith("/") ? `${apiBase}${rawBg}` : `${apiBase}/${rawBg}`;
  }, [rawBg, apiBase]);

  // --- 2. EFFECTS ---
  useEffect(() => {
    dispatch(resetEnrollment());
    dispatch(fetchCourseById(courseId));
    dispatch(fetchEnrollmentStatus(courseId));
  }, [dispatch, courseId]);

  // --- 3. CALLBACKS ---
  const getFirstModuleId = useCallback(() => {
    if (!course || !course.rootModule) return "root";

    // Return the root module ID (Course Introduction) instead of skipping to the first child.
    // This ensures students see the intro first.
    return course.rootModule.id;
  }, [course]);

  // ** NEW EFFECT FOR AUTOMATIC REDIRECT **
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only run this check once course and enrollment data are confirmed
    if (
      courseLoading ||
      enrollmentLoading ||
      isProcessing ||
      paymentStatus === "success"
    )
      return;

    // If the user is enrolled (currentEnrollment is truthy) and course structure exists
    if (currentEnrollment && course && course.rootModule) {
      const firstModuleId = getFirstModuleId();

      // Navigate directly to the learning page
      navigate(`learn/module/${firstModuleId}`, { replace: true });
    }
  }, [
    currentEnrollment,
    course,
    courseLoading,
    enrollmentLoading,
    isProcessing,
    paymentStatus,
    navigate,
    getFirstModuleId,
  ]);

  const handleStartLearning = useCallback(() => {
    const firstModuleId = getFirstModuleId();
    // Use relative path to navigate to the learning component
    navigate(`learn/module/${firstModuleId}`);
  }, [getFirstModuleId, navigate]);

  const handleEnroll = async () => {
    if (isProcessing) return;
    // Show payment modal instead of directly enrolling
    setShowPaymentModal(true);
  };

  const finishSuccessfulEnrollment = async (enrollmentData) => {
    setPaymentStatus("success");

    // If we already have enrollment data from the verify response, use it directly
    // instead of making another API call — faster and more reliable
    if (enrollmentData) {
      dispatch({ type: "enrollment/fetchStatus/fulfilled", payload: enrollmentData });
    } else {
      // Fallback: re-fetch from server
      await dispatch(fetchEnrollmentStatus(courseId));
    }

    await new Promise((resolve) => {
      redirectTimeoutRef.current = window.setTimeout(resolve, 300);
    });

    redirectTimeoutRef.current = null;
    setShowPaymentModal(false);
    setPaymentStatus("idle");

    sessionStorage.setItem(
      `izumi_just_enrolled_${courseId}`,
      String(Date.now()),
    );

    navigate(`learn/module/${getFirstModuleId()}`, {
      replace: true,
      state: { justEnrolled: true },
    });
  };

  const handlePaymentConfirm = async (selectedMethod = "card") => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      const orderResult = await dispatch(createRazorpayOrder({ courseId }));

      if (createRazorpayOrder.rejected.match(orderResult)) {
        alert(orderResult.payload || "Unable to start Razorpay payment.");
        setPaymentStatus("idle");
        return;
      }

      const paymentPayload = orderResult.payload;

      if (paymentPayload?.free || paymentPayload?.enrollment) {
        // Free course — backend already enrolled, use the enrollment from response
        await finishSuccessfulEnrollment(paymentPayload.enrollment);
        return;
      }

      await loadRazorpayCheckout();

      const paymentResponse = await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: paymentPayload.keyId,
          amount: paymentPayload.amount,
          currency: paymentPayload.currency,
          name: "Izumi E-Learning",
          description: course?.title || "Course enrollment",
          order_id: paymentPayload.order.id,
          prefill: {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
          },
          notes: {
            courseId,
          },
          theme: {
            color: "#10b981",
          },
          handler: resolve,
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });

        razorpay.on("payment.failed", (response) => {
          reject(
            new Error(
              response?.error?.description || "Razorpay payment failed.",
            ),
          );
        });

        razorpay.open();
      });

      const verifyResult = await dispatch(
        verifyRazorpayPayment({
          transactionId: paymentPayload.transaction._id,
          paymentMethod: selectedMethod,
          ...paymentResponse,
        }),
      );

      if (verifyRazorpayPayment.fulfilled.match(verifyResult)) {
        // Pass the enrollment object from the verify response directly
        await finishSuccessfulEnrollment(verifyResult.payload?.enrollment);
      } else {
        alert(verifyResult.payload || "Payment verification failed.");
        setPaymentStatus("idle");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "An error occurred during payment. Please try again.");
      setPaymentStatus("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 4. CONDITIONAL RENDERING (Must be AFTER ALL HOOKS) ---

  // Check 1: Initial Loading or Course Error
  if (loading && !course) {
    return (
      <div className="loading-state-full">
        <Loader2 className="animate-spin" size={32} /> Loading Course Details...
      </div>
    );
  }

  // Check 2: Fatal Errors (After loading completes)
  if (courseError || !course) {
    return (
      <div className="error-state-full">
        Error: {courseError || "Course not found."}
      </div>
    );
  }

  // --- 5. RENDER CONTENT ---
  const isEnrolled = !!currentEnrollment;

  const instructor =
    (course.teacherId && typeof course.teacherId === "object")
      ? course.teacherId                                       // populated by API
      : course.teacherId
        ? teacherEntities?.[course.teacherId] || null          // from redux store
        : null;
  const instructorName = instructor?.name || "Unknown Instructor";

  const rootModule = course.rootModule || { id: "root", title: "Introduction" };
  const introModule = (course.modules && rootModule.id && course.modules[rootModule.id]) || rootModule;

  // If the user is enrolled, but the automatic redirect hasn't happened yet (e.g., waiting for data fetch to complete),
  // we still show a loading screen to prevent a flicker.
  if (isEnrolled && (courseLoading || enrollmentLoading)) {
    return (
      <div className="loading-state-full">
        <Loader2 className="animate-spin" size={32} /> Redirecting to course
        content...
      </div>
    );
  }

  return (
    <div className="course-viewer-layout">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        style={{ 
          display: "flex", alignItems: "center", gap: 8, background: "none", 
          border: "none", color: "#6366f1", fontWeight: 700, fontSize: 14, 
          cursor: "pointer", marginBottom: 16, padding: 0 
        }}
      >
        <ArrowLeft size={18} /> Back to Results
      </button>

      {/* Background Image Header */}
      <div
        className="course-header-banner"
        style={{ backgroundImage: `url(${courseBgUrl})` }}
      >
        <div className="header-overlay">
          <h1 className="text-white text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-200 mt-2">{course.description}</p>
          <div className="course-meta-bar">
            <span className="meta-item">
              <User size={16} /> {instructorName}
            </span>
            <span className="meta-item">
              <Layers size={16} /> {course.subject}
            </span>
            <span className="meta-item">
              <Clock size={16} /> Est. Duration: N/A
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="course-viewer-grid">
        {/* Left Sidebar (Enrollment/Module Navigation) */}
        <aside className="module-sidebar">
          <h2 className="sidebar-title">
            <BookOpen size={20} /> Course Content
          </h2>
          <ul className="module-list">
            <li className="module-list-item active">
              <Play size={14} /> {introModule.title || "Course Introduction"}
            </li>
            {rootModule.children && rootModule.children.map((childId) => {
              const mod = course.modules[childId];
              if (!mod) return null;
              return (
                <li key={childId} className="module-list-item" style={{ paddingLeft: 28, fontSize: 13, color: "#64748b" }}>
                  {mod.title}
                </li>
              );
            })}
          </ul>

          {/* Button based on Enrollment Status */}
          <div className="sidebar-action-box">
            {isEnrolled ? (
              <button
                onClick={handleStartLearning}
                className="btn-start-learning"
              >
                <Play size={18} /> Start Learning
              </button>
            ) : (
              <>
                <div className="price-display">
                  <span className="price-label">Course Price</span>
                  <span className="price-amount">
                    ₹{(course.price || 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleEnroll}
                  className="btn-enroll-now"
                  disabled={isProcessing || loading}
                >
                  {isProcessing || loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <BookOpen size={18} /> Enroll Now
                    </>
                  )}
                </button>
              </>
            )}
            {enrollmentError && !isEnrolled && (
              <p className="text-red-500 text-xs mt-2 text-center">
                Enrollment Status: {enrollmentError}
              </p>
            )}
          </div>
        </aside>

        {/* Right Content Area (Intro Module Details) */}
        <main className="module-content-area">
          <h2 className="module-title">{introModule.title}</h2>
          <div className="intro-module-content">
            <p className="intro-description" style={{ fontSize: "1.1rem", color: "#4b5563", marginBottom: "1.5rem" }}>
              {introModule.description || course.description}
            </p>
            
            {/* ── What you will learn ── */}
            {course.whatULearning && course.whatULearning.length > 0 && (
              <div style={{ marginBottom: 24, padding: "20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>What you will learn</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {course.whatULearning.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#475569" }}>
                      <span style={{ color: "#10b981", fontWeight: 900 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div 
              className="lesson-text markdown-content" 
              style={{ wordBreak: "break-word", lineHeight: "1.7", color: "#374151" }}
              dangerouslySetInnerHTML={{
                __html: marked.parse(introModule.text || "Welcome to the course! This is the introduction module. Enroll to start tracking your progress.")
              }}
            />
          </div>

          {/* ── About the Instructor ── */}
          <div style={{
            marginTop: 32, background: "white", border: "1px solid #e5e7eb",
            borderRadius: 14, padding: "20px 24px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280",
              textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              About the Instructor
            </h3>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* Avatar */}
              <div style={{
                width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: "white",
              }}>
                {instructorName[0]?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", margin: "0 0 2px" }}>
                  {instructorName}
                </p>
                {instructor?.email && (
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px" }}>
                    {instructor.email}
                  </p>
                )}
                {instructor?.specialization?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {instructor.specialization.map((s) => (
                      <span key={s} style={{
                        background: "#ede9fe", color: "#5b21b6",
                        fontSize: 11, fontWeight: 600, borderRadius: 10,
                        padding: "2px 10px",
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {(!instructor?.specialization?.length) && (
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                    Instructor at Izumi E-Learning
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        course={{
          ...course,
          instructorName: instructorName,
        }}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        isProcessing={isProcessing}
        paymentState={paymentStatus}
      />
    </div>
  );
};

export default CourseViewer;
