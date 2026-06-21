// backend/controllers/exploreController.js
// Fetches personalised YouTube videos + Dev.to articles based on student interests.
// YouTube requires YOUTUBE_API_KEY in .env (optional – skipped if absent).
// Dev.to is completely free with no API key needed.

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DEVTO_BASE      = "https://dev.to/api/articles";

// Use exact interest name — no creative phrases, strictly on-topic
const toYoutubeQuery = (interest) =>
  `${interest} tutorial explained`; // direct topic, YouTube Education filter handles the rest

const toDevtoTag = (interest) =>
  interest.toLowerCase().replace(/[\s_-]+/g, "").replace(/[^a-z0-9]/g, "");

// ── Fetch YouTube videos for a query ─────────────────────────────────────────
const fetchYoutube = async (interest, maxResults = 2) => {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const query = toYoutubeQuery(interest);
    // videoCategoryId=27 = Education; safeSearch=strict
    // Randomise order each call so refresh returns different videos
    const orders = ["relevance", "date", "viewCount"];
    const order  = orders[Math.floor(Math.random() * orders.length)];
    const url = [
      "https://www.googleapis.com/youtube/v3/search",
      `?part=snippet`,
      `&type=video`,
      `&maxResults=${maxResults}`,
      `&q=${encodeURIComponent(query)}`,
      `&key=${YOUTUBE_API_KEY}`,
      `&videoCategoryId=27`,
      `&safeSearch=strict`,
      `&relevanceLanguage=en`,
      `&order=${order}`,
    ].join("");
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item) => ({
      type:        "video",
      id:          item.id.videoId,
      title:       item.snippet.title,
      description: item.snippet.description?.slice(0, 120) || "",
      thumbnail:   item.snippet.thumbnails?.medium?.url || "",
      channel:     item.snippet.channelTitle,
      url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
      tag:         interest,
    }));
  } catch {
    return [];
  }
};


// ── Fetch Dev.to articles for a tag ──────────────────────────────────────────
const fetchDevto = async (tag, perPage = 3) => {
  try {
    // Random page (1–10) so refresh surfaces different articles
    const page = Math.floor(Math.random() * 10) + 1;
    const url  = `${DEVTO_BASE}?tag=${encodeURIComponent(tag)}&per_page=${perPage}&page=${page}`;
    const res  = await fetch(url, {
      headers: { "User-Agent": "Izumi-ELearning/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((a) => ({
      type:        "article",
      id:          String(a.id),
      title:       a.title,
      description: a.description?.slice(0, 140) || "",
      thumbnail:   a.cover_image || a.social_image || "",
      author:      a.user?.name || "Dev.to",
      url:         a.url,
      readingTime: a.reading_time_minutes,
      reactions:   a.positive_reactions_count,
      publishedAt: a.published_at,
      tag,
    }));
  } catch {
    return [];
  }
};

// ── Shuffle array (Fisher-Yates) ──────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── GET /api/explore/feed ─────────────────────────────────────────────────────
exports.getFeed = async (req, res) => {
  try {
    const user = req.session?.user;
    // Get interests from user profile (passed via query param or session)
    const rawInterests = req.query.interests
      ? req.query.interests.split(",")
      : user?.interests || [];

    // Fallback topics if no interests set
    const interests = rawInterests.length > 0
      ? rawInterests.slice(0, 4)
      : ["physics", "mathematics", "technology", "psychology"];

    // Fetch in parallel for all interests
    const fetches = interests.flatMap((interest) => [
      fetchYoutube(interest, 2),
      fetchDevto(toDevtoTag(interest), 3),
    ]);

    const results  = await Promise.all(fetches);
    const combined = results.flat();

    // Deduplicate by id
    const seen = new Set();
    const unique = combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Shuffle for variety
    const feed = shuffle(unique);

    res.json({
      feed,
      interests,
      youtubeEnabled: !!YOUTUBE_API_KEY,
      total: feed.length,
    });
  } catch (err) {
    console.error("Explore feed error:", err);
    res.status(500).json({ error: err.message });
  }
};
