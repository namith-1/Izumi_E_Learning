// backend/scripts/seedSubjects.js
// Run once: node backend/scripts/seedSubjects.js
// Seeds the canonical subject hierarchy into the Subject collection.
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Subject = require("../models/Subject");

const SEED = [
  // ─── Level 0: Root Domains ───────────────────────────────────────────────
  { slug: "technology",    name: "Technology & Computing",   emoji: "💻", level: 0 },
  { slug: "science",       name: "Science",                  emoji: "🔬", level: 0 },
  { slug: "mathematics",   name: "Mathematics",              emoji: "📐", level: 0 },
  { slug: "business",      name: "Business & Management",    emoji: "💼", level: 0 },
  { slug: "creative",      name: "Creative Arts & Design",   emoji: "🎨", level: 0 },
  { slug: "language",      name: "Language & Communication", emoji: "🗣️", level: 0 },
  { slug: "health",        name: "Health & Medicine",        emoji: "🏥", level: 0 },
  { slug: "humanities",    name: "Humanities & Social Science", emoji: "🌍", level: 0 },

  // ─── Level 1 under Technology ────────────────────────────────────────────
  { slug: "web-development",     name: "Web Development",      emoji: "🌐", level: 1, parentSlug: "technology" },
  { slug: "mobile-development",  name: "Mobile Development",   emoji: "📱", level: 1, parentSlug: "technology" },
  { slug: "data-science",        name: "Data Science",         emoji: "📊", level: 1, parentSlug: "technology" },
  { slug: "artificial-intelligence", name: "Artificial Intelligence", emoji: "🤖", level: 1, parentSlug: "technology" },
  { slug: "cybersecurity",       name: "Cybersecurity",        emoji: "🔒", level: 1, parentSlug: "technology" },
  { slug: "cloud-computing",     name: "Cloud Computing",      emoji: "☁️", level: 1, parentSlug: "technology" },
  { slug: "devops",              name: "DevOps & CI/CD",       emoji: "⚙️", level: 1, parentSlug: "technology" },
  { slug: "databases",           name: "Databases",            emoji: "🗄️", level: 1, parentSlug: "technology" },
  { slug: "blockchain",          name: "Blockchain",           emoji: "🔗", level: 1, parentSlug: "technology" },
  { slug: "game-development",    name: "Game Development",     emoji: "🎮", level: 1, parentSlug: "technology" },

  // ─── Level 2 under Web Development ───────────────────────────────────────
  { slug: "frontend",     name: "Frontend (HTML/CSS/JS)",  emoji: "🖥️", level: 2, parentSlug: "web-development" },
  { slug: "backend",      name: "Backend & APIs",          emoji: "🔧", level: 2, parentSlug: "web-development" },
  { slug: "fullstack",    name: "Full-Stack Development",  emoji: "🌐", level: 2, parentSlug: "web-development" },
  { slug: "react",        name: "React & Next.js",         emoji: "⚛️", level: 2, parentSlug: "web-development" },
  { slug: "nodejs",       name: "Node.js & Express",       emoji: "🟩", level: 2, parentSlug: "web-development" },

  // ─── Level 2 under Data Science ──────────────────────────────────────────
  { slug: "machine-learning",  name: "Machine Learning",   emoji: "🧠", level: 2, parentSlug: "data-science" },
  { slug: "deep-learning",     name: "Deep Learning",      emoji: "🔮", level: 2, parentSlug: "data-science" },
  { slug: "data-analysis",     name: "Data Analysis",      emoji: "📈", level: 2, parentSlug: "data-science" },
  { slug: "nlp",               name: "Natural Language Processing", emoji: "💬", level: 2, parentSlug: "data-science" },

  // ─── Level 1 under Science ───────────────────────────────────────────────
  { slug: "physics",     name: "Physics",     emoji: "⚛️", level: 1, parentSlug: "science" },
  { slug: "chemistry",   name: "Chemistry",   emoji: "🧪", level: 1, parentSlug: "science" },
  { slug: "biology",     name: "Biology",     emoji: "🧬", level: 1, parentSlug: "science" },
  { slug: "engineering", name: "Engineering", emoji: "🔧", level: 1, parentSlug: "science" },
  { slug: "astronomy",   name: "Astronomy",   emoji: "🔭", level: 1, parentSlug: "science" },

  // ─── Level 2 under Physics ───────────────────────────────────────────────
  { slug: "mechanics",       name: "Mechanics",                emoji: "⚙️", level: 2, parentSlug: "physics" },
  { slug: "thermodynamics",  name: "Thermodynamics",           emoji: "🌡️", level: 2, parentSlug: "physics" },
  { slug: "electromagnetism",name: "Electromagnetism",         emoji: "⚡", level: 2, parentSlug: "physics" },
  { slug: "quantum-physics", name: "Quantum Physics",          emoji: "🔬", level: 2, parentSlug: "physics" },
  { slug: "relativity",      name: "Relativity",               emoji: "🌌", level: 2, parentSlug: "physics" },

  // ─── Level 2 under Mechanics ─────────────────────────────────────────────
  { slug: "classical-mechanics",  name: "Classical Mechanics",  emoji: "🎯", level: 2, parentSlug: "mechanics" },
  { slug: "fluid-mechanics",      name: "Fluid Mechanics",      emoji: "💧", level: 2, parentSlug: "mechanics" },
  { slug: "solid-mechanics",      name: "Solid Mechanics",      emoji: "🪨", level: 2, parentSlug: "mechanics" },

  // ─── Level 1 under Mathematics ───────────────────────────────────────────
  { slug: "algebra",          name: "Algebra",          emoji: "🔣", level: 1, parentSlug: "mathematics" },
  { slug: "calculus",         name: "Calculus",         emoji: "∫",  level: 1, parentSlug: "mathematics" },
  { slug: "statistics",       name: "Statistics & Probability", emoji: "📉", level: 1, parentSlug: "mathematics" },
  { slug: "discrete-math",    name: "Discrete Mathematics",    emoji: "🔢", level: 1, parentSlug: "mathematics" },
  { slug: "geometry",         name: "Geometry",         emoji: "📐", level: 1, parentSlug: "mathematics" },

  // ─── Level 1 under Business ──────────────────────────────────────────────
  { slug: "entrepreneurship", name: "Entrepreneurship",  emoji: "🚀", level: 1, parentSlug: "business" },
  { slug: "finance",          name: "Finance & Accounting", emoji: "💰", level: 1, parentSlug: "business" },
  { slug: "digital-marketing",name: "Digital Marketing", emoji: "📣", level: 1, parentSlug: "business" },
  { slug: "project-management",name: "Project Management",emoji: "📋", level: 1, parentSlug: "business" },
  { slug: "human-resources",  name: "Human Resources",   emoji: "🤝", level: 1, parentSlug: "business" },
  { slug: "sales",            name: "Sales & CRM",       emoji: "📈", level: 1, parentSlug: "business" },

  // ─── Level 1 under Creative ──────────────────────────────────────────────
  { slug: "graphic-design",   name: "Graphic Design",    emoji: "🎨", level: 1, parentSlug: "creative" },
  { slug: "ux-ui-design",     name: "UX / UI Design",    emoji: "🖼️", level: 1, parentSlug: "creative" },
  { slug: "video-production", name: "Video Production",  emoji: "🎬", level: 1, parentSlug: "creative" },
  { slug: "photography",      name: "Photography",       emoji: "📷", level: 1, parentSlug: "creative" },
  { slug: "music-audio",      name: "Music & Audio",     emoji: "🎵", level: 1, parentSlug: "creative" },
  { slug: "writing-content",  name: "Writing & Content", emoji: "✍️", level: 1, parentSlug: "creative" },

  // ─── Level 1 under Language ──────────────────────────────────────────────
  { slug: "english",          name: "English Language",   emoji: "🇬🇧", level: 1, parentSlug: "language" },
  { slug: "spanish",          name: "Spanish",            emoji: "🇪🇸", level: 1, parentSlug: "language" },
  { slug: "japanese",         name: "Japanese",           emoji: "🇯🇵", level: 1, parentSlug: "language" },
  { slug: "communication",    name: "Communication Skills", emoji: "💬", level: 1, parentSlug: "language" },
  { slug: "leadership",       name: "Leadership",         emoji: "👑", level: 1, parentSlug: "language" },

  // ─── Level 1 under Health ────────────────────────────────────────────────
  { slug: "medicine",         name: "Medicine",            emoji: "💊", level: 1, parentSlug: "health" },
  { slug: "nutrition",        name: "Nutrition & Fitness", emoji: "🥗", level: 1, parentSlug: "health" },
  { slug: "mental-health",    name: "Mental Health",       emoji: "🧘", level: 1, parentSlug: "health" },

  // ─── Level 1 under Humanities ────────────────────────────────────────────
  { slug: "history",          name: "History",      emoji: "🏛️", level: 1, parentSlug: "humanities" },
  { slug: "philosophy",       name: "Philosophy",   emoji: "🤔", level: 1, parentSlug: "humanities" },
  { slug: "economics",        name: "Economics",    emoji: "📉", level: 1, parentSlug: "humanities" },
  { slug: "psychology",       name: "Psychology",   emoji: "🧠", level: 1, parentSlug: "humanities" },
  { slug: "sociology",        name: "Sociology",    emoji: "👥", level: 1, parentSlug: "humanities" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // First pass: insert root nodes (level 0)
  const slugToId = {};
  for (const s of SEED.filter((x) => x.level === 0)) {
    const exists = await Subject.findOne({ slug: s.slug });
    if (exists) { slugToId[s.slug] = exists._id; continue; }
    const doc = await Subject.create({ name: s.name, slug: s.slug, emoji: s.emoji, level: 0, path: s.slug });
    slugToId[s.slug] = doc._id;
    console.log("  ✓ seeded root:", s.slug);
  }
  // Second pass: level 1
  for (const s of SEED.filter((x) => x.level === 1)) {
    const exists = await Subject.findOne({ slug: s.slug });
    if (exists) { slugToId[s.slug] = exists._id; continue; }
    const parentId = slugToId[s.parentSlug];
    const path = `${s.parentSlug}.${s.slug}`;
    const doc = await Subject.create({ name: s.name, slug: s.slug, emoji: s.emoji, level: 1, parentId, path });
    slugToId[s.slug] = doc._id;
    console.log("  ✓ seeded l1:", s.slug);
  }
  // Third pass: level 2
  for (const s of SEED.filter((x) => x.level === 2)) {
    const exists = await Subject.findOne({ slug: s.slug });
    if (exists) { slugToId[s.slug] = exists._id; continue; }
    const parentDoc = await Subject.findOne({ slug: s.parentSlug });
    const parentId = parentDoc?._id;
    const path = parentDoc ? `${parentDoc.path}.${s.slug}` : s.slug;
    const doc = await Subject.create({ name: s.name, slug: s.slug, emoji: s.emoji, level: 2, parentId, path });
    slugToId[s.slug] = doc._id;
    console.log("  ✓ seeded l2:", s.slug);
  }
  console.log("Seeding complete.");
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
