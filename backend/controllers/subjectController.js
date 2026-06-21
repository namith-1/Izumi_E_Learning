// backend/controllers/subjectController.js
const Subject = require("../models/Subject");

// ── GET /api/subjects — returns full approved tree ────────────────────────────
exports.getTree = async (req, res) => {
  try {
    const all = await Subject.find({ status: "approved" })
      .select("_id name slug emoji level parentId path")
      .sort({ level: 1, name: 1 })
      .lean();

    // Build nested tree
    const byId = {};
    all.forEach((s) => { byId[String(s._id)] = { ...s, children: [] }; });
    const roots = [];
    all.forEach((s) => {
      if (s.parentId) {
        const p = byId[String(s.parentId)];
        if (p) p.children.push(byId[String(s._id)]);
      } else {
        roots.push(byId[String(s._id)]);
      }
    });
    res.json(roots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/subjects/flat — flat list (for search/filter dropdowns) ──────────
exports.getFlat = async (req, res) => {
  try {
    const all = await Subject.find({ status: "approved" })
      .select("_id name slug emoji level parentId path")
      .sort({ level: 1, name: 1 })
      .lean();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/subjects/propose — instructor proposes a new topic ──────────────
exports.propose = async (req, res) => {
  try {
    const { name, parentId, emoji } = req.body;
    const user = req.session.user;

    if (!name || !name.trim())
      return res.status(400).json({ message: "Topic name is required." });

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await Subject.findOne({ slug });
    if (existing)
      return res.status(409).json({ message: "A topic with this name already exists.", existing });

    let level = 0;
    let path = slug;
    let parent = null;
    if (parentId) {
      parent = await Subject.findById(parentId);
      if (!parent) return res.status(404).json({ message: "Parent topic not found." });
      level = parent.level + 1;
      path = `${parent.path}.${slug}`;
    }

    const proposal = await Subject.create({
      name: name.trim(),
      slug,
      emoji: emoji || "📚",
      parentId: parentId || null,
      path,
      level,
      status: "pending",
      proposedBy: user.id,
      proposedByName: user.name,
    });

    res.status(201).json({ message: "Topic proposal submitted for review.", proposal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/subjects/pending — reviewer sees all pending proposals ────────────
exports.getPending = async (req, res) => {
  try {
    const pending = await Subject.find({ status: "pending" })
      .populate("parentId", "name slug")
      .sort({ createdAt: 1 })
      .lean();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/subjects/:id/review — reviewer approves or rejects ───────────────
exports.review = async (req, res) => {
  try {
    const { action, reviewNote } = req.body; // action: "approve" | "reject"
    const user = req.session.user;

    if (!["approve", "reject"].includes(action))
      return res.status(400).json({ message: 'action must be "approve" or "reject".' });

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Topic not found." });
    if (subject.status !== "pending")
      return res.status(400).json({ message: "Topic is not pending review." });

    subject.status = action === "approve" ? "approved" : "rejected";
    subject.reviewedBy = user.id;
    subject.reviewNote = reviewNote || "";
    await subject.save();

    res.json({ message: `Topic ${action}d.`, subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
