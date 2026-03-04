// v1/frontend/src/pages/StudentCourse/MyLearning.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchEnrolledCourses } from "../../store";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import "../css/MyLearning.css";

// ── PassStatusBadge: renders the pass/fail/in-progress pill ────────────────
const PassStatusBadge = ({ passStatus, weightedScore, passingPolicy }) => {
  const mode = passingPolicy?.mode;
  const minScore = passingPolicy?.minimumWeightedScore;

  if (passStatus === "pass") {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "#d1fae5", color: "#065f46",
          padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
        }}
      >
        <CheckCircle size={12} />
        Passed{weightedScore !== null && weightedScore !== undefined ? ` — Score: ${weightedScore.toFixed(1)}%` : ""}
      </span>
    );
  }
  if (passStatus === "fail") {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "#fee2e2", color: "#991b1b",
          padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
        }}
      >
        <XCircle size={12} />
        Failed{weightedScore !== null && weightedScore !== undefined
          ? ` — Score: ${weightedScore.toFixed(1)}%${mode === "weighted" && minScore ? ` (need ${minScore}%)` : ""}`
          : ""}
      </span>
    );
  }
  // in-progress or legacy undefined
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#e0f2fe", color: "#0369a1",
        padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      }}
    >
      <Clock size={12} /> In Progress
    </span>
  );
};

const getCourseCompletionPercentage = (course) => {
  const completed =
    typeof course.completedContentModules === "number"
      ? course.completedContentModules
      : course.modules_status?.filter((s) => s.completed).length || 0;

  const totalModules =
    typeof course.totalContentModules === "number"
      ? course.totalContentModules
      : course.modules_status?.length ||
      Object.keys(course.modules || {}).length ||
      1;

  if (!totalModules || totalModules === 0) return 0;
  return Math.min(100, (completed / totalModules) * 100);
};

const MyLearning = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { enrolledList, loading, error } = useSelector(
    (state) => state.enrollment,
  );
  const allCourses = useSelector((state) => state.courses.list);

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  const handleViewCourse = (courseId) => {
    navigate(`/student-dashboard/courses/${courseId}`);
  };

  return (
    <>
      <div className="dashboard-intro">
        <h1>My Learning</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}. You are enrolled in {enrolledList.length}{" "}
          courses.
        </p>
      </div>

      <section className="course-section">
        <h2 className="section-title">Active Courses</h2>

        {loading ? (
          <div className="loading-state-full">
            <Loader2 className="animate-spin" size={32} /> Loading...
          </div>
        ) : enrolledList.length > 0 ? (
          <div className="course-grid student-course-grid">
            {enrolledList.map((course) => {
              // Prefer explicit imageUrl from enrollment payload, then fall back to global course list, then seeded image
              const fallbackFromCourses = allCourses.find(
                (c) => String(c._id) === String(course._id),
              );
              const rawImageUrl =
                course.imageUrl ||
                (fallbackFromCourses && fallbackFromCourses.imageUrl) ||
                `https://picsum.photos/seed/${course._id}/400/220`;
              const imageUrl =
                rawImageUrl && rawImageUrl.startsWith("http")
                  ? rawImageUrl
                  : `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}${rawImageUrl}`;

              // --- RESTORED LOGIC FOR COUNTS ---
              const backendCompleted = course.completedContentModules;
              const backendTotal = course.totalContentModules;

              const completedCount = !isNaN(Number(backendCompleted))
                ? Number(backendCompleted)
                : course.modules_status?.filter((s) => s.completed).length || 0;

              const totalModulesDisplay = !isNaN(Number(backendTotal))
                ? Number(backendTotal)
                : course.modules_status?.length || 1;

              const completionPercent = getCourseCompletionPercentage(course);

              // Determine pass status (new field) or fall back to count-based check
              const passStatus = course.passStatus || null; // "pass" | "fail" | "in-progress" | null
              const isActuallyPassed =
                passStatus === "pass" ||
                (!passStatus && completedCount >= totalModulesDisplay && totalModulesDisplay > 0);
              const isActuallyFailed = passStatus === "fail";

              const progressBarColor = isActuallyPassed
                ? "#10b981"   // green
                : isActuallyFailed
                  ? "#ef4444"   // red
                  : "#3b82f6";  // blue

              return (
                <div
                  key={course._id}
                  className="course-card vertical-compact-card"
                >
                  <div
                    className="card-banner-compact"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  >
                    {isActuallyPassed && (
                      <div className="completed-badge-small">
                        <CheckCircle size={12} />
                      </div>
                    )}
                  </div>

                  <div className="card-body-compact">
                    <div className="card-header-row">
                      <span className="badge-subject-small">
                        {course.subject}
                      </span>
                      <span className="percent-text">
                        {completionPercent.toFixed(0)}%
                      </span>
                    </div>

                    <h3 className="card-title-compact">{course.courseTitle}</h3>

                    {/* Pass/Fail/Score badge */}
                    <div style={{ marginBottom: 6 }}>
                      <PassStatusBadge
                        passStatus={passStatus || (isActuallyPassed ? "pass" : "in-progress")}
                        weightedScore={course.weightedScore}
                        passingPolicy={course.passingPolicy}
                      />
                    </div>

                    <p className="progress-stats-text">
                      {completedCount}/{totalModulesDisplay} Modules Completed
                    </p>

                    {/* Price Display */}
                    {course.price && (
                      <div style={{ margin: '8px 0 0 0', padding: '6px 8px', background: '#f0fdf4', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                        ${course.price.toFixed(2)}
                      </div>
                    )}

                    <div className="progress-section-compact">
                      <div className="progress-bar-bg-slim">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${completionPercent}%`,
                            backgroundColor: progressBarColor,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className="btn-continue-compact"
                      onClick={() => handleViewCourse(course._id)}
                    >
                      {isActuallyPassed ? "Review" : isActuallyFailed ? "Retry" : "Continue"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses enrolled.</p>
            <Link to="/student-dashboard/catalog" className="browse-btn">
              Browse
            </Link>
          </div>
        )}

        {error && <div className="text-red-500 mt-4">Error: {error}</div>}
      </section>
    </>
  );
};

export default MyLearning;
