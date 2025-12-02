// scripts/seedCredits.js
// Run with: node scripts/seedCredits.js

const CreditsModel = require("../models/creditsModel");
const { Student } = require("../required/db");

async function main() {
  try {
    const students = await Student.find();
    console.log(`Found ${students.length} students. Initializing credits...`);
    for (const s of students) {
      const c = await CreditsModel.initializeCredits(s._id);
      console.log(
        `Initialized credits for ${s._id} (${
          s.name || s.email || "unknown"
        }) -> ${c.total_credits}`
      );
    }
    console.log("All students initialized.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding credits:", err);
    process.exit(1);
  }
}

main();
