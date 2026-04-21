const { Meilisearch } = require("meilisearch");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const client = new Meilisearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY || "masterKey",
});

const index = client.index("courses");

const searchService = {
  // Sync a single course
  syncCourse: async (course) => {
    try {
      await index.addDocuments([
        {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          subject: course.subject,
          instructorName: course.instructorName || "",
          imageUrl: course.imageUrl || "",
          rating: course.rating || 0,
        },
      ]);
    } catch (err) {
      console.error("Meilisearch Sync Error:", err);
    }
  },

  // Delete a course from index
  deleteCourse: async (courseId) => {
    try {
      await index.deleteDocument(courseId.toString());
    } catch (err) {
      console.error("Meilisearch Delete Error:", err);
    }
  },

  // Search courses
  search: async (query, options = {}) => {
    try {
      const results = await index.search(query, {
        limit: options.limit || 20,
        attributesToHighlight: ["title", "description"],
        ...options,
      });
      return results;
    } catch (err) {
      console.error("Meilisearch Search Error:", err);
      return { hits: [] };
    }
  },

  // Batch sync (Initial)
  indexAllCourses: async (courses) => {
    try {
      const documents = courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        subject: c.subject,
        instructorName: c.instructorName || "",
        imageUrl: c.imageUrl || "",
        rating: c.rating || 0,
      }));
      await index.addDocuments(documents);
    } catch (err) {
      console.error("Meilisearch Batch Sync Error:", err);
    }
  },
};

module.exports = searchService;
