// frontend/src/pages/SubjectBrowsePage.jsx
// Dedicated subject-browsing page at /catalog/subject/:slug
// Shows: breadcrumb → sub-topic sidebar → course grid with filters

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen, User, ChevronRight, Home, Star, Zap, Loader2,
  ArrowLeft, Filter, SlidersHorizontal, X,
} from "lucide-react";
import "./css/CourseCatalog.css";

import {
  fetchAllCourses as fetchCourses,
  enrollInCourse as enroll,
  resetCourseList as resetList,
  fetchSubjectTree,
  BACKEND_URL as BURL,
} from "../store";

const API = BURL.replace(/\/$/, "") + "/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const flatten = (nodes, acc = []) => {
  nodes.forEach((n) => { acc.push(n); if (n.children?.length) flatten(n.children, acc); });
  return acc;
};

const findBySlug = (nodes, slug) => {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    if (n.children?.length) { const f = findBySlug(n.children, slug); if (f) return f; }
  }
  return null;
};

// collect all descendant slugs + names of a node (for course filtering)
const descendantNames = (node) => {
  const names = new Set();
  const walk = (n) => {
    names.add(n.name.toLowerCase());
    (n.children || []).forEach(walk);
  };
  walk(node);
  return names;
};

const StarRating = ({ rating }) => (
  <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
    {[1,2,3,4,5].map((s) => (
      <Star key={s} size={10} fill={rating >= s ? "#fbbf24" : "none"} stroke={rating >= s ? "#fbbf24" : "#d1d5db"} />
    ))}
    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 3 }}>{rating?.toFixed(1) || "New"}</span>
  </span>
);

const CourseCard = ({ course, onEnroll, user }) => {
  const rawImg = course.imageUrl || `https://picsum.photos/seed/${course._id}/400/200`;
  const imageUrl = rawImg.startsWith("http") ? rawImg : `${BURL}${rawImg}`;
  return (
    <div className="course-card" style={{ display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <div className="card-banner" style={{ backgroundImage: `url(${imageUrl})`, position: "relative" }}>
        <div className="card-icon-overlay"><BookOpen size={20} className="card-icon" /></div>
        {course.isFeatured && (
          <span style={{ position: "absolute", top: 8, left: 8, background: "#f59e0b", color: "#fff",
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20 }}>⭐ Featured</span>
        )}
      </div>
      <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h2 className="card-title" style={{ fontSize: 14, marginBottom: 4 }}>{course.title}</h2>
        <p className="card-description" style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>
          {(course.description || "").slice(0, 90)}{course.description?.length > 90 ? "…" : ""}
        </p>
        <div className="card-meta" style={{ fontSize: 11 }}>
          <span><Zap size={11} /> {course.subject}</span>
          <span><User size={11} /> {course.instructorName || "Instructor"}</span>
        </div>
        <StarRating rating={course.rating} />
        <div className="card-price-section">
          <span className="card-price" style={{ fontSize: "1.2rem" }}>
            {course.price === 0 ? "Free" : `$${(course.price || 0).toFixed(2)}`}
          </span>
        </div>
        <button onClick={() => onEnroll(course._id)} className="btn-action btn-enroll"
          disabled={!user} title={!user ? "Log in to enroll" : "Enroll"}>
          Enroll Now
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const SubjectBrowsePage = () => {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { list: allCourses, loading, loadingMore, hasMore, currentPage, lastFetched, subjectTree: tree }
    = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);

  const [treeLoad,   setTreeLoad]   = useState(false);
  const [node,       setNode]       = useState(null);      // current subject node
  const [ancestors,  setAncestors]  = useState([]);        // breadcrumb chain
  const [activeChild,setActiveChild]= useState(null);      // selected child filter
  const [sortBy,     setSortBy]     = useState("newest");
  const sentinelRef = useRef();
  const observerRef = useRef();

  // Fetch subject tree once (session-cached in Redux)
  useEffect(() => {
    dispatch(fetchSubjectTree());
  }, [dispatch]);

  // Find node + build ancestor breadcrumb whenever slug or tree changes
  useEffect(() => {
    if (!tree.length) return;
    const flat = flatten(tree);
    const found = findBySlug(flat, slug);
    setNode(found || null);
    setActiveChild(null);

    if (found) {
      // Build ancestor chain
      const chain = [];
      let cur = found;
      while (cur.parentId) {
        const parent = flat.find((n) => String(n._id) === String(cur.parentId));
        if (!parent) break;
        chain.unshift(parent);
        cur = parent;
      }
      setAncestors(chain);
    }
  }, [slug, tree]);

  // Fetch all courses (uses redux cache)
  useEffect(() => {
    const isFresh = allCourses.length > 0 && (Date.now() - lastFetched < 300_000); // 5 min cache
    if (!isFresh) {
      dispatch(fetchCourses({ page: 1 }));
    }
  }, [dispatch, allCourses.length, lastFetched]);

  // Infinite scroll
  useEffect(() => {
    if (loading || loadingMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore)
          dispatch(fetchCourses({ page: currentPage + 1, append: true }));
      },
      { rootMargin: "300px" }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    observerRef.current = obs;
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [loading, loadingMore, hasMore, currentPage, dispatch]);

  const handleEnroll = async (courseId) => {
    if (!user) return alert("Please log in to enroll.");
    const r = await dispatch(enroll({ courseId, paymentMethod: "card" }));
    if (enroll.fulfilled.match(r)) {
      alert("Enrolled!");
      navigate(`/student-dashboard/courses/${courseId}`);
    } else {
      alert(`Enrollment failed: ${r.payload}`);
    }
  };

  // Filter courses by selected subject node + optional child filter
  const targetNode = activeChild || node;
  const matchNames = useMemo(
    () => targetNode ? descendantNames(targetNode) : null,
    [targetNode]
  );

  const filtered = useMemo(() => {
    let list = [...allCourses];
    if (matchNames) list = list.filter((c) => matchNames.has((c.subject || "").toLowerCase()));
    switch (sortBy) {
      case "rating":     list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;

      default:           list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [allCourses, matchNames, sortBy]);

  if (treeLoad) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
    </div>
  );

  if (!node) return (
    <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
      <p style={{ fontSize: 18, fontWeight: 600 }}>Subject not found.</p>
      <Link to="/catalog" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
        ← Back to Catalog
      </Link>
    </div>
  );

  const children = node.children || [];

  return (
    <div>
      {/* ── Breadcrumb + title (inline, no full-page header) ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              background: "#f1f5f9", border: "none", borderRadius: "50%", 
              width: 32, height: 32, display: "flex", alignItems: "center", 
              justifyContent: "center", cursor: "pointer", color: "#64748b" 
            }}
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12,
            color: "#9ca3af", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/student-dashboard/catalog")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12,
                color: "#6366f1", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <Home size={12} /> Catalog
            </button>
            {ancestors.map((anc) => (
              <React.Fragment key={anc._id}>
                <ChevronRight size={11} />
                <button onClick={() => navigate(`/student-dashboard/catalog/subject/${anc.slug}`)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12,
                    color: "#6366f1", padding: 0 }}>
                  {anc.emoji} {anc.name}
                </button>
              </React.Fragment>
            ))}
            <ChevronRight size={11} />
            <span style={{ color: "#374151", fontWeight: 600 }}>{node.emoji} {node.name}</span>
          </nav>
        </div>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
            {node.emoji} {node.name}
          </h1>
          <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6",
            borderRadius: 10, padding: "2px 10px" }}>
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Sub-topic pills ── */}
      {children.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            <Filter size={11} /> Topics:
          </span>
          <button onClick={() => setActiveChild(null)}
            style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1.5px solid " + (!activeChild ? "#7c3aed" : "#e5e7eb"),
              background: !activeChild ? "#ede9fe" : "white",
              color: !activeChild ? "#5b21b6" : "#374151", cursor: "pointer" }}>
            All
          </button>
          {children.map((c) => {
            const isActive = activeChild && String(activeChild._id) === String(c._id);
            return (
              <button key={c._id} onClick={() => setActiveChild(isActive ? null : c)}
                style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: "1.5px solid " + (isActive ? "#7c3aed" : "#e5e7eb"),
                  background: isActive ? "#ede9fe" : "white",
                  color: isActive ? "#5b21b6" : "#374151", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{c.emoji}</span> {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Sort bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          {activeChild && <>Filtered: <strong>{activeChild.name}</strong> · </>}
          <strong>{filtered.length}</strong> courses
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={13} style={{ color: "#9ca3af" }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8,
              fontSize: 12, color: "#374151", background: "white", cursor: "pointer", outline: "none" }}>
            <option value="newest">Newest First</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* ── Child subject cards (drill deeper) ── */}
      {!activeChild && children.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", margin: "0 0 12px" }}>Browse by Topic</h2>
          <div className="domain-grid">
            {children.map((c) => (
              <button key={c._id}
                onClick={() => navigate(`/student-dashboard/catalog/subject/${c.slug}`)}
                style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
                  padding: "14px 16px", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.18s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.transform = "none"; }}>
                <span style={{ fontSize: 24 }}>{c.emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", margin: 0 }}>{c.name}</p>
                  {c.children?.length > 0 && (
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                      {c.children.length} sub-topic{c.children.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <ChevronRight size={13} style={{ marginLeft: "auto", color: "#d1d5db" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Course grid ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
          <BookOpen size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ fontSize: 14 }}>No courses found{activeChild ? ` in ${activeChild.name}` : ""} yet.</p>
          {activeChild && (
            <button onClick={() => setActiveChild(null)}
              style={{ marginTop: 10, padding: "8px 18px", borderRadius: 8, border: "1px solid #e5e7eb",
                background: "white", fontSize: 13, cursor: "pointer", color: "#374151" }}>
              Show all {node.name} courses
            </button>
          )}
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", margin: "0 0 12px" }}>
              {activeChild ? `${activeChild.emoji} ${activeChild.name} Courses` : "All Courses"}
            </h2>
          )}
          <div className="course-grid">
            {filtered.map((c, i) => (
              <CourseCard key={c._id + i} course={c} onEnroll={handleEnroll} user={user} />
            ))}
          </div>
        </>
      )}

      <div ref={sentinelRef} style={{ height: 10 }} />
      {loadingMore && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16, color: "#6b7280", fontSize: 13 }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading more…
        </div>
      )}
    </div>
  );
};

export default SubjectBrowsePage;
