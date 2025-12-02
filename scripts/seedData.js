// scripts/seedData.js
// Usage: node scripts/seedData.js

const { seedStoreItems, seedData } = require("../required/db");

async function main() {
  try {
    if (typeof seedData === "function") {
      await seedData();
      console.log("General seed completed.");
    }
    if (typeof seedStoreItems === "function") {
      await seedStoreItems();
      console.log("Store seed completed.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
