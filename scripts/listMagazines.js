const { Magazine } = require("../required/db");

async function list() {
  try {
    const mags = await Magazine.find().lean();
    console.log(`Found ${mags.length} magazines:`);
    mags.forEach((m, i) => {
      console.log(
        `${i + 1}. ${m.title} - ${m.content_url} (image: ${
          m.image_url ? "yes" : "no"
        })`
      );
    });
    process.exit(0);
  } catch (err) {
    console.error("Error listing magazines:", err);
    process.exit(1);
  }
}

if (require.main === module) list();
module.exports = list;
