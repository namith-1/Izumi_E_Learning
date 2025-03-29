db.serialize(() => {
    // Create instructors table
    db.run(`CREATE TABLE IF NOT EXISTS instructors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        address TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0  -- Soft delete column (0 = active, 1 = deleted)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teacher(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        address TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0  -- Soft delete column (0 = active, 1 = deleted)
    )`);

    // Create courses table with instructor_id from the start
    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        teacher_id INTEGER
    )`);

    // Insert sample data into courses
    db.run(`INSERT INTO courses (title, instructor_id) VALUES 
        ('JavaScript for Beginners', 1),
        ('Advanced Data Structures', 2),
        ('Web Development Bootcamp', 1),
        ('Machine Learning Fundamentals', 3),
        ('Python for Data Science', 2),
        ('Cybersecurity Essentials', 3)
    `);

    // Create students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);

    db.run(`ALTER TABLE students ADD COLUMN hashed_password TEXT`);

    db.run(`INSERT INTO students (name, email) VALUES ('Namith', 'a@gmail.com')`);



    // Create enrollments table
    db.run(`CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        FOREIGN KEY (student_id) REFERENCES instructors(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        UNIQUE (student_id, course_id) -- Prevent duplicate enrollments
    )`);

    // Create magazines table
    db.run(`CREATE TABLE IF NOT EXISTS magazines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL
    )`);

    // Insert sample data into magazines
    const stmt = db.prepare(`INSERT INTO magazines (title, description, image_url) VALUES (?, ?, ?)`);

    for (let i = 1; i <= 20; i++) {
        stmt.run(`Magazine ${i}`, `Description of Magazine ${i}`, `./test.jpg`);
    }

    stmt.finalize();

    // Create course_stats table (fixed issue with missing review_count column)
    db.run(`CREATE TABLE IF NOT EXISTS course_stats (
        course_id INTEGER PRIMARY KEY, 
        enrolled_count INTEGER DEFAULT 0, 
        avg_rating REAL DEFAULT 0, 
        avg_completion_time INTEGER DEFAULT 0, 
        review_count INTEGER DEFAULT 0,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // Insert sample data into course_stats (fixed 'NSERT' typo)
    db.run(`INSERT INTO course_stats (course_id, enrolled_count, avg_rating, avg_completion_time, review_count) VALUES
        (1, 1200, 4.5, 8, 300),  -- JavaScript for Beginners
        (2, 850, 4.7, 15, 220),  -- Advanced Data Structures
        (3, 1500, 4.6, 20, 500), -- Web Development Bootcamp
        (4, 900, 4.8, 25, 180)   -- Machine Learning Fundamentals
    `);

    // Create modules table
    db.run(`CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        parent_id INTEGER,
        title TEXT NOT NULL,
        text TEXT DEFAULT '',
        url TEXT DEFAULT '',
        FOREIGN KEY(course_id) REFERENCES courses(id),
        FOREIGN KEY(parent_id) REFERENCES modules(id)
    )`);
});

app.get("/course-edit", (req, res) => {
    //if (!req.session.instructor) return res.status(403).send("Unauthorized.");
    res.sendFile(path.join(__dirname,"public","course.html"));
});


app.post("/save-course", (req, res) => {
    if (!req.session.instructor) return res.status(403).json({ error: "Unauthorized." });

    const { title, modules } = req.body;
    const instructorId = req.session.instructor;

    db.run("INSERT INTO courses (title, instructor_id) VALUES (?, ?)", [title, instructorId], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const courseId = this.lastID;

        const insertModule = (mod, parentId = null) => {
            db.run(
                "INSERT INTO modules (course_id, parent_id, title, text, url) VALUES (?, ?, ?, ?, ?)",
                [courseId, parentId, mod.title || "", mod.text || "", mod.url || ""],
                function (err) {
                    if (err) {
                        console.error("Error inserting module:", err.message);
                        return;
                    }

                    const moduleId = this.lastID;
                    if (mod.subModules && mod.subModules.length > 0) {
                        mod.subModules.forEach((sub) => insertModule(sub, moduleId));
                    }
                }
            );
        };

        if (modules.length > 0) {
            modules.forEach((mod) => insertModule(mod));
        }

        res.json({ message: "Course saved successfully!", courseId });
    });
});

app.get("/instructor-courses", (req, res) => {
    if (!req.session.instructor) return res.status(403).json({ error: "Unauthorized." });

    const instructorId = req.session.instructor;
    db.all("SELECT id, title FROM courses WHERE instructor_id = ?", [instructorId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



app.get("/instructor-dashboard", (req, res) => {
    if (!req.session.instructor) return res.status(403).send("Unauthorized.");
    res.sendFile(path.join(__dirname, "instructor_courses.html"));
});
