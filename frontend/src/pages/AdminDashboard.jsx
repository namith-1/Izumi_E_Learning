import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchAllAdminData, deleteUserAdmin, deleteCourseAdmin, updateCourseAdmin,
    fetchStudentEnrollmentByEmail, fetchTeacherCoursesByEmail, clearLookup
} from '../store';
import {
    Users, BookOpen, BarChart3, Loader2, Trash2, Edit, Save, X, Search, Eye, Shield, UserPlus
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';
import './css/ReviewerDashboard.css';
import './css/AdminDashboard.css';
import '../components/analytics/AnalyticsDashboard.css';
import '../pages/css/StudentDashboard.css';

// --- Sub-Components (Defined OUTSIDE to prevent re-render focus loss) ---

const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="search-input-group mb-4" style={{ maxWidth: '400px', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', backgroundColor: 'white' }}>
        <Search size={18} className="text-gray-400 mr-2" />
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%' }}
        />
    </div>
);

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const {
        students = [], teachers = [], courses = [], enrollments = [], loading,
        lookupResult, lookupError, lookupLoading, lookupType
    } = useSelector(state => state.admin);

    const [activeTab, setActiveTab] = useState('analytics');

    // Independent Search States for each section
    const [instructorSearch, setInstructorSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');

    // Edit States
    const [isEditingCourse, setIsEditingCourse] = useState(null);
    const [courseEditData, setCourseEditData] = useState({});

    // Reviewer States
    const [reviewers, setReviewers] = useState([]);
    const [reviewerLoading, setReviewerLoading] = useState(false);
    const [reviewerForm, setReviewerForm] = useState({ name: '', email: '', password: '', specialization: '' });
    const [reviewerMsg, setReviewerMsg] = useState({ text: '', type: '' });

    // --- Effects ---
    useEffect(() => {
        if (user?.role === 'admin') dispatch(fetchAllAdminData());
        else navigate('/login', { replace: true });
    }, [dispatch, user, navigate]);

    // Fetch reviewers when tab is active
    useEffect(() => {
        if (activeTab === 'reviewers') {
            setReviewerLoading(true);
            fetch('http://localhost:5000/api/admin/reviewers', { credentials: 'include' })
                .then(r => r.json())
                .then(data => { setReviewers(Array.isArray(data) ? data : []); setReviewerLoading(false); })
                .catch(() => setReviewerLoading(false));
        }
    }, [activeTab]);

    // --- Filtering Logic (With Null Checks) ---
    const filteredTeachers = useMemo(() => teachers.filter(t =>
        (t.name || '').toLowerCase().includes(instructorSearch.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(instructorSearch.toLowerCase())
    ), [teachers, instructorSearch]);

    const filteredStudents = useMemo(() => students.filter(s =>
        (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
    ), [students, studentSearch]);

    const filteredCourses = useMemo(() => courses.filter(c =>
        (c.title || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.instructorName || '').toLowerCase().includes(courseSearch.toLowerCase())
    ), [courses, courseSearch]);

    // --- Actions ---
    const handleDelete = (role, id) => {
        if (window.confirm("Are you sure? This is irreversible.")) {
            if (role === 'course') dispatch(deleteCourseAdmin(id));
            else dispatch(deleteUserAdmin({ role, id }));
        }
    };

    const handleLookup = (type, email) => {
        dispatch(clearLookup());
        if (type === 'teacher') dispatch(fetchTeacherCoursesByEmail(email));
        if (type === 'student') dispatch(fetchStudentEnrollmentByEmail(email));
        // Scroll to lookup section
        setTimeout(() => document.getElementById('lookup-results')?.scrollIntoView({ behavior: 'smooth' }), 200);
    };

    const handleSaveCourse = (id) => {
        dispatch(updateCourseAdmin({ id, data: courseEditData })).then(() => setIsEditingCourse(null));
    };

    const LookupResults = () => {
        if (lookupLoading) return <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> Loading details...</div>;
        if (lookupError) return <div className="p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded">{lookupError}</div>;
        if (!lookupResult) return null;

        return (
            <div id="lookup-results" className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-blue-900">
                        Details for {lookupType === 'teacher' ? 'Instructor' : 'Student'}: {lookupResult.teacher?.name || lookupResult.student?.name}
                    </h3>
                    <button onClick={() => dispatch(clearLookup())} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
                </div>

                {lookupType === 'teacher' && (
                    <table className="admin-table bg-white">
                        <thead><tr><th>Course</th><th>Subject</th><th>Enrolled Students</th></tr></thead>
                        <tbody>
                            {lookupResult.courses.map(c => (
                                <tr key={c._id}><td>{c.title}</td><td>{c.subject}</td><td>{c.studentCount}</td></tr>
                            ))}
                            {lookupResult.courses.length === 0 && <tr><td colSpan="3">No courses found.</td></tr>}
                        </tbody>
                    </table>
                )}

                {lookupType === 'student' && (
                    <table className="admin-table bg-white">
                        <thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Progress</th></tr></thead>
                        <tbody>
                            {lookupResult.enrollments.map(e => (
                                <tr key={e._id}>
                                    <td>{e.courseTitle}</td><td>{e.instructorName}</td>
                                    <td><span className={`status-badge ${e.completionStatus}`}>{e.completionStatus}</span></td>
                                    <td>{e.progress}%</td>
                                </tr>
                            ))}
                            {lookupResult.enrollments.length === 0 && <tr><td colSpan="4">No enrollments found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    // --- Helper Component ---
    const StatsSummary = ({ stats }) => {
        return (
            <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
                {stats.map((stat, idx) => (
                    <div key={idx} className={`stat-card ${stat.color}`}>
                        <div className="stat-icon">
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>{stat.label}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- Main Renders ---

    const renderInstructors = () => {
        const instructorStats = [
            { label: 'Total Instructors', value: teachers.length, icon: Users, color: 'blue' },
            { label: 'Active Instructors', value: teachers.filter(t => (t.courseCount || 0) > 0).length, icon: BookOpen, color: 'green' },
            { label: 'Total Students Taught', value: teachers.reduce((acc, t) => acc + (t.totalStudents || 0), 0), icon: Users, color: 'purple' }
        ];

        return (
            <div>
                <StatsSummary stats={instructorStats} />
                <div className="flex justify-between items-end mb-4">
                    <h3 className="tab-section-title mb-0">Instructors List ({filteredTeachers.length})</h3>
                </div>
                <SearchBar value={instructorSearch} onChange={setInstructorSearch} placeholder="Search Instructor Name or Email..." />

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Total Students</th><th>Courses</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredTeachers.map(t => (
                                <tr key={t._id}>
                                    <td>{t.name}</td>
                                    <td>{t.email}</td>
                                    <td className="font-bold text-blue-600">{t.totalStudents || 0}</td>
                                    <td>{t.courseCount || 0}</td>
                                    <td className="flex gap-2">
                                        <button onClick={() => handleLookup('teacher', t.email)} className="btn-action-edit" title="View All Courses">
                                            <Eye size={16} /> View Courses
                                        </button>
                                        <button onClick={() => handleDelete('teacher', t._id)} className="btn-action-delete" title="Ban Instructor">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderStudents = () => {
        const activeLearners = new Set(enrollments.map(e => e.studentId?._id || e.studentId)).size;
        const completionRate = enrollments.length > 0
            ? Math.round((enrollments.filter(e => e.completionStatus === 'completed').length / enrollments.length) * 100)
            : 0;

        const studentStats = [
            { label: 'Total Students', value: students.length, icon: Users, color: 'blue' },
            { label: 'Active Learners', value: activeLearners, icon: BookOpen, color: 'green' },
            { label: 'Avg Completion Rate', value: `${completionRate}%`, icon: BarChart3, color: 'orange' }
        ];

        return (
            <div>
                <StatsSummary stats={studentStats} />
                <h3 className="tab-section-title">Students List ({filteredStudents.length})</h3>
                <SearchBar value={studentSearch} onChange={setStudentSearch} placeholder="Search Student Name or Email..." />

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredStudents.map(s => (
                                <tr key={s._id}>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td className="flex gap-2">
                                        <button onClick={() => handleLookup('student', s.email)} className="btn-action-edit" title="View Progress">
                                            <Eye size={16} /> View Progress
                                        </button>
                                        <button onClick={() => handleDelete('student', s._id)} className="btn-action-delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCourses = () => {
        const totalEnrollments = courses.reduce((acc, c) => acc + (c.totalStudentsRegistered || 0), 0);
        const avgRating = courses.length > 0
            ? (courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length).toFixed(1)
            : '0.0';

        const courseStats = [
            { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'blue' },
            { label: 'Total Enrollments', value: totalEnrollments, icon: Users, color: 'green' },
            { label: 'Average Rating', value: avgRating, icon: BarChart3, color: 'purple' }
        ];

        return (
            <div>
                <StatsSummary stats={courseStats} />
                <h3 className="tab-section-title">Courses List ({filteredCourses.length})</h3>
                <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder="Search Title, Subject or Instructor..." />

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead><tr><th>Title</th><th>Subject</th><th>Instructor</th><th>Status</th><th>Reviewed By</th><th>Students</th><th>Score</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredCourses.map(c => (
                                <tr key={c._id}>
                                    {isEditingCourse === c._id ? (
                                        <>
                                            <td><input className="table-input" value={courseEditData.title} onChange={e => setCourseEditData({ ...courseEditData, title: e.target.value })} /></td>
                                            <td><input className="table-input" value={courseEditData.subject} onChange={e => setCourseEditData({ ...courseEditData, subject: e.target.value })} /></td>
                                            <td>{c.instructorName}</td>
                                            <td><span className={`status-badge ${c.approvalStatus || 'draft'}`}>{c.approvalStatus || 'draft'}</span></td>
                                            <td>—</td>
                                            <td>{c.totalStudentsRegistered}</td>
                                            <td>-</td>
                                            <td className="flex gap-1">
                                                <button onClick={() => handleSaveCourse(c._id)} className="btn-action-save"><Save size={16} /></button>
                                                <button onClick={() => setIsEditingCourse(null)} className="btn-action-cancel"><X size={16} /></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{c.title}</td>
                                            <td>{c.subject}</td>
                                            <td>{c.instructorName}</td>
                                            <td><span className={`status-badge ${c.approvalStatus || 'draft'}`}>{c.approvalStatus || 'draft'}</span></td>
                                            <td>{c.reviewerName || '—'}</td>
                                            <td>{c.totalStudentsRegistered}</td>
                                            <td>{c.averageQuizScore ? c.averageQuizScore.toFixed(1) + '%' : 'N/A'}</td>
                                            <td className="flex gap-1">
                                                <button onClick={() => { setIsEditingCourse(c._id); setCourseEditData(c); }} className="btn-action-edit"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete('course', c._id)} className="btn-action-delete"><Trash2 size={16} /></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }; // Close renderCourses

    const handleCreateReviewer = async (e) => {
        e.preventDefault();
        setReviewerMsg({ text: '', type: '' });
        try {
            const res = await fetch('http://localhost:5000/api/admin/reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(reviewerForm),
            });
            const data = await res.json();
            if (res.ok) {
                setReviewerMsg({ text: `Reviewer "${data.reviewer.name}" created!`, type: 'success' });
                setReviewerForm({ name: '', email: '', password: '', specialization: '' });
                // Refresh list
                const listRes = await fetch('http://localhost:5000/api/admin/reviewers', { credentials: 'include' });
                if (listRes.ok) setReviewers(await listRes.json());
            } else {
                setReviewerMsg({ text: data.message || 'Failed to create reviewer.', type: 'error' });
            }
        } catch (err) {
            setReviewerMsg({ text: 'Network error.', type: 'error' });
        }
    };

    const handleDeleteReviewer = async (id) => {
        if (!window.confirm('Delete this reviewer account?')) return;
        try {
            await fetch(`http://localhost:5000/api/admin/users/reviewer/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            setReviewers(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const renderReviewers = () => (
        <div>
            <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card purple">
                    <div className="stat-icon"><Shield size={24} /></div>
                    <div className="stat-content">
                        <h3>Total Reviewers</h3>
                        <p className="stat-value">{reviewers.length}</p>
                    </div>
                </div>
            </div>

            {/* Create Reviewer Form */}
            <div style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
                padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserPlus size={18} /> Create Reviewer Account
                </h3>

                {reviewerMsg.text && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                        background: reviewerMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: reviewerMsg.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${reviewerMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    }}>
                        {reviewerMsg.text}
                    </div>
                )}

                <form onSubmit={handleCreateReviewer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input
                        type="text" placeholder="Full Name *" required
                        value={reviewerForm.name}
                        onChange={e => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                        style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                    <input
                        type="email" placeholder="Email Address *" required
                        value={reviewerForm.email}
                        onChange={e => setReviewerForm({ ...reviewerForm, email: e.target.value })}
                        style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                    <input
                        type="password" placeholder="Password *" required minLength={6}
                        value={reviewerForm.password}
                        onChange={e => setReviewerForm({ ...reviewerForm, password: e.target.value })}
                        style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                    <input
                        type="text" placeholder="Specialization (optional)"
                        value={reviewerForm.specialization}
                        onChange={e => setReviewerForm({ ...reviewerForm, specialization: e.target.value })}
                        style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                    <button type="submit" style={{
                        gridColumn: 'span 2', padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white', border: 'none', borderRadius: 8,
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>
                        <UserPlus size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        Create Reviewer
                    </button>
                </form>
            </div>

            {/* Reviewers List */}
            <h3 className="tab-section-title">Reviewer Accounts ({reviewers.length})</h3>
            {reviewerLoading ? (
                <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> Loading...</div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Specialization</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>
                            {reviewers.map(r => (
                                <tr key={r._id}>
                                    <td>{r.name}</td>
                                    <td>{r.email}</td>
                                    <td>{r.specialization || '—'}</td>
                                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => handleDeleteReviewer(r._id)} className="btn-action-delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {reviewers.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af' }}>No reviewers yet. Create one above.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="admin-dash-layout student-dash-layout">
            <header className="student-navbar">
                <div className="nav-brand text-green-500"><BarChart3 size={24} /> <span>Admin Panel</span></div>
                <nav className="nav-links">
                    <button onClick={() => setActiveTab('analytics')} className={`nav-link-item ${activeTab === 'analytics' ? 'active' : ''}`}><BarChart3 size={18} /> Analytics</button>
                    <button onClick={() => setActiveTab('revenue')} className={`nav-link-item ${activeTab === 'revenue' ? 'active' : ''}`}><BarChart3 size={18} /> Revenue</button>
                    <button onClick={() => setActiveTab('instructors')} className={`nav-link-item ${activeTab === 'instructors' ? 'active' : ''}`}><Users size={18} /> Instructors</button>
                    <button onClick={() => setActiveTab('students')} className={`nav-link-item ${activeTab === 'students' ? 'active' : ''}`}><Users size={18} /> Students</button>
                    <button onClick={() => setActiveTab('courses')} className={`nav-link-item ${activeTab === 'courses' ? 'active' : ''}`}><BookOpen size={18} /> Courses</button>
                    <button onClick={() => setActiveTab('reviewers')} className={`nav-link-item ${activeTab === 'reviewers' ? 'active' : ''}`}><Shield size={18} /> Reviewers</button>
                </nav>
                <div className="nav-user-info"><ProfileDropdown user={user} currentPath="/admin" /></div>
            </header>

            <main className="student-main-content">
                {activeTab === 'analytics' && <AnalyticsDashboard />}
                {activeTab === 'revenue' && <RevenueAnalytics />}
                {activeTab === 'instructors' && renderInstructors()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'courses' && renderCourses()}
                {activeTab === 'reviewers' && renderReviewers()}
                <LookupResults />
            </main>
        </div>
    );
};

export default AdminDashboard;