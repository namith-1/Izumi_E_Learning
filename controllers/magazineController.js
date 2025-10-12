const Magazine = require("../required/db.js").Magazine; // Adjust the path if needed

// Controller: serve either HTML (EJS) or JSON for dynamic loading.
// - If client requests JSON (Accept: application/json) or uses ?lastId=, return JSON list.
// - Otherwise render the `magazine/index` EJS view with magazines.
exports.index = async (req, res) => {
  try {
    // Simple pagination by ObjectId string: return records with _id > lastId if provided
    const { lastId, limit } = req.query;
    const pageLimit = parseInt(limit, 10) || 10;

    let query = {};
    if (lastId) {
      // When lastId provided, fetch documents with _id greater than lastId (lexicographic)
      // This assumes ObjectId string ordering; for stable pagination consider using createdAt.
      query = { _id: { $gt: lastId } };
    }

    const magazines = await Magazine.find(query).limit(pageLimit).lean();

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
