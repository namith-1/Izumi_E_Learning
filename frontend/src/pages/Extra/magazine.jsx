// frontend/src/pages/Extra/magazine.jsx
// Personalised Explore page — YouTube videos + Dev.to articles based on student interests.
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { BACKEND_URL } from "../../store";
import {
  Youtube, BookOpen, RefreshCw, ExternalLink, Clock, ThumbsUp,
  Compass, AlertCircle, Loader2, Tv,
} from "lucide-react";
import "./magazine.css";

const API = BACKEND_URL.replace(/\/$/, "") + "/api";

// ── Video Card ────────────────────────────────────────────────────────────────
const VideoCard = ({ item }) => (
  <a href={item.url} target="_blank" rel="noopener noreferrer"
    style={{ textDecoration: "none", display: "block" }}>
    <div className="feed-card feed-card--video"
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
      <div className="feed-card__thumb">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Youtube size={32} color="#ff0000" />
            </div>}
        <div className="feed-card__play-overlay">
          <div className="feed-card__play-btn">▶</div>
        </div>
        <span className="feed-card__type-badge feed-card__type-badge--video">
          <Youtube size={10} /> YouTube
        </span>
      </div>
      <div className="feed-card__body">
        <p className="feed-card__title">{item.title}</p>
        <p className="feed-card__meta">{item.channel}</p>
        <p className="feed-card__desc">{item.description}</p>
      </div>
    </div>
  </a>
);

// ── Article Card ──────────────────────────────────────────────────────────────
const ArticleCard = ({ item }) => (
  <a href={item.url} target="_blank" rel="noopener noreferrer"
    style={{ textDecoration: "none", display: "block" }}>
    <div className="feed-card feed-card--article"
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
      {item.thumbnail && (
        <div className="feed-card__thumb feed-card__thumb--short">
          <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <span className="feed-card__type-badge feed-card__type-badge--article">
            <BookOpen size={10} /> Article
          </span>
        </div>
      )}
      <div className="feed-card__body">
        {!item.thumbnail && (
          <span className="feed-card__type-badge feed-card__type-badge--article" style={{ position: "static", marginBottom: 8, display: "inline-flex" }}>
            <BookOpen size={10} /> Article
          </span>
        )}
        <p className="feed-card__title">{item.title}</p>
        <p className="feed-card__meta">{item.author} · {item.tag}</p>
        <p className="feed-card__desc">{item.description}</p>
        <div className="feed-card__footer">
          {item.readingTime && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#9ca3af" }}>
              <Clock size={10} /> {item.readingTime} min read
            </span>
          )}
          {item.reactions > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#9ca3af" }}>
              <ThumbsUp size={10} /> {item.reactions}
            </span>
          )}
          <ExternalLink size={11} style={{ marginLeft: "auto", color: "#9ca3af" }} />
        </div>
      </div>
    </div>
  </a>
);

// ── Magazine (Explore) ────────────────────────────────────────────────────────
const Magazine = () => {
  const { user } = useSelector((s) => s.auth);
  const [feed,     setFeed]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [meta,     setMeta]     = useState({ interests: [], youtubeEnabled: false, total: 0 });
  const [filter,   setFilter]   = useState("all");  // "all" | "video" | "article"

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/explore/feed`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load feed");
      setFeed(data.feed || []);
      setMeta({ interests: data.interests || [], youtubeEnabled: data.youtubeEnabled, total: data.total || 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const displayed = feed.filter((item) => filter === "all" || item.type === filter);
  const videoCount   = feed.filter((i) => i.type === "video").length;
  const articleCount = feed.filter((i) => i.type === "article").length;

  return (
    <div className="magazine-page-container">
      {/* ── Header ── */}
      <div className="dashboard-intro">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="mag-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Compass size={26} style={{ color: "#6366f1" }} /> Izumi Explore
            </h1>
            <p className="mag-subtitle">
              Personalised videos & articles based on your interests:&nbsp;
              {meta.interests.map((i) => (
                <span key={i} style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: 10,
                  padding: "1px 8px", fontSize: 12, marginRight: 4, fontWeight: 600 }}>
                  {i}
                </span>
              ))}
            </p>
            {!meta.youtubeEnabled && !loading && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                💡 Add <code>YOUTUBE_API_KEY</code> to backend <code>.env</code> to enable YouTube videos.
              </p>
            )}
          </div>
          <button onClick={loadFeed} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              border: "1px solid #e5e7eb", borderRadius: 8, background: "white",
              fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 500 }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[
            { key: "all",     label: `All (${meta.total})` },
            { key: "video",   label: `📹 Videos (${videoCount})` },
            { key: "article", label: `📄 Articles (${articleCount})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: "1.5px solid " + (filter === key ? "#6366f1" : "#e5e7eb"),
                background: filter === key ? "#ede9fe" : "white",
                color: filter === key ? "#4f46e5" : "#374151", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          gap: 12, padding: 60, color: "#6366f1" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Curating your personalised feed…</span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fef2f2",
          border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#b91c1c",
          fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <Tv size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15 }}>No {filter !== "all" ? filter + "s" : "content"} found.</p>
          <p style={{ fontSize: 12 }}>Set interests in Settings to get personalised content.</p>
        </div>
      )}

      {/* ── Feed grid ── */}
      {!loading && displayed.length > 0 && (
        <div className="explore-grid">
          {displayed.map((item) =>
            item.type === "video"
              ? <VideoCard key={item.id} item={item} />
              : <ArticleCard key={item.id} item={item} />
          )}
        </div>
      )}
    </div>
  );
};

export default Magazine;