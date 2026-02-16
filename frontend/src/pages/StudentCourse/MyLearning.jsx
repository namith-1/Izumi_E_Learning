// v1/frontend/src/pages/StudentCourse/MyLearning.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchEnrolledCourses } from "../../store"; 
import { Loader2, CheckCircle } from "lucide-react";
import "../css/MyLearning.css";

const getCourseCompletionPercentage = (course) => {
  const completed = typeof course.completedContentModules === "number"
      ? course.completedContentModules
      : course.modules_status?.filter((s) => s.completed).length || 0;

  const totalModules = typeof course.totalContentModules === "number"
      ? course.totalContentModules
      : course.modules_status?.length || Object.keys(course.modules || {}).length || 1;

  if (!totalModules || totalModules === 0) return 0;
  return Math.min(100, (completed / totalModules) * 100);
};

const MyLearning = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { enrolledList, loading, error } = useSelector((state) => state.enrollment);

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
          Welcome back, {user?.name}. You are enrolled in {enrolledList.length} courses.
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
              const imageUrl = `https://picsum.photos/seed/${course._id}/400/220`;
              
              // --- RESTORED LOGIC FOR COUNTS ---
              const backendCompleted = course.completedContentModules;
              const backendTotal = course.totalContentModules;
              
              const completedCount = !isNaN(Number(backendCompleted)) 
                ? Number(backendCompleted) 
                : course.modules_status?.filter((s) => s.completed).length || 0;

              const totalModulesDisplay = !isNaN(Number(backendTotal)) 
                ? Number(backendTotal) 
                : (course.modules_status?.length || 1);

              const completionPercent = getCourseCompletionPercentage(course);

              // --- DYNAMIC COMPLETION FIX ---
              // Ignore course.completionStatus; check if counts actually match.
              const isActuallyCompleted = completedCount >= totalModulesDisplay && totalModulesDisplay > 0;
              const progressBarColor = isActuallyCompleted ? "#10b981" : "#3b82f6";

              return (
                <div key={course._id} className="course-card vertical-compact-card">
                  <div 
                    className="card-banner-compact" 
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  >
                    {/* Only show green checkmark if count is actually 100% */}
                    {isActuallyCompleted && (
                      <div className="completed-badge-small">
                        <CheckCircle size={12} />
                      </div>
                    )}
                  </div>

                  <div className="card-body-compact">
                    <div className="card-header-row">
                      <span className="badge-subject-small">{course.subject}</span>
                      <span className="percent-text">{completionPercent.toFixed(0)}%</span>
                    </div>
                    
                    <h3 className="card-title-compact">{course.courseTitle}</h3>
                    
                    <p className="progress-stats-text">
                      {completedCount}/{totalModulesDisplay} Modules Completed
                    </p>

                    <div className="progress-section-compact">
                      <div className="progress-bar-bg-slim">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${completionPercent}%`, 
                            backgroundColor: progressBarColor 
                          }}
                        />
                      </div>
                    </div>

                    <button 
                      className="btn-continue-compact" 
                      onClick={() => handleViewCourse(course._id)}
                    >
                      {/* Button text now flips based on real-time count */}
                      {isActuallyCompleted ? "Review" : "Continue"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses enrolled.</p>
            <Link to="/student-dashboard/catalog" className="browse-btn">Browse</Link>
          </div>
        )}

        {error && <div className="text-red-500 mt-4">Error: {error}</div>}
      </section>
    </>
  );
};

export default MyLearning;