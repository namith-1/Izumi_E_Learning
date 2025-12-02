import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../services/studentApi';
import './StudentCourseList.css';

const StudentCourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollmentStatus, setEnrollmentStatus] = useState({});
    const { student } = useSelector(state => state.studentAuth);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await apiClient.get('/api/courses');
            // apiClient interceptor returns response.data directly
            setCourses(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        console.log("Enroll clicked for course:", courseId);
        if (!student) {
            console.log("No student logged in");
            alert("Please login to enroll.");
            navigate('/student/login');
            return;
        }

        try {
            // Use student._id or student.id, fallback to session on backend if needed
            const studentId = student._id || student.id;
            console.log("Enrolling student:", studentId, "into course:", courseId);
            
            const data = await apiClient.get(`/enroll?studentId=${studentId}&courseId=${courseId}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            console.log("Enroll response:", data);

            // apiClient returns the data object directly
            if (data && (data.success || data.enrolled)) {
                setEnrollmentStatus(prev => ({ ...prev, [courseId]: { type: 'success', msg: 'Enrolled successfully!' } }));
                if (data.redirectUrl) {
                    console.log("Redirecting to:", data.redirectUrl);
                    navigate(data.redirectUrl);
                } else {
                     // Fallback redirect
                     navigate(`/course/${courseId}`);
                }
            } else {
                console.warn("Enrollment response missing success flag:", data);
                // If we got HTML back unexpectedly, it might be a redirect script.
                // But we can't execute it easily.
                // Let's assume success if we got a 200 OK (which we did if we are here)
                // and try to redirect.
                if (typeof data === 'string' && data.includes('window.location.replace')) {
                     navigate(`/course/${courseId}`);
                }
            }
        } catch (error) {
            console.error("Enrollment error:", error);
            if (error.response && error.response.status === 401) {
                alert("Session expired. Please login again.");
                navigate('/student/login');
            } else {
                setEnrollmentStatus(prev => ({ ...prev, [courseId]: { type: 'error', msg: 'Enrollment failed or already enrolled.' } }));
            }
        }
    };

    if (loading) return <div>Loading courses...</div>;

    return (
        <div className="student-course-list-page">
            <h2>Available Courses</h2>
            <div className="course-grid">
                {courses.map(course => (
                    <div key={course._id || course.id} className="course-card">
                        <h3>{course.title}</h3>
                        <p>{course.description || "No description available."}</p>
                        
                        <div className="course-actions">
                            <button 
                                className="btn-enroll" 
                                onClick={() => handleEnroll(course._id || course.id)}
                            >
                                Enroll
                            </button>
                            <Link 
                                to={`/course/${course._id || course.id}`} 
                                className="btn-view"
                            >
                                View Details
                            </Link>
                        </div>
                        {enrollmentStatus[course._id || course.id] && (
                            <p className={`enrollment-status status-${enrollmentStatus[course._id || course.id].type}`}>
                                {enrollmentStatus[course._id || course.id].msg}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentCourseList;
