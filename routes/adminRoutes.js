const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { Student, Instructor, Course, CourseStat, Module, Enrollment } = require('../required/db');
const bcrypt = require('bcrypt');

// Get courses for content forms
router.get('/courses/list', isAdmin, async (req, res) => {
    try {
        const courses = await Course.find()
            .select('_id title')
            .sort('title');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

// Get instructors for course forms
router.get('/instructors', isAdmin, async (req, res) => {
    try {
        const instructors = await Instructor.find({ is_deleted: 0 })
            .select('_id name')
            .sort('name');
        res.json(instructors);
    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({ error: 'Error fetching instructors' });
    }
});

// Admin login routes
router.get('/login', (req, res) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (email === 'admin@example.com' && password === 'admin123') {
            req.session.user = {
                id: 1,
                email: email,
                role: 'admin'
            };
            res.redirect('/admin/dashboard');
        } else {
            res.status(401).render('admin/login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).render('admin/login', { error: 'An error occurred during login' });
    }
});

// Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ is_deleted: 0 });
        const totalInstructors = await Instructor.countDocuments({ is_deleted: 0 });
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();

        res.render('admin/dashboard', {
            stats: {
                totalStudents,
                totalInstructors,
                totalCourses,
                totalEnrollments
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

// User management
router.get('/users', isAdmin, async (req, res) => {
    try {
        const students = await Student.find({ is_deleted: 0 }).select('name email contact address');
        const instructors = await Instructor.find({ is_deleted: 0 }).select('name email contact address');
        
        res.render('admin/users', {
            students,
            instructors
        });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).render('error', { message: 'Error loading users' });
    }
});

// Course management
router.get('/courses', isAdmin, async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $lookup: {
                    from: 'instructors',
                    localField: 'instructor_id',
                    foreignField: '_id',
                    as: 'instructor'
                }
            },
            {
                $lookup: {
                    from: 'coursestats',
                    localField: '_id',
                    foreignField: 'course_id',
                    as: 'stats'
                }
            },
            {
                $unwind: {
                    path: '$instructor',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$stats',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    instructor_name: '$instructor.name',
                    enrolled_count: { $ifNull: ['$stats.enrolled_count', 0] },
                    price: { $ifNull: ['$stats.price', 0] },
                    avg_rating: { $ifNull: ['$stats.avg_rating', 0] }
                }
            }
        ]);

        res.render('admin/courses', { courses });
    } catch (error) {
        console.error('Courses error:', error);
        res.status(500).render('error', { message: 'Error loading courses' });
    }
});

// Content management
router.get('/content', isAdmin, async (req, res) => {
    try {
        const modules = await Module.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $unwind: '$course'
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    text: 1,
                    url: 1,
                    course_title: '$course.title'
                }
            }
        ]);

        res.render('admin/content', { modules });
    } catch (error) {
        console.error('Content error:', error);
        res.status(500).render('error', { message: 'Error loading content' });
    }
});

// Add new user
router.post('/users', isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, contact, address } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'student') {
            await Student.create({
                name,
                email,
                contact,
                address,
                hashed_password: hashedPassword,
                is_deleted: 0
            });
        } else if (role === 'instructor') {
            await Instructor.create({
                name,
                email,
                contact,
                address,
                hashed_password: hashedPassword,
                is_deleted: 0
            });
        }

        res.redirect('/admin/users');
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).render('error', { message: 'Error adding user' });
    }
});

// Add new course
router.post('/courses', isAdmin, async (req, res) => {
    try {
        const { title, subject, instructor_id, price } = req.body;
        
        const course = await Course.create({
            title,
            subject,
            instructor_id
        });

        await CourseStat.create({
            course_id: course._id,
            price: parseFloat(price),
            enrolled_count: 0,
            avg_rating: 0,
            review_count: 0
        });

        res.redirect('/admin/courses');
    } catch (error) {
        console.error('Add course error:', error);
        res.status(500).render('error', { message: 'Error adding course' });
    }
});

// Add new content
router.post('/content', isAdmin, async (req, res) => {
    try {
        const { title, text, url, course_id } = req.body;
        
        await Module.create({
            course_id,
            title,
            text,
            url
        });

        res.redirect('/admin/content');
    } catch (error) {
        console.error('Add content error:', error);
        res.status(500).render('error', { message: 'Error adding content' });
    }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        if (role === 'student') {
            await Student.findByIdAndUpdate(id, { is_deleted: 1 });
        } else if (role === 'instructor') {
            await Instructor.findByIdAndUpdate(id, { is_deleted: 1 });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: 'Error deleting user' });
    }
});

// Edit user
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, contact, address, role } = req.body;

        if (role === 'student') {
            await Student.findByIdAndUpdate(id, { name, email, contact, address });
        } else if (role === 'instructor') {
            await Instructor.findByIdAndUpdate(id, { name, email, contact, address });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Edit user error:', error);
        res.status(500).json({ success: false, error: 'Error updating user' });
    }
});

// Delete course
router.delete('/courses/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Course.findByIdAndDelete(id);
        await CourseStat.findOneAndDelete({ course_id: id });
        await Module.deleteMany({ course_id: id });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ success: false, error: 'Error deleting course' });
    }
});

// Edit course
router.put('/courses/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, instructor_id, price } = req.body;

        await Course.findByIdAndUpdate(id, { title, subject, instructor_id });
        await CourseStat.findOneAndUpdate(
            { course_id: id },
            { price: parseFloat(price) }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Edit course error:', error);
        res.status(500).json({ success: false, error: 'Error updating course' });
    }
});

// Delete content
router.delete('/content/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Module.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ success: false, error: 'Error deleting content' });
    }
});

// Edit content
router.put('/content/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, text, url, course_id } = req.body;

        await Module.findByIdAndUpdate(id, {
            title,
            text,
            url,
            course_id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Edit content error:', error);
        res.status(500).json({ success: false, error: 'Error updating content' });
    }
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
});
router.get('/Payments', isAdmin, async (req, res) => {
    try {
        console.log('📄 Rendering payments page...');
        res.render('admin/payments');
    } catch (error) {
        console.error('❌ Payments page error:', error);
        res.status(500).render('error', { message: 'Error loading payments page' });
    }
});

// Get payment data for analytics
router.get('/payments/data', isAdmin, async (req, res) => {
    console.log('🔍 Starting payment data fetch...');
    
    try {
        // STEP 1: Fetch all enrollments with related data
        console.log('Step 1: Fetching enrollments...');
        
        // FIX: Changed from 'cours' to 'Enrollment'
        const enrollments = await Enrollment.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $unwind: {
                    path: '$student',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$course',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { enrollment_date: -1 }
            }
        ]);
        
        console.log(`✅ Found ${enrollments.length} enrollments`);

        // STEP 2: Fetch all course stats
        console.log('Step 2: Fetching course stats...');
        const courseStats = await CourseStat.find().lean();
        console.log(`✅ Found ${courseStats.length} course stats`);
        
        // Create stats map for quick lookup
        const statsMap = {};
        courseStats.forEach(stat => {
            statsMap[stat.course_id.toString()] = stat;
        });
        console.log('✅ Stats map created');

        // STEP 3: Build payment records
        console.log('Step 3: Building payment records...');
        const payments = enrollments.map(enrollment => {
            const courseId = enrollment.course_id?._id?.toString();
            const courseStat = courseId ? statsMap[courseId] : null;
            const amount = courseStat?.price || 0;

            return {
                _id: enrollment._id,
                date: enrollment.enrollment_date ? 
                    new Date(enrollment.enrollment_date).toISOString().split('T')[0] : 
                    new Date().toISOString().split('T')[0],
                user: enrollment.student?.name || 'Unknown Student',
                course: enrollment.course?.title || 'Unknown Course',
                amount: amount,
                status: enrollment.payment_status || 'completed',
                method: enrollment.payment_method || 'Card'
            };
        });
        console.log(`✅ Built ${payments.length} payment records`);

        // STEP 4: Calculate statistics
        console.log('Step 4: Calculating statistics...');
        
        // Total revenue
        const totalRevenue = payments.reduce((sum, p) => 
            sum + (p.status === 'completed' ? p.amount : 0), 0);
        console.log(`📊 Total Revenue: $${totalRevenue}`);
        
        // Current month calculations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyPayments = payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        });
        
        const monthRevenue = monthlyPayments.reduce((sum, p) => 
            sum + (p.status === 'completed' ? p.amount : 0), 0);
        console.log(`📊 Month Revenue: $${monthRevenue} (${monthlyPayments.length} payments)`);
        
        // Pending payments
        const pendingPayments = payments.filter(p => p.status === 'pending');
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        console.log(`📊 Pending: $${pendingAmount} (${pendingPayments.length} payments)`);
        
        // Average transaction
        const completedPayments = payments.filter(p => p.status === 'completed');
        const completedCount = completedPayments.length;
        const avgTransaction = completedCount > 0 ? 
            Math.round(totalRevenue / completedCount) : 0;
        console.log(`📊 Average Transaction: $${avgTransaction}`);

        // STEP 5: Chart data - last 7 days revenue
        console.log('Step 5: Generating chart data...');
        const last7Days = [];
        const revenueByDay = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            last7Days.push(date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }));
            
            const dayRevenue = payments
                .filter(p => p.date === dateStr && p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);
            
            revenueByDay.push(Math.round(dayRevenue));
        }
        console.log('✅ Chart data generated:', { last7Days, revenueByDay });

        // STEP 6: Status counts for pie chart
        const completed = payments.filter(p => p.status === 'completed').length;
        const pending = payments.filter(p => p.status === 'pending').length;
        const failed = payments.filter(p => p.status === 'failed').length;
        console.log(`📊 Status counts - Completed: ${completed}, Pending: ${pending}, Failed: ${failed}`);

        // STEP 7: Send response
        const response = {
            payments,
            stats: {
                totalRevenue: Math.round(totalRevenue),
                monthRevenue: Math.round(monthRevenue),
                monthCount: monthlyPayments.filter(p => p.status === 'completed').length,
                pendingAmount: Math.round(pendingAmount),
                pendingCount: pendingPayments.length,
                avgTransaction
            },
            chartData: {
                labels: last7Days,
                revenue: revenueByDay,
                completed,
                pending,
                failed
            }
        };
        
        console.log('✅ Sending response with', payments.length, 'payments');
        res.json(response);
        
    } catch (error) {
        console.error('❌ Payment data error:', error);
        console.error('Error stack:', error.stack);
        
        // Send empty but valid response structure
        res.status(500).json({ 
            error: 'Error fetching payment data: ' + error.message,
            payments: [],
            stats: {
                totalRevenue: 0,
                monthRevenue: 0,
                monthCount: 0,
                pendingAmount: 0,
                pendingCount: 0,
                avgTransaction: 0
            },
            chartData: {
                labels: [],
                revenue: [],
                completed: 0,
                pending: 0,
                failed: 0
            }
        });
    }
});

// Update payment status
router.put('/payments/:id/status', isAdmin, async (req, res) => {
    console.log(`🔄 Updating payment status for ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['completed', 'pending', 'failed'].includes(status)) {
            console.log('❌ Invalid status:', status);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment status' 
            });
        }

        const enrollment = await Enrollment.findByIdAndUpdate(
            id, 
            { payment_status: status },
            { new: true }
        );

        if (!enrollment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ 
                success: false, 
                error: 'Payment not found' 
            });
        }

        console.log(`✅ Payment status updated to: ${status}`);
        res.json({ success: true, enrollment });
        
    } catch (error) {
        console.error('❌ Update payment status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error updating payment status' 
        });
    }
});

// Get payment details
router.get('/payments/:id', isAdmin, async (req, res) => {
    console.log(`🔍 Fetching payment details for ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        
        const enrollment = await Enrollment.findById(id)
            .populate('student_id', 'name email contact')
            .populate('course_id', 'title subject');
        
        if (!enrollment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Get course pricing from CourseStat
        const courseStat = await CourseStat.findOne({ 
            course_id: enrollment.course_id 
        });

        const payment = {
            _id: enrollment._id,
            date: enrollment.enrollment_date,
            student: enrollment.student_id,
            course: enrollment.course_id,
            amount: courseStat?.price || 0,
            status: enrollment.payment_status || 'completed',
            method: enrollment.payment_method || 'Card',
            progress: enrollment.progress_percentage || 0
        };
        
        console.log('✅ Payment details fetched successfully');
        res.json(payment);
        
    } catch (error) {
        console.error('❌ Get payment error:', error);
        res.status(500).json({ error: 'Error fetching payment details' });
    }
});

// Add these routes to your admin routes file (after the existing payment routes)

// Update payment (status and method)
router.put('/payments/:id', isAdmin, async (req, res) => {
    console.log(`🔄 Updating payment ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        const { status, method } = req.body;

        // Validate status
        if (status && !['completed', 'pending', 'failed'].includes(status)) {
            console.log('❌ Invalid status:', status);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment status' 
            });
        }

        // Build update object
        const updateData = {};
        if (status) updateData.payment_status = status;
        if (method) updateData.payment_method = method;

        const enrollment = await Enrollment.findByIdAndUpdate(
            id, 
            updateData,
            { new: true }
        );

        if (!enrollment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ 
                success: false, 
                error: 'Payment not found' 
            });
        }

        console.log(`✅ Payment updated successfully`);
        res.json({ success: true, enrollment });
        
    } catch (error) {
        console.error('❌ Update payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error updating payment' 
        });
    }
});

// Delete payment (soft delete - removes enrollment)
router.delete('/payments/:id', isAdmin, async (req, res) => {
    console.log(`🗑️ Deleting payment ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        
        // Find the enrollment first
        const enrollment = await Enrollment.findById(id);
        
        if (!enrollment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ 
                success: false, 
                error: 'Payment not found' 
            });
        }

        // Get the course to update enrollment count
        const courseStat = await CourseStat.findOne({ 
            course_id: enrollment.course_id 
        });

        // Delete the enrollment
        await Enrollment.findByIdAndDelete(id);

        // Update course enrollment count (decrement)
        if (courseStat && courseStat.enrolled_count > 0) {
            await CourseStat.findByIdAndUpdate(
                courseStat._id,
                { $inc: { enrolled_count: -1 } }
            );
            console.log('✅ Course enrollment count decremented');
        }

        console.log(`✅ Payment deleted successfully`);
        res.json({ success: true, message: 'Payment deleted successfully' });
        
    } catch (error) {
        console.error('❌ Delete payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error deleting payment' 
        });
    }
});

// Alternative: Soft delete with is_deleted flag (if you prefer keeping records)

router.delete('/payments/:id', isAdmin, async (req, res) => {
    console.log(`🗑️ Soft deleting payment ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        
        const enrollment = await Enrollment.findByIdAndUpdate(
            id, 
            { 
                is_deleted: true,
                deleted_at: new Date()
            },
            { new: true }
        );

        if (!enrollment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ 
                success: false, 
                error: 'Payment not found' 
            });
        }

        console.log(`✅ Payment soft deleted successfully`);
        res.json({ success: true, message: 'Payment deleted successfully' });
        
    } catch (error) {
        console.error('❌ Delete payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error deleting payment' 
        });
    }
});

module.exports = router; 