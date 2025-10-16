const { Magazine } = require("../required/db");

async function dedupe() {
  try {
    console.log("Starting magazine dedupe...");
    const mags = await Magazine.find().sort({ title: 1, _id: -1 }).lean();
    const seen = new Set();
    const toRemove = [];
    for (const m of mags) {
      const key = (m.title || "").trim().toLowerCase();
      if (seen.has(key)) {
        toRemove.push(m._id);
      } else {
        seen.add(key);
      }
    }
    if (toRemove.length === 0) {
      console.log("No duplicates found.");
      process.exit(0);
    }
    console.log(`Found ${toRemove.length} duplicates. Removing...`);
    await Magazine.deleteMany({ _id: { $in: toRemove } });
    console.log("Duplicates removed.");
    process.exit(0);
  } catch (err) {
    console.error("Dedupe error:", err);
    process.exit(1);
  }
}

if (require.main === module) dedupe();
module.exports = dedupe;
