const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "views", "course.ejs");
const tpl = fs.readFileSync(file, "utf8");

const locals = {
  course: { id: "64abc123def", title: "Test Course", review_count: 12 },
  navLinks: [],
  sections: [],
};

// Add courseId like the controller does
locals.courseId = String(locals.course.id);

try {
  const out = ejs.render(tpl, locals, { filename: file });
  console.log("Rendered successfully, length:", out.length);
} catch (err) {
  console.error("Render error:", err);
  process.exit(1);
}
