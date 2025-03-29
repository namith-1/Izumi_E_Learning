const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: 'secure-key',
    resave: false,
    saveUninitialized: true,
}));

// Connect to SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening in-memory database:', err.message);
    } else {
        console.log('Connected to the in-memory SQLite database.');
    }
});

// Create table with soft delete column
db.serialize(() => {
    // Create students table (Corrected from instructors)
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        address TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0  -- Soft delete column (0 = active, 1 = deleted)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS instructors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        address TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0  -- Soft delete column (0 = active, 1 = deleted)
    )`);



    // Create courses table with student_id from the start (Corrected from instructor_id)
    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        instructor_id INTEGER
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
    db.run(`CREATE TABLE IF NOT EXISTS students_1 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);

    db.run(`ALTER TABLE students_1 ADD COLUMN hashed_password TEXT`);




    // Create enrollments table
    db.run(`CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(id),
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

    db.run(`CREATE TABLE IF NOT EXISTS student_modules (
        student_id INTEGER,
        module_id INTEGER,
        is_completed INTEGER DEFAULT 0, -- 0 for incomplete, 1 for complete
        PRIMARY KEY (student_id, module_id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (module_id) REFERENCES modules(id)
    )`);

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

// Validation function
const checkPassword = (password) => {
    if (password.length < 6) return "Password must be at least 8 characters long.";
    
    let hasLetter = false, hasDigit = false;

    for (let i = 0; i < password.length; i++) {
        let ch = password[i];
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) hasLetter = true;
        if (ch >= '0' && ch <= '9') hasDigit = true;
    }

    if (!hasLetter) return "Password must contain at least one letter.";
    if (!hasDigit) return "Password must contain at least one number.";
    
    return "Valid";
};

const validateInput = (username, password, email, contact, address) => {
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactRegex = /^\d{10}$/;
    
    if (!usernameRegex.test(username)) return "Invalid username. Must be 3-20 alphanumeric characters.";
    if (!emailRegex.test(email)) return "Invalid email format.";
    if(checkPassword(password) !== "Valid") return "password have one letter and one number"
    if (!contactRegex.test(contact)) return "Invalid contact number. Must be 10 digits.";
    if (!address.trim()) return "Address cannot be empty.";
    
    return null;
};

// Home route
app.get('/', (req, res) => {
  //  res.sendFile(__dirname + '/student/student_home.html');
    if (req.session.student) {
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname, 'landing_page','landing.html'));
    }
});

app.get('/login', (req, res) => {
    if (req.session.student) {
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname, 'login.html'));
    }
});

app.get('/signup', (req, res) => {
    if(req.session.student) return res.redirect('/');
    else
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup', (req, res) => {
   
    const { username, password, email, contact, address } = req.body;
    const error = validateInput(username, password, email, contact, address);
    if (error) return res.status(400).send(error);

    db.get('SELECT * FROM students WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).send('Database error.');
        if (user) {
            if (user.is_deleted === 0) {
                return res.status(400).send('Email already exists.');
            } else {
                if (user.is_deleted === 1){
                    return res.status(400).send(' Account exists but is deleted. Please <a href="/restore.html">restore your account</a>.');

                }
            }
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('Error hashing password.');
            db.run(
                'INSERT INTO students (name, email, contact, address, hashed_password, is_deleted) VALUES (?, ?, ?, ?, ?, 0)',
                [username, email, contact, address, hashedPassword],
                (err) => {
                    if (err) return res.status(500).send('Error signing up.');
                    res.redirect('/login');
                }
            );
        });
    });
});

app.post('/login', (req, res) => {
    

    const { email, password } = req.body;
    db.get('SELECT * FROM students WHERE email = ? AND is_deleted = 0', [email], (err, user) => {
        if (err) return res.status(500).send('Database error.');
        if (!user) return res.status(400).send('Invalid email or password.');

        bcrypt.compare(password, user.hashed_password, (err, match) => {
            if (err) return res.status(500).send('Error comparing passwords.');
            if (match) {
                req.session.student = user.id;
                res.redirect('/');
            } else {
                res.status(400).send('Invalid email or password.');
            }
        });
    });
});

app.get('/login_i', (req, res) => {
    if (req.session.instructor) {
        res.redirect('/instructor-dashboard');
    } else {
        res.sendFile(path.join(__dirname, 'instructor_auth','login_i.html'));
    }
});

app.get('/signup_i', (req, res) => {
    if(req.session.instructor) return res.redirect('/instructor-dashboard');
    else
    res.sendFile(path.join(__dirname, 'instructor_auth','signup_i.html'));
});


app.post('/signup_i', (req, res) => {
    const { username, password, email, contact, address } = req.body;
    const error = validateInput(username, password, email, contact, address);
    if (error) return res.status(400).send(error);

    db.get('SELECT * FROM instructors WHERE email = ?', [email], (err, user) => { // Changed from students to instructor
        if (err) return res.status(500).send('Database error.');
        if (user) {
            if (user.is_deleted === 0) {
                return res.status(400).send('Email already exists.');
            } else {
                if (user.is_deleted === 1) {
                    return res.status(400).send(' Account exists but is deleted. Please <a href="/restore.html">restore your account</a>.');
                }
            }
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('Error hashing password.');
            db.run(
                'INSERT INTO instructors (name, email, contact, address, hashed_password, is_deleted) VALUES (?, ?, ?, ?, ?, 0)', // Changed from students to instructor
                [username, email, contact, address, hashedPassword],
                (err) => {
                    if (err) return res.status(500).send('Error signing up.');
                    res.redirect('/login_i');
                }
            );
        });
    });
});

app.post('/login_i', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM instructors WHERE email = ? AND is_deleted = 0', [email], (err, user) => { // Changed from students to instructor
        if (err) return res.status(500).send('Database error.');
        if (!user) return res.status(400).send('Invalid email or password.');

        bcrypt.compare(password, user.hashed_password, (err, match) => {
            if (err) return res.status(500).send('Error comparing passwords.');
            if (match) {
                req.session.instructor = user.id; // Changed from student to instructor
                res.redirect('/instructor-dashboard');
            } else {
                res.status(400).send('Invalid email or password.');
            }
        });
    });
});


app.get('/home', (req, res) => {
    if (req.session.student) {
        res.sendFile(__dirname + '/student/student_home.html');
    } else {
        res.status(403).send('Unauthorized.');
    }
});



app.get('/profile', (req, res) => {
    if (req.session.student) return res.status(200).sendFile(__dirname+'/update_info.html');
    else res.status(403).send('unathurized');
});

app.put("/updateUser", (req, res) => {
    const { id, field, value } = req.body;

    if (!id || !field || value === undefined) {
        return res.status(400).send("Invalid request parameters.");
    }

    const allowedFields = ["name", "email", "contact", "address"];
    if (!allowedFields.includes(field)) {
        return res.status(400).send("Invalid field.");
    }

    const sql = `UPDATE students SET ${field} = ? WHERE id = ?`;
    db.run(sql, [value, id], function (err) {
        if (err) {
            return res.status(500).send("Error updating user.");
        }
        res.send("User updated successfully.");
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
        res.redirect('/');
    });
});

// Restore route
app.get('/restore', (req, res) => {
    if (req.session.student) {
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname, 'restore.html'));
    }
});

// Soft delete user
app.delete('/delete', (req, res) => {
    if (!req.session.student) return res.status(403).send('Unauthorized.');

    db.run('UPDATE students SET is_deleted = 1 WHERE id = ?', [req.session.student], function (err) {
        if (err) return res.status(500).send('Error deleting user.');
        req.session.destroy();
        res.send('User account soft deleted.');
    });
});

// Restore soft-deleted user
app.post('/restore', (req, res) => {
    const { email } = req.body;
    db.get('SELECT * FROM students WHERE email = ? AND is_deleted = 1', [email], (err, user) => {
        if (err) return res.status(500).send('Database error.');
        if (!user) return res.status(400).send('No deleted user found with this email.');

        db.run('UPDATE students SET is_deleted = 0 WHERE email = ?', [email], function (err) {
            if (err) return res.status(500).send('Error restoring account.');
            res.send('User account restored.');
        });
    });
});


//Get all users (admin use)
app.get('/getUsers', (req, res) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
        if (err) return res.status(500).send('Database error.');
        res.json(rows);
    });
});

// Admin deletes a user (soft delete)
app.delete('/deleteUser', (req, res) => {
    const { id } = req.body;
    db.run('UPDATE students SET is_deleted = 1 WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).send('Error deleting user.');
        res.send('User deleted.');
    });
});

// Admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});



app.get("/load_user_info", (req, res) => {
    if (!req.session.student) {
        return res.status(403).send("Unauthorized.");
    }

    const userId = req.session.student;
    db.get("SELECT id, name, email, contact, address FROM students WHERE id = ?", [userId], (err, row) => {
        if (err) return res.status(500).send("Error fetching user.");
        if (!row) return res.status(404).send("User not found.");
        res.json(row);
    });
});


app.get("/student-dashboard", (req, res) => {
    //if (!req.session.instructor) return res.status(403).send("Unauthorized.");
    res.sendFile(path.join(__dirname, "student","student_courese_list.html"));
});

app.get("/view_course", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view_course.html"));
});

// Save course and modules

app.get('/courses', (req, res) => {
    db.all('SELECT id, title FROM courses', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


// Load course and modules
app.get("/course/:courseId", (req, res) => {
    const courseId = req.params.courseId;
    
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err || !course) return res.status(404).json({ error: "Course not found" });

        db.all("SELECT * FROM modules WHERE course_id = ?", [courseId], (err, modules) => {
            if (err) return res.status(500).json({ error: err.message });

            const buildHierarchy = (parentId = null) =>
                modules
                    .filter((m) => m.parent_id === parentId)
                    .map((m) => ({
                        id: m.id,
                        title: m.title || "",
                        text: m.text || "",
                        url: m.url || "",
                        subModules: buildHierarchy(m.id),
                    }));

            res.json({ title: course.title, modules: buildHierarchy() });
        });
    });
});



app.get('/is_enrolled', (req, res) => {
    if (req.session.student) {  // Use studentId instead of instructorId
        const course_id = req.query.courseId;
        const student_id = req.session.student;  // Correct session variable

        if (!course_id) return res.status(400).send("Missing course ID.");

        db.get(
            `SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?`,
            [student_id, course_id],
            (err, row) => {
                console.log(row);
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send('Database error.');
                }
                if (row) {
                    res.redirect(`/view_course?courseID=${course_id}`);
                } else {
                    res.redirect(`/course/about/${course_id}`);
                }
            }
        );
    } else {
        res.redirect(`/`);
    }
});


app.get('/enroll', (req, res) => {
    if(req.session.student){
    const studentId = req.session.student; // Get student ID from session
    const courseId = req.query.courseId; // Course ID from query params

    if (!studentId  || !courseId) {
        return res.status(400).json({ message: 'Student ID, and Course ID are required' });
    }

    // Check if student exists
    db.get('SELECT id FROM students WHERE id = ?', [studentId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (!row) {
            res.status(404).json({ message: 'user not found or auth' });
        } else {
            // Student exists, proceed to enroll
            console.log(row);
            console.log(courseId);

            enrollStudent(studentId, courseId, res);
        }
    });
   }else{
    res.redirect('/login')
   }
});



// Function to enroll student in course
function enrollStudent(studentId, courseId, res) {
 
        db.serialize(() => {
            db.run(
                'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', 
                [studentId, courseId], 
                (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error enrolling student' });
                    }
                    res.redirect(`/view_course?courseID=${courseId}`);
                }
            );
        });
    
   
}

const requireStudent = (req, res, next) => {
    if (!req.session.student) {
        return res.status(403).json({ error: "Access denied. Students only." });
    }
    next();
};

// Middleware for Instructor Authentication
const requireInstructor = (req, res, next) => {
    if (!req.session.student) {
        return res.status(403).json({ error: "Access denied. Students only." });
    }
    next();
};

app.get("/magazines", (req, res) => {
    const lastId = req.query.lastId || 0;
    const limit = 5;

    const query = lastId > 0
        ? `SELECT * FROM magazines WHERE id > ? ORDER BY id ASC LIMIT ?`
        : `SELECT * FROM magazines ORDER BY id ASC LIMIT ?`;

    db.all(query, lastId > 0 ? [lastId, limit] : [limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


app.get("/course/about/:courseId", (req, res) => {
    const courseId = req.params.courseId;

    db.get(
        `SELECT c.id, c.title, 
                cs.enrolled_count, cs.avg_rating, cs.avg_completion_time, 
                cs.review_count
         FROM courses c
         LEFT JOIN course_stats cs ON c.id = cs.course_id
         WHERE c.id = ?`,
        [courseId],
        (err, course) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }
            if (!course) {
                return res.status(404).send("Course not found");
            }

            const navLinks = [
                { href: "overview", text: "Overview" },
                { href: "curriculum", text: "Curriculum" },
                { href: "reviews", text: "Reviews" },
                { href: "faq", text: "FAQ" }
            ];

            const sections = [
                { id: "overview", title: "Course Overview", content: "nothing" },
                { id: "curriculum", title: "Curriculum", content: "Detailed course modules will be listed here." },
                { id: "reviews", title: "Student Reviews", content: `${course.review_count || 0} reviews available.` },
                { id: "faq", title: "Frequently Asked Questions", content: "Common queries about this course." }
            ];

            res.render("course.ejs", { 
                course, 
                navLinks, 
                sections 
            });
        }
    );
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


app.get('/module_complete', (req, res) => {
    const moduleId = req.query.moduleId; // Get module ID from query parameter
    const studentId = req.session.student; // Replace with actual student ID from session or auth

    if (!moduleId) {
        return res.status(400).send('Module ID is required.');
    }

    db.run('INSERT OR REPLACE INTO student_modules (student_id, module_id, is_completed) VALUES (?, ?, 1)', [studentId, moduleId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating module completion.');
        }

        if (this.changes > 0) {
            res.send('Module completion status updated.');
        } else {
            res.status(404).send('Module not found or student does not exist.');
        }
    });
});

app.get('/completed_modules', (req, res) => {
    const studentId = req.query.studentId;
    const courseId = req.query.courseId;

    if (!studentId || !courseId) {
        return res.status(400).send('Student ID and Course ID are required.');
    }

    db.all('SELECT module_id FROM student_modules JOIN modules ON student_modules.module_id = modules.id WHERE student_modules.student_id = ? AND modules.course_id = ? AND student_modules.is_completed = 1', [studentId, courseId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching completed modules.');
        }
        res.json(rows);
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});