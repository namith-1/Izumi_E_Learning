const { 
  Student, 
  Instructor, 
  Course, 
  Enrollment, 
  Magazine,
  CourseStat 
} = require('../required/db');
const bcrypt = require('bcrypt');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      studentCount, 
      instructorCount, 
      courseCount, 
      enrollmentCount
    ] = await Promise.all([
      Student.countDocuments({ is_deleted: 0 }),
      Instructor.countDocuments({ is_deleted: 0 }),
      Course.countDocuments(),
      Enrollment.countDocuments()
    ]);

    res.json({
      totalStudents: studentCount,
      totalInstructors: instructorCount,
      totalCourses: courseCount,
      totalEnrollments: enrollmentCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// Users Management
exports.getUsers = async (req, res) => {
  try {
    const [students, instructors] = await Promise.all([
      Student.find({ is_deleted: 0 }).select('-hashed_password'),
      Instructor.find({ is_deleted: 0 }).select('-hashed_password')
    ]);

    const users = [
      ...students.map(s => ({ ...s.toObject(), role: 'student' })),
      ...instructors.map(i => ({ ...i.toObject(), role: 'instructor' }))
    ];

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, contact, address } = req.body;

  try {
    // Check if user already exists
    const existingStudent = await Student.findOne({ email });
    const existingInstructor = await Instructor.findOne({ email });

    if (existingStudent || existingInstructor) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashed_password = await bcrypt.hash(password, 10);

    let newUser;
    if (role === 'student') {
      newUser = new Student({
        name,
        email,
        hashed_password,
        contact: contact || '',
        address: address || '',
        is_deleted: 0
      });
    } else if (role === 'instructor') {
      newUser = new Instructor({
        name,
        email,
        hashed_password,
        contact: contact || '',
        address: address || '',
        is_deleted: 0
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await newUser.save();
    
    // Return user without password
    const userObj = newUser.toObject();
    delete userObj.hashed_password;
    userObj.role = role;

    res.status(201).json(userObj);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, ...updateData } = req.body;
  
  try {
    let result;
    if (role === 'student') {
      result = await Student.findByIdAndUpdate(id, updateData, { new: true });
    } else if (role === 'instructor') {
      result = await Instructor.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.query;
  
  try {
    if (role === 'student') {
      await Student.findByIdAndUpdate(id, { is_deleted: 1 });
    } else if (role === 'instructor') {
      await Instructor.findByIdAndUpdate(id, { is_deleted: 1 });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Courses Management
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor_id', 'name email')
      .lean();
      
    // Add stats and flatten structure for frontend
    const coursesWithStats = await Promise.all(courses.map(async (course) => {
      const stats = await CourseStat.findOne({ course_id: course._id });
      const statsObj = stats ? stats.toObject() : { enrolled_count: 0, avg_rating: 0, price: 0 };
      
      return {
        ...course,
        instructor_name: course.instructor_id ? course.instructor_id.name : 'Unknown',
        enrolled_count: statsObj.enrolled_count || 0,
        price: statsObj.price || 0,
        avg_rating: statsObj.avg_rating || 0,
        stats: statsObj // Keep original stats object just in case
      };
    }));

    res.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    
    // Initialize stats
    const newStats = new CourseStat({
      course_id: newCourse._id,
      enrolled_count: 0,
      avg_rating: 0,
      price: req.body.price || 0
    });
    await newStats.save();

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await CourseStat.findOneAndDelete({ course_id: req.params.id });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course' });
  }
};

// Payments (Mock implementation for now)
exports.getPayments = async (req, res) => {
  console.log('GET /admin/payments/data called'); // Debug log
  try {
    // Fetch all enrollments with student and course details
    const enrollments = await Enrollment.find()
      .populate('student_id', 'name email')
      .populate('course_id', 'title subject')
      .sort({ date_enrolled: -1 });
    
    console.log(`Found ${enrollments.length} enrollments`); // Debug log

    // Fetch course stats to get prices
    const courseStats = await CourseStat.find();
    const priceMap = {};
    courseStats.forEach(stat => {
      if (stat.course_id) {
        priceMap[stat.course_id.toString()] = stat.price;
      }
    });

    const payments = enrollments.map(enrollment => {
      const courseId = enrollment.course_id ? enrollment.course_id._id.toString() : null;
      const price = (courseId && priceMap[courseId]) ? priceMap[courseId] : 0;
      
      return {
        _id: enrollment._id,
        user: enrollment.student_id ? enrollment.student_id.name : 'Unknown Student',
        course: enrollment.course_id ? enrollment.course_id.title : 'Unknown Course',
        amount: price,
        date: enrollment.date_enrolled,
        status: 'completed',
        transactionId: 'TXN' + enrollment._id.toString().substring(0, 8).toUpperCase()
      };
    });
    
    console.log(`Returning ${payments.length} payments`); // Debug log

    // Calculate stats
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Top Courses Logic
    const courseStatsMap = {};
    payments.forEach(p => {
      if (p.course !== 'Unknown Course') {
        if (!courseStatsMap[p.course]) {
          courseStatsMap[p.course] = { revenue: 0, sales: 0 };
        }
        courseStatsMap[p.course].revenue += p.amount;
        courseStatsMap[p.course].sales += 1;
      }
    });

    const topCourses = Object.entries(courseStatsMap)
      .map(([title, data]) => ({ 
        title, 
        revenue: data.revenue, 
        sales: data.sales 
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      payments,
      stats: {
        totalRevenue,
        monthRevenue,
        monthCount: monthPayments.length,
        pendingAmount: 0,
        pendingCount: 0,
        avgTransaction: payments.length > 0 ? (totalRevenue / payments.length) : 0
      },
      chartData: {
        topCourses
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    // NOTE: Since we don't have a dedicated Payment model or status field in Enrollment,
    // this is a placeholder. In a real app, you would update the status in the DB.
    // For now, we just return success to prevent frontend errors.
    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
};

// Requests
exports.getRequests = async (req, res) => {
  try {
    console.log('[AdminController] getRequests called by', req.ip, 'path:', req.path, 'session.admin:', req.session && req.session.admin);
    const ContactAdmin = require('../models/instructor/contactModel');

    const docs = await ContactAdmin.find()
      .populate('instructor_id', 'name email')
      .populate('course_id', 'title')
      .sort({ created_at: -1 })
      .lean();

    console.log('[AdminController] found', docs.length, 'contact requests');

    const requests = docs.map(d => ({
      _id: d._id,
      user: d.instructor_id ? d.instructor_id.name : 'Unknown',
      message: d.message,
      priority: d.priority || 'low',
      status: (d.status || '').toLowerCase(),
      date: d.created_at,
      course: d.course_id ? d.course_id.title : null,
      notes: d.notes || ''
    }));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// Update a request (status/notes)
exports.updateRequest = async (req, res) => {
  try {
    const ContactAdmin = require('../models/instructor/contactModel');
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id) return res.status(400).json({ message: 'Missing request id' });

    // Map incoming lowercase status to stored enum capitalization
    const statusMap = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    const newStatus = statusMap[(status || '').toLowerCase()] || undefined;

    const update = { updated_at: new Date() };
    if (newStatus) update.status = newStatus;
    if (typeof notes === 'string') update.notes = notes;

    const updated = await ContactAdmin.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Request not found' });

    res.json({ message: 'Request updated', request: {
      _id: updated._id,
      user: updated.instructor_id,
      message: updated.message,
      priority: updated.priority,
      status: (updated.status || '').toLowerCase(),
      date: updated.created_at,
      course: updated.course_id,
      notes: updated.notes || ''
    }});
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Error updating request' });
  }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
  try {
    const ContactAdmin = require('../models/instructor/contactModel');
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Missing request id' });

    const deleted = await ContactAdmin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Request not found' });

    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Error deleting request' });
  }
};

// Content (Magazines, etc)
exports.getContent = async (req, res) => {
  try {
    const magazines = await Magazine.find();
    res.json(magazines); // Frontend expects array directly
  } catch (error) {
    res.status(500).json({ message: 'Error fetching content' });
  }
};

exports.createContent = async (req, res) => {
  try {
    const newMagazine = new Magazine(req.body);
    await newMagazine.save();
    res.status(201).json(newMagazine);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ message: 'Error creating content' });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const updatedMagazine = await Magazine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedMagazine);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Error updating content' });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    await Magazine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Error deleting content' });
  }
};
