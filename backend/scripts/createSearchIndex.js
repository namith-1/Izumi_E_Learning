/**
 * Creates the MongoDB Atlas Search index for the courses collection.
 * 
 * This uses the Lucene engine (same technology as Apache Solr) built into
 * MongoDB Atlas to provide fuzzy search, typo tolerance, and relevance scoring.
 *
 * Usage:  node scripts/createSearchIndex.js
 * 
 * Requires: MongoDB Atlas M0 (Free Tier) or above.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function createSearchIndex() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = db.collection("courses");

    // Define the Atlas Search index (Lucene-powered)
    const indexDefinition = {
      name: "courses_search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            title: {
              type: "string",
              analyzer: "lucene.standard",
            },
            description: {
              type: "string",
              analyzer: "lucene.standard",
            },
            subject: {
              type: "string",
              analyzer: "lucene.standard",
            },
          },
        },
      },
    };

    console.log("Creating Atlas Search index 'courses_search'...");
    console.log("Fields: title, description, subject");
    console.log("Analyzer: lucene.standard (Solr-compatible)");

    await collection.createSearchIndex(indexDefinition);

    console.log("\n✅ Atlas Search index created successfully!");
    console.log("   Index Name: courses_search");
    console.log("   Engine: Apache Lucene (same as Solr)");
    console.log("   Features: Fuzzy matching, typo tolerance, relevance scoring");
    console.log("\n⏳ Note: The index may take 1-2 minutes to become active on Atlas.");

    process.exit(0);
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("✅ Index 'courses_search' already exists. No action needed.");
      process.exit(0);
    }
    console.error("❌ Failed to create search index:", err.message);
    console.log("\n📋 Manual Alternative: Create the index via Atlas UI:");
    console.log("   1. Go to MongoDB Atlas → your cluster → 'Atlas Search' tab");
    console.log("   2. Click 'Create Search Index'");
    console.log("   3. Select 'JSON Editor' and use this definition:");
    console.log(JSON.stringify({
      name: "courses_search",
      mappings: {
        dynamic: false,
        fields: {
          title: { type: "string", analyzer: "lucene.standard" },
          description: { type: "string", analyzer: "lucene.standard" },
          subject: { type: "string", analyzer: "lucene.standard" },
        },
      },
    }, null, 2));
    process.exit(1);
  }
}

createSearchIndex();
