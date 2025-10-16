const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { Student, Instructor, Course, CourseStat, Module, Enrollment } = require('../required/db');
const contactAdmin = require('../models/instructor/contactModel');
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
router.get('/dashboard/stats', isAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ is_deleted: 0 });
        const totalInstructors = await Instructor.countDocuments({ is_deleted: 0 });
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();

        res.json({ totalStudents, totalInstructors, totalCourses, totalEnrollments });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Error loading dashboard stats' });
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
router.get('/users/data', isAdmin, async (req, res) => {
    try {
        const students = await Student.find({ is_deleted: 0 }).select('name email contact address');
        const instructors = await Instructor.find({ is_deleted: 0 }).select('name email contact address');
        res.json({ students, instructors });
    } catch (error) {
        console.error('Users data error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
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
router.get('/courses/data', isAdmin, async (req, res) => {
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

        res.json(courses); // 👈 Return JSON instead of rendering a view
    } catch (error) {
        console.error('Courses data error:', error);
        res.status(500).json({ message: 'Error loading courses data' });
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
router.get('/content/data', isAdmin, async (req, res) => {
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

        res.json(modules);
    } catch (error) {
        console.error('Content data error:', error);
        res.status(500).json({ error: 'Error fetching content' });
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



// -------------------- PAYMENT DATA ROUTE --------------------
router.get('/payments/data', isAdmin, async (req, res) => {
    try {
        const range = req.query.range || 'daily';
        console.log('📊 Received range parameter:', range);

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
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            { $sort: { date_enrolled: -1 } }
        ]);

        const courseStats = await CourseStat.find().lean();
        const statsMap = {};
        courseStats.forEach(stat => statsMap[stat.course_id.toString()] = stat);

        const payments = enrollments.map(enrollment => {
            const courseId = enrollment.course_id?._id?.toString();
            const courseStat = courseId ? statsMap[courseId] : null;
            const amount = courseStat?.price || 0;
            return {
                _id: enrollment._id,
                date: enrollment.date_enrolled,
                user: enrollment.student?.name || 'Unknown Student',
                course: enrollment.course?.title || 'Unknown Course',
                courseId: courseId,
                amount,
                status: enrollment.payment_status || 'completed',
                method: enrollment.payment_method || 'Card'
            };
        });

        // Statistics
        const totalRevenue = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyPayments = payments.filter(p => {
            if (!p.date) return false;
            const pd = new Date(p.date);
            return pd.getMonth() === currentMonth && pd.getFullYear() === currentYear;
        });
        const monthRevenue = monthlyPayments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
        const pendingPayments = payments.filter(p => p.status === 'pending');
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        const completedPayments = payments.filter(p => p.status === 'completed');
        const avgTransaction = completedPayments.length > 0 ? Math.round(totalRevenue / completedPayments.length) : 0;

        // Filter payments based on time range for top courses calculation
        const now = new Date();
        let filteredPayments = payments;

        console.log('🔍 Filtering payments for range:', range);

        if (range === 'daily') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            
            filteredPayments = payments.filter(p => {
                if (!p.date || p.status !== 'completed') return false;
                const pd = new Date(p.date);
                return pd >= sevenDaysAgo;
            });
            console.log(`📊 Filtered to ${filteredPayments.length} payments from last 7 days`);
        } else if (range === 'monthly') {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            sixMonthsAgo.setHours(0, 0, 0, 0);
            
            filteredPayments = payments.filter(p => {
                if (!p.date || p.status !== 'completed') return false;
                const pd = new Date(p.date);
                return pd >= sixMonthsAgo;
            });
            console.log(`📊 Filtered to ${filteredPayments.length} payments from last 6 months`);
        } else if (range === 'yearly') {
            const fiveYearsAgo = new Date(now.getFullYear() - 4, 0, 1);
            fiveYearsAgo.setHours(0, 0, 0, 0);
            
            filteredPayments = payments.filter(p => {
                if (!p.date || p.status !== 'completed') return false;
                const pd = new Date(p.date);
                return pd >= fiveYearsAgo;
            });
            console.log(`📊 Filtered to ${filteredPayments.length} payments from last 5 years`);
        }

        // Calculate top 5 courses by revenue
        const courseRevenue = {};
        filteredPayments.forEach(p => {
            if (p.status === 'completed' && p.courseId) {
                if (!courseRevenue[p.courseId]) {
                    courseRevenue[p.courseId] = {
                        course: p.course,
                        revenue: 0,
                        enrollments: 0
                    };
                }
                courseRevenue[p.courseId].revenue += p.amount;
                courseRevenue[p.courseId].enrollments += 1;
            }
        });

        console.log('💰 Course revenue map:', courseRevenue);

        const topCourses = Object.values(courseRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(c => ({
                course: c.course,
                revenue: Math.round(c.revenue),
                enrollments: c.enrollments
            }));

        console.log('🏆 Top 5 courses for range', range, ':', topCourses);

        // Chart data based on range
        let labels = [];
        let revenueByPeriod = [];

        console.log('🔍 Processing range:', range);
        console.log('📅 Current date:', now);
        console.log('💾 Total payments to process:', payments.length);

        if (range === 'daily') {
            console.log('📆 Generating DAILY data (last 7 days)');
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                labels.push(label);

                const dayRevenue = payments
                    .filter(p => {
                        if (!p.date || p.status !== 'completed') return false;
                        const paymentDate = new Date(p.date);
                        return paymentDate >= date && paymentDate < nextDate;
                    })
                    .reduce((sum, p) => sum + p.amount, 0);

                revenueByPeriod.push(Math.round(dayRevenue));
                console.log(`  ${label}: $${Math.round(dayRevenue)}`);
            }
        } else if (range === 'monthly') {
            console.log('📆 Generating MONTHLY data (last 6 months)');
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthDate.setHours(0, 0, 0, 0);
                
                const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
                nextMonth.setHours(0, 0, 0, 0);
                
                const label = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                labels.push(label);

                const monthRevenueValue = payments
                    .filter(p => {
                        if (!p.date || p.status !== 'completed') return false;
                        const pd = new Date(p.date);
                        return pd >= monthDate && pd < nextMonth;
                    })
                    .reduce((sum, p) => sum + p.amount, 0);

                revenueByPeriod.push(Math.round(monthRevenueValue));
                console.log(`  ${label}: $${Math.round(monthRevenueValue)}`);
            }
        } else if (range === 'yearly') {
            console.log('📆 Generating YEARLY data (last 5 years)');
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                const yearStart = new Date(year, 0, 1);
                yearStart.setHours(0, 0, 0, 0);
                
                const yearEnd = new Date(year + 1, 0, 1);
                yearEnd.setHours(0, 0, 0, 0);
                
                labels.push(year.toString());

                const yearRevenueValue = payments
                    .filter(p => {
                        if (!p.date || p.status !== 'completed') return false;
                        const pd = new Date(p.date);
                        return pd >= yearStart && pd < yearEnd;
                    })
                    .reduce((sum, p) => sum + p.amount, 0);

                revenueByPeriod.push(Math.round(yearRevenueValue));
                console.log(`  ${year}: $${Math.round(yearRevenueValue)}`);
            }
        }

        console.log('✅ Final labels:', labels);
        console.log('✅ Final revenue:', revenueByPeriod);

        const responseData = {
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
                labels,
                revenue: revenueByPeriod,
                topCourses,
                completed: completedPayments.length,
                pending: pendingPayments.length,
                failed: payments.filter(p => p.status === 'failed').length
            }
        };

        console.log('📤 Sending response with chartData:', responseData.chartData);
        console.log('🏆 Top Courses being sent:', topCourses);
        res.json(responseData);

    } catch (error) {
        console.error('❌ Payment data error:', error);
        res.status(500).json({
            error: 'Error fetching payment data: ' + error.message,
            payments: [],
            stats: { totalRevenue: 0, monthRevenue: 0, monthCount: 0, pendingAmount: 0, pendingCount: 0, avgTransaction: 0 },
            chartData: { labels: [], revenue: [], topCourses: [], completed: 0, pending: 0, failed: 0 }
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

router.get('/requests', async (req, res) => {
    try {
        const requests = await contactAdmin.find()
            .populate('instructor_id', 'name')
            .populate('course_id', 'title')
            .sort({ created_at: -1 })
            .lean();

        res.render('admin/requests', { requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send('Error loading requests');
    }
});

// GET - Fetch requests data (for AJAX refresh)
router.get('/requests/data', async (req, res) => {
    try {
        const requests = await contactAdmin.find()
            .populate('instructor_id', 'name')
            .populate('course_id', 'title')
            .sort({ created_at: -1 })
            .lean();

        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, message: 'Error fetching requests' });
    }
});

// PUT - Update request status
router.put('/requests/:id', async (req, res) => {
    try {
        const { status, priority } = req.body;
        const updateData = {};

        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;

        const request = await contactAdmin.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('instructor_id', 'name').populate('course_id', 'title');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, request });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ success: false, message: 'Error updating request' });
    }
});

// DELETE - Delete request
router.delete('/requests/:id', async (req, res) => {
    try {
        const request = await contactAdmin.findByIdAndDelete(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ success: false, message: 'Error deleting request' });
    }
});
module.exports = router; 