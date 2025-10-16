const Magazine = require("../required/db.js").Magazine; // Adjust the path if needed
const mongoose = require("mongoose"); // <-- Import mongoose at the top

// Controller: serve either HTML (EJS) or JSON for dynamic loading.
// - If client requests JSON (Accept: application/json) or uses ?lastId=, return JSON list.
// - Otherwise render the `magazine/index` EJS view with magazines.
exports.index = async (req, res) => {
  try {
    // Simple pagination by ObjectId string: return records with _id > lastId if provided
    const { lastId, limit } = req.query;
    // show more by default so changes are visible in the UI
    const pageLimit = parseInt(limit, 10) || 20;

    let query = {};
    if (lastId) {
      // 🐛 FIX START 🐛: Check if lastId is a valid ObjectId before using it for comparison.
      // If it's invalid (like "0"), we ignore it and treat it as the first page (query remains {}).
      if (mongoose.Types.ObjectId.isValid(lastId)) {
        // When lastId provided and valid, fetch documents with _id greater than lastId
        // This is correct for cursor-based pagination on _id.
        query = { _id: { $gt: mongoose.Types.ObjectId(lastId) } };
      }
      // 🐛 FIX END 🐛
      // Note: The previous logic of falling back to string comparison is removed,
      // as string comparison on ObjectId is risky/unstable for pagination.
      // An invalid lastId will now result in an empty query, loading the first page.
    }

    // Sort by newest first so recently seeded/updated magazines appear at the top
    const magazines = await Magazine.find(query)
      .sort({ _id: -1 }) // Sort by newest first
      .limit(pageLimit)
      .lean();

    // If the request expects JSON (AJAX) or had lastId, return JSON
    const acceptsJson =
      req.xhr || req.get("Accept")?.includes("application/json") || lastId;
    if (acceptsJson) {
      return res.json(magazines);
    }

    // Otherwise render HTML view
    res.render("magazine/index", { magazines });
  } catch (err) {
    console.error("Error in magazineController.index:", err);
    // Send a clearer 400 response if the error is related to bad input,
    // though the above fix should handle the CastError.
    if (err.name === 'CastError') {
        return res.status(400).send("Invalid ID format provided.");
    }
    res.status(500).send("Error fetching magazines");
  }
};