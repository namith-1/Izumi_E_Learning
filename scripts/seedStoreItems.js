// scripts/seedStoreItems.js
// Usage: node scripts/seedStoreItems.js

const { seedStoreItems } = require("../required/db");

async function main() {
  try {
    await seedStoreItems();
    console.log("Seed completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
