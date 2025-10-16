const Magazine = require("../required/db.js").Magazine; // Adjust the path if needed

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
      // When lastId provided, fetch documents with _id greater than lastId (lexicographic)
      // This assumes ObjectId string ordering; for stable pagination consider using createdAt.
      // If lastId provided, use ObjectId comparison when possible
      try {
        const mongoose = require("mongoose");
        query = { _id: { $gt: mongoose.Types.ObjectId(lastId) } };
      } catch (e) {
        // fallback to string compare if lastId isn't a valid ObjectId
        query = { _id: { $gt: lastId } };
      }
    }

    // Sort by newest first so recently seeded/updated magazines appear at the top
    const magazines = await Magazine.find(query)
      .sort({ _id: -1 })
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
    res.status(500).send("Error fetching magazines");
  }
};
