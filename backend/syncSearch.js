const mongoose = require("mongoose");
const Course = require("./models/Course");
const Teacher = require("./models/Teacher");
const searchService = require("./services/searchService");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

async function syncAll() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Fetching all courses...");
    const courses = await Course.find().populate("teacherId", "name");
    
    const formattedCourses = courses.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      subject: c.subject,
      instructorName: c.teacherId?.name || "Unknown",
      imageUrl: c.imageUrl,
      rating: c.rating
    }));

    console.log(`Syncing ${formattedCourses.length} courses to Meilisearch...`);
    await searchService.indexAllCourses(formattedCourses);
    
    console.log("Sync complete!");
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

syncAll();
