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
  enrollInCourse,
  fetchEnrollmentStatus,
  resetEnrollment,
  BACKEND_URL,
} from "../../store";
import { BookOpen, Layers, Clock, Loader2, User, Play } from "lucide-react";
import PaymentModal from "../../components/PaymentModal";

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

    const rootId = course.rootModule.id;
    if (course.rootModule.children && course.rootModule.children.length > 0) {
      // NOTE: Using your specific module ID structure (the first child)
      // Hardcoding a specific ID would break flexibility. We use the first module ID dynamically.
      // If you need a hardcoded module ID (e.g., 1764632801910.2048), you must ensure it is the first child.

      // Using a dynamic check to ensure the feature is generally useful:
      return course.rootModule.children[0];
    }
    return rootId;
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

  const handlePaymentConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      const result = await dispatch(
        enrollInCourse({
          courseId,
          paymentMethod: "card",
        }),
      );

      if (
        enrollInCourse.fulfilled.match(result) ||
        (result.payload && result.payload.includes("Already enrolled"))
      ) {
        setPaymentStatus("success");

        await new Promise((resolve) => {
          redirectTimeoutRef.current = window.setTimeout(resolve, 100);
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
      } else {
        console.error("Enrollment failed:", result.payload);
        alert("Enrollment failed. Please try again.");
        setPaymentStatus("idle");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("An error occurred during enrollment. Please try again.");
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
              {introModule.title || "Course Introduction"}
            </li>
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
                    ${(course.price || 0).toFixed(2)}
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
            <p className="intro-description">
              {introModule.description || course.description}
            </p>
            <div className="lesson-text">
              {introModule.text ||
                "Welcome to the course! This is the introduction module. Enroll to start tracking your progress."}
            </div>
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
