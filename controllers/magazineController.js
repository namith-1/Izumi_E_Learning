const Magazine = require("../required/db.js").Magazine; // Adjust the path if needed

// Controller: serve JSON response for magazines
// - Returns JSON list of magazines for React frontend
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

    // Always return JSON for React frontend
    return res.json(magazines);
  } catch (err) {
    console.error("Error in magazineController.index:", err);
    res.status(500).json({ error: "Error fetching magazines", details: err.message });
  }
};
