// frontend/src/pages/CourseCatalog.jsx
// Embedded catalog — renders inside student-main-content, no full-page takeover.
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchAllCourses, searchCourses, resetCourseList, BACKEND_URL,
} from "../store";
import {
  BookOpen, User, Zap, Search, Loader2, Star, X, ChevronRight, Sliders, Grid, Map,
} from "lucide-react";
import "./css/CourseCatalog.css";

const API = BACKEND_URL.replace(/\/$/, "") + "/api";

// ── Star rating ───────────────────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
    {[1,2,3,4,5].map((s) => (
      <Star key={s} size={10} fill={rating >= s ? "#fbbf24" : "none"} stroke={rating >= s ? "#fbbf24" : "#d1d5db"} />
    ))}
    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 3 }}>{rating?.toFixed(1) || "New"}</span>
  </span>
);

// ── Course card (same style as before) ───────────────────────────────────────
const CourseCard = ({ course, onView }) => {
  const rawImg = course.imageUrl || `https://picsum.photos/seed/${course._id}/400/200`;
  const imgUrl = rawImg.startsWith("http") ? rawImg : `${BACKEND_URL}${rawImg}`;
  return (
    <div className="course-card">
      <div className="card-banner" style={{ backgroundImage: `url(${imgUrl})` }}>
        <div className="card-icon-overlay"><BookOpen size={22} /></div>
      </div>
      <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h2 className="card-title">{course.title}</h2>
        <p className="card-description">
          {(course.description || "").slice(0, 90)}{course.description?.length > 90 ? "…" : ""}
        </p>
        <div className="card-meta">
          <span><Zap size={12} /> {course.subject}</span>
          <span><User size={12} /> {course.instructorName || "Instructor"}</span>
        </div>
        <StarRating rating={course.rating} />
        <div className="card-price-section">
          <span className="card-price">
            {course.price === 0 ? "Free" : `$${(course.price || 0).toFixed(2)}`}
          </span>
        </div>
        <button
          onClick={() => onView(course._id)}
          className="btn-action btn-enroll"
        >
          View & Enroll
        </button>
      </div>
    </div>
  );
};

// ── Domain card for Browse mode ───────────────────────────────────────────────
const DomainCard = ({ node }) => (
  <Link to={`/student-dashboard/catalog/subject/${node.slug}`} style={{ textDecoration: "none" }}>
    <div className="domain-card">
      <div style={{ fontSize: 34, marginBottom: 8 }}>{node.emoji}</div>
      <p style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", margin: "0 0 4px" }}>{node.name}</p>
      {node.children?.length > 0 && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 8px" }}>
          {node.children.length} subject{node.children.length !== 1 ? "s" : ""}
        </p>
      )}
      {node.children?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
          {node.children.slice(0, 3).map((c) => (
            <span key={c._id} style={{ fontSize: 10, background: "#f5f3ff", color: "#6d28d9",
              borderRadius: 10, padding: "2px 7px", fontWeight: 500 }}>
              {c.name}
            </span>
          ))}
          {node.children.length > 3 && (
            <span style={{ fontSize: 10, color: "#9ca3af" }}>+{node.children.length - 3}</span>
          )}
        </div>
      )}
      <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
        Browse <ChevronRight size={12} />
      </span>
    </div>
  </Link>
);

// ─────────────────────────────────────────────────────────────────────────────
const CourseCatalog = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { list: courses, loading, loadingMore, error, hasMore, currentPage, lastSearchQuery, lastFetched }
    = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);

  const [mode,       setMode]   = useState("quick");   // "quick" | "browse"
  const [searchTerm, setSearch] = useState("");
  const [sortBy,     setSort]   = useState("newest");
  const [tree,       setTree]   = useState([]);
  const sentinelRef  = useRef();
  const observerRef  = useRef();
  const debounceRef  = useRef();

  // Compute user interests once
  const userInterests = useMemo(() =>
    (user?.interests || []).map((s) => s.trim()).filter(Boolean),
  [user]);

  // Fetch subject tree once
  useEffect(() => {
    fetch(`${API}/subjects`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Fetch preference courses — only if user has interests set
  useEffect(() => {
    if (userInterests.length === 0) return; // no preferences → don't fetch
    const fresh = courses.length > 0 && Date.now() - lastFetched < 300_000; // 5 min cache
    if (!fresh) {
      dispatch(resetCourseList());
      dispatch(fetchAllCourses({ page: 1, subjects: userInterests }));
    }
  }, [userInterests.join(",")]); // eslint-disable-line

  // Infinite scroll (quick mode only)
  useEffect(() => {
    if (mode !== "quick" || loading || loadingMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        const next = currentPage + 1;
        if (lastSearchQuery) dispatch(searchCourses({ q: lastSearchQuery, page: next, append: true }));
        else dispatch(fetchAllCourses({ page: next, append: true }));
      }
    }, { rootMargin: "300px" });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    observerRef.current = obs;
    return () => observerRef.current?.disconnect();
  }, [mode, loading, loadingMore, hasMore, currentPage, lastSearchQuery, dispatch]);

  // Live search: debounce 300ms on every keystroke
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchTerm.trim()) {
      debounceRef.current = setTimeout(() => {
        dispatch(resetCourseList());
        dispatch(searchCourses({ q: searchTerm.trim(), page: 1 }));
      }, 300);
    } else {
      // Search cleared — go back to preference courses
      if (userInterests.length > 0) {
        dispatch(resetCourseList());
        dispatch(fetchAllCourses({ page: 1, subjects: userInterests }));
      } else {
        dispatch(resetCourseList());
      }
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, dispatch]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    dispatch(resetCourseList());
    if (searchTerm.trim()) dispatch(searchCourses({ q: searchTerm.trim(), page: 1 }));
    else if (userInterests.length > 0) dispatch(fetchAllCourses({ page: 1, subjects: userInterests }));
  };

  // Navigate to the course detail/enroll page (CourseViewer handles the actual enrollment)
  const handleViewCourse = (id) => {
    navigate(`/student-dashboard/courses/${id}`);
  };

  const isSearchActive = !!lastSearchQuery;

  const sorted = useMemo(() => {
    const list = [...courses];
    switch (sortBy) {
      case "rating": return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:       return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [courses, sortBy]);

  // Backend already filters by preference — no client-side interest filter needed
  const displayCourses = sorted;
  const hasInterests = userInterests.length > 0;

  return (
    <div>
      {/* ── Search + mode toggle bar ── */}
      <div style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch}
          style={{ display: "flex", background: "white", border: "1px solid #e5e7eb",
            borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: 12 }}>
          <span style={{ display: "flex", alignItems: "center", padding: "0 12px", color: "#9ca3af" }}>
            <Search size={17} />
          </span>
          <input
            type="text" value={searchTerm}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, subjects, instructors…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111827", padding: "11px 0" }}
          />
          {searchTerm && (
            <button type="button"
              onClick={() => { setSearch(""); dispatch(resetCourseList()); dispatch(fetchAllCourses({ page: 1 })); }}
              style={{ background: "none", border: "none", padding: "0 10px", cursor: "pointer", color: "#9ca3af" }}>
              <X size={15} />
            </button>
          )}
          <button type="submit"
            style={{ padding: "0 20px", background: "#6366f1", color: "white",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Search
          </button>
        </form>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("quick")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px",
              borderRadius: 20, border: "1.5px solid " + (mode === "quick" ? "#6366f1" : "#e5e7eb"),
              background: mode === "quick" ? "#ede9fe" : "white",
              color: mode === "quick" ? "#4f46e5" : "#374151",
              fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Grid size={13} /> Quick Search
          </button>
          <button onClick={() => setMode("browse")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px",
              borderRadius: 20, border: "1.5px solid " + (mode === "browse" ? "#6366f1" : "#e5e7eb"),
              background: mode === "browse" ? "#ede9fe" : "white",
              color: mode === "browse" ? "#4f46e5" : "#374151",
              fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Map size={13} /> Browse by Subject
          </button>
          {sortBy !== "newest" || searchTerm ? (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Sliders size={12} style={{ color: "#9ca3af" }} />
              <select value={sortBy} onChange={(e) => setSort(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8,
                  fontSize: 12, color: "#374151", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>

              </select>
            </div>
          ) : (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Sliders size={12} style={{ color: "#9ca3af" }} />
              <select value={sortBy} onChange={(e) => setSort(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8,
                  fontSize: 12, color: "#374151", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>

              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {/* ── BROWSE MODE ── */}
      {mode === "browse" && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: "0 0 16px",
            display: "flex", alignItems: "center", gap: 6 }}>
            📚 Browse All Subject Areas
          </h2>
          {tree.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Loading subjects…</p>
          ) : (
            <div className="domain-grid">
              {tree.map((d) => <DomainCard key={d._id} node={d} />)}
            </div>
          )}
        </div>
      )}

      {/* ── QUICK MODE ── */}
      {mode === "quick" && (
        <div>
          {/* No preferences empty state — shown immediately, no fetch */}
          {!isSearchActive && !hasInterests && (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
                No recommendations yet
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 340, margin: "0 auto 20px" }}>
                Set your topic interests in Settings and we'll show you matching courses here.
                Use the search bar above to explore all courses anytime.
              </p>
              <button onClick={() => navigate("/student-dashboard/settings")}
                style={{ background: "#6366f1", color: "white", border: "none",
                  borderRadius: 10, padding: "10px 22px", fontWeight: 700,
                  fontSize: 13, cursor: "pointer" }}>
                Set Interests in Settings
              </button>
            </div>
          )}

          {(hasInterests || isSearchActive) && (
            loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
              </div>
            ) : (
              <>
                {/* Section heading */}
                {isSearchActive ? (
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: "0 0 14px",
                    display: "flex", alignItems: "center", gap: 8 }}>
                    🔍 Search Results
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280",
                      background: "#f3f4f6", borderRadius: 10, padding: "2px 8px" }}>
                      {displayCourses.length} found
                    </span>
                  </h2>
                ) : (
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: "0 0 14px",
                    display: "flex", alignItems: "center", gap: 8 }}>
                    ✨ Recommended for You
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280",
                      background: "#f3f4f6", borderRadius: 10, padding: "2px 8px" }}>
                      Based on your interests
                    </span>
                  </h2>
                )}

                {/* No preference matches */}
                {!isSearchActive && displayCourses.length === 0 && (
                  <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
                    <BookOpen size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p style={{ fontSize: 14 }}>No courses match your interests yet.</p>
                    <p style={{ fontSize: 12 }}>Search to explore all courses, or update your interests in Settings.</p>
                  </div>
                )}

                {/* Search empty */}
                {isSearchActive && displayCourses.length === 0 && (
                  <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
                    <BookOpen size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p style={{ fontSize: 14 }}>No courses found. Try different keywords.</p>
                  </div>
                )}

                <div className="course-grid">
                  {displayCourses.map((c, i) => (
                    <CourseCard key={c._id + i} course={c} onView={handleViewCourse} />
                  ))}
                </div>
              </>
            )
          )}

          <div ref={sentinelRef} style={{ height: 8 }} />
          {loadingMore && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 14,
              color: "#6b7280", fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading more…
            </div>
          )}
          {!hasMore && displayCourses.length > 0 && (
            <p style={{ textAlign: "center", padding: "14px 0", color: "#9ca3af", fontSize: 12 }}>
              ✨ {isSearchActive ? `${displayCourses.length} results` : `${displayCourses.length} recommended courses`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
