import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    fetchAllAdminData, deleteUserAdmin, deleteCourseAdmin, updateCourseAdmin, 
    fetchStudentEnrollmentByEmail, fetchTeacherCoursesByEmail, clearLookup 
} from '../store';
import { 
    Users, BookOpen, BarChart3, Loader2, Trash2, Edit, Save, X, Search, Eye 
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown'; 
import './css/AdminDashboard.css'; 
import '../pages/css/StudentDashboard.css';

// --- Sub-Components (Defined OUTSIDE to prevent re-render focus loss) ---

const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="search-input-group mb-4" style={{maxWidth: '400px', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', backgroundColor: 'white'}}>
        <Search size={18} className="text-gray-400 mr-2" />
        <input 
            type="text" 
            placeholder={placeholder} 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            style={{border: 'none', outline: 'none', width: '100%'}}
        />
    </div>
);

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { 
        students, teachers, courses, loading, 
        lookupResult, lookupError, lookupLoading, lookupType 
    } = useSelector(state => state.admin);

    const [activeTab, setActiveTab] = useState('instructors');
    
    // Independent Search States for each section
    const [instructorSearch, setInstructorSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    
    // Edit States
    const [isEditingCourse, setIsEditingCourse] = useState(null);
    const [courseEditData, setCourseEditData] = useState({});

    // --- Effects ---
    useEffect(() => {
        if (user?.role === 'admin') dispatch(fetchAllAdminData());
        else navigate('/login', { replace: true });
    }, [dispatch, user, navigate]);

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
        if(window.confirm("Are you sure? This is irreversible.")) {
            if(role === 'course') dispatch(deleteCourseAdmin(id));
            else dispatch(deleteUserAdmin({ role, id }));
        }
    };

    const handleLookup = (type, email) => {
        dispatch(clearLookup());
        if(type === 'teacher') dispatch(fetchTeacherCoursesByEmail(email));
        if(type === 'student') dispatch(fetchStudentEnrollmentByEmail(email));
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

    // --- Main Renders ---

    const renderInstructors = () => (
        <div>
            <div className="flex justify-between items-end mb-4">
                <h3 className="tab-section-title mb-0">Instructors ({filteredTeachers.length})</h3>
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

    const renderStudents = () => (
        <div>
            <h3 className="tab-section-title">Students ({filteredStudents.length})</h3>
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

    const renderCourses = () => (
        <div>
            <h3 className="tab-section-title">Courses ({filteredCourses.length})</h3>
            <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder="Search Title, Subject or Instructor..." />
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead><tr><th>Title</th><th>Subject</th><th>Instructor</th><th>Students</th><th>Score</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filteredCourses.map(c => (
                            <tr key={c._id}>
                                {isEditingCourse === c._id ? (
                                    <>
                                        <td><input className="table-input" value={courseEditData.title} onChange={e=>setCourseEditData({...courseEditData, title:e.target.value})} /></td>
                                        <td><input className="table-input" value={courseEditData.subject} onChange={e=>setCourseEditData({...courseEditData, subject:e.target.value})} /></td>
                                        <td>{c.instructorName}</td>
                                        <td>{c.totalStudentsRegistered}</td>
                                        <td>-</td>
                                        <td className="flex gap-1">
                                            <button onClick={() => handleSaveCourse(c._id)} className="btn-action-save"><Save size={16}/></button>
                                            <button onClick={() => setIsEditingCourse(null)} className="btn-action-cancel"><X size={16}/></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{c.title}</td>
                                        <td>{c.subject}</td>
                                        <td>{c.instructorName}</td>
                                        <td>{c.totalStudentsRegistered}</td>
                                        <td>{c.averageQuizScore ? c.averageQuizScore.toFixed(1) + '%' : 'N/A'}</td>
                                        <td className="flex gap-1">
                                            <button onClick={() => { setIsEditingCourse(c._id); setCourseEditData(c); }} className="btn-action-edit"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete('course', c._id)} className="btn-action-delete"><Trash2 size={16}/></button>
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

    return (
        <div className="admin-dash-layout student-dash-layout">
            <header className="student-navbar">
                <div className="nav-brand text-green-500"><BarChart3 size={24} /> <span>Admin Panel</span></div>
                <nav className="nav-links">
                    <button onClick={() => setActiveTab('instructors')} className={`nav-link-item ${activeTab==='instructors'?'active':''}`}><Users size={18}/> Instructors</button>
                    <button onClick={() => setActiveTab('students')} className={`nav-link-item ${activeTab==='students'?'active':''}`}><Users size={18}/> Students</button>
                    <button onClick={() => setActiveTab('courses')} className={`nav-link-item ${activeTab==='courses'?'active':''}`}><BookOpen size={18}/> Courses</button>
                </nav>
                <div className="nav-user-info"><ProfileDropdown user={user} currentPath="/admin" /></div>
            </header>

            <main className="student-main-content">
                {activeTab === 'instructors' && renderInstructors()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'courses' && renderCourses()}
                <LookupResults />
            </main>
        </div>
    );
};

export default AdminDashboard;