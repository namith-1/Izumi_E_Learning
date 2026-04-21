import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllCourses, enrollInCourse, searchCourses, resetCourseList, BACKEND_URL } from "../store";
import { BookOpen, User, Zap, CheckCircle, Search, Loader2 } from "lucide-react";
import "./css/CourseCatalog.css";

const CourseCatalog = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    list: courses,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    lastSearchQuery,
    lastFetched, // Add this
  } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const observer = useRef();
  const sentinelRef = useRef();

  // 1. Initial Fetch with 15s Browser Cache (Redux-based)
  useEffect(() => {
    const isFresh = courses.length > 0 && (Date.now() - lastFetched < 15000);
    
    if (!isFresh) {
      dispatch(resetCourseList());
      dispatch(fetchAllCourses({ page: 1 }));
    }
  }, [dispatch, courses.length, lastFetched]);

  // 2. Infinite Scroll Observer (Sentinel based)
  useEffect(() => {
    if (loading || loadingMore) return;

    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = currentPage + 1;
          if (lastSearchQuery) {
            dispatch(searchCourses({ q: lastSearchQuery, page: nextPage, append: true }));
          } else {
            dispatch(fetchAllCourses({ page: nextPage, append: true }));
          }
        }
      },
      { rootMargin: "250px" } // Proactive loading
    );

    if (sentinelRef.current) {
      currentObserver.observe(sentinelRef.current);
    }

    observer.current = currentObserver;

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, currentPage, lastSearchQuery, dispatch]);

  // 3. Search Logic
  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(resetCourseList());
    if (searchTerm.trim()) {
      dispatch(searchCourses({ q: searchTerm, page: 1 }));
    } else {
      dispatch(fetchAllCourses({ page: 1 }));
    }
  };

  const handleEnroll = async (courseId) => {
    if (!user) return alert("Please log in to enroll.");

    try {
      const resultAction = await dispatch(
        enrollInCourse({ courseId, paymentMethod: "card" }),
      );

      if (enrollInCourse.fulfilled.match(resultAction)) {
        alert(`Successfully enrolled in the course!`);
        navigate(`/course/${courseId}`);
      } else {
        alert(`Enrollment failed: ${resultAction.payload}`);
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      alert("An unknown error occurred during enrollment.");
    }
  };

  return (
    <div className="catalog-container">
      <header className="catalog-header">
        <h1>Course Catalog</h1>
        <p>Explore our library of expert-led courses.</p>

        <form className="catalog-search-bar" onSubmit={handleSearch}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, subject, or instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {error && <div className="catalog-error">Error: {error}</div>}

      <div className="course-grid">
        {courses.map((course, index) => {
          const rawImageUrl = course.imageUrl || `https://picsum.photos/seed/${course._id}/400/200`;
          const imageUrl = rawImageUrl.startsWith("http")
            ? rawImageUrl
            : `${BACKEND_URL}${rawImageUrl}`;

          return (
            <div
              key={course._id + index}
              className="course-card"
            >
              <div
                className="card-banner"
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                <div className="card-icon-overlay">
                  <BookOpen size={24} className="card-icon" />
                </div>
              </div>

              <div className="card-content">
                <h2 className="card-title">{course.title}</h2>
                <p className="card-description">{course.description}</p>

                <div className="card-meta">
                  <span>
                    <Zap size={14} /> {course.subject}
                  </span>
                  <span>
                    <User size={14} /> {course.instructorName || "Instructor"}
                  </span>
                </div>

                <div className="card-price-section">
                  <span className="card-price">
                    ${(course.price || 0).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => handleEnroll(course._id)}
                  className="btn-action btn-enroll"
                  disabled={!user}
                >
                  Enroll Now
                </button>
              </div>
            </div>
          );
        })}
        {/* Sentinel element for Infinite Scroll */}
        <div ref={sentinelRef} style={{ height: "10px", width: "100%" }} />
      </div>

      {loadingMore && (
        <div className="scroll-loading">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading more courses...</span>
        </div>
      )}

      {!hasMore && courses.length > 0 && (
        <div className="end-of-results">
          ✨ You've reached the end of the catalog!
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="end-of-results">No courses found matching your search.</div>
      )}
    </div>
  );
};

export default CourseCatalog;
