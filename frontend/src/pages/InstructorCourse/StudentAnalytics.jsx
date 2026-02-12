// v1/frontend/src/pages/InstructorCourse/StudentAnalytics.jsx
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseAnalytics } from '../../store';
import { BarChart3, Users, Loader2, BookOpen } from 'lucide-react';

// Custom component for the simple trend graph
const EnrollmentTrendChart = ({ data }) => {
    // Sort data by date (from oldest to newest)
    const sortedData = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find max count for scaling the bars
    const maxCount = sortedData.reduce((max, item) => Math.max(max, item.count), 0);

    return (
        <div className="analytics-trend-chart" style={{ display: 'flex', gap: '0.5rem', height: '100px', alignItems: 'flex-end', padding: '0 0.5rem' }}>
            {sortedData.map(item => (
                <div key={item.date} style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <div 
                        style={{
                            // Scale height based on maxCount (max 80px visual height)
                            height: maxCount > 0 ? `${(item.count / maxCount) * 80}px` : '5px',
                            width: '80%',
                            backgroundColor: '#3b82f6', // Blue
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                        title={`${item.count} enrollments on ${item.date}`}
                    >
                        {/* Show count on top if there's any enrollment */}
                        {item.count > 0 && <span style={{fontSize: '0.7rem', color: '#111827', marginTop: '-1rem'}}>{item.count}</span>}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.25rem', whiteSpace: 'nowrap' }}>
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            ))}
        </div>
    );
};


const StudentAnalytics = () => {
    const dispatch = useDispatch();
    // Retrieve analytics data from the courses slice
    const { analyticsData, loading, error } = useSelector((state) => state.courses);

    useEffect(() => {
        dispatch(fetchCourseAnalytics());
    }, [dispatch]);
    
    // Calculate aggregated overall metrics
    const totalCourses = analyticsData.length;
    
    // Sum of enrollments across all courses. This counts each enrollment.
    const totalEnrollments = useMemo(() => {
        return analyticsData.reduce((sum, course) => sum + course.totalStudentsEnrolled, 0);
    }, [analyticsData]);
    
    // The "Overall Avg. Quiz Score" is intentionally removed to avoid confusion.
    // The per-course average is displayed in the breakdown below.


    return (
        <>
            <div className="dashboard-intro">
                <h1>Student Analytics</h1>
                <p className="text-gray-600">Overview of student performance and enrollment trends across your courses.</p>
            </div>
            
            {/* Overall Metrics - Simplified to remove the potentially confusing overall average quiz score */}
            <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
                    <h3 style={{ color: '#64748b' }}><BookOpen size={16} /> Courses Managed</h3>
                    <p style={{ color: '#0f172a', fontWeight: 'bold' }}>{totalCourses}</p>
                </div>
                <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
                    <h3 style={{ color: '#64748b' }}><Users size={16} /> Total Enrollments</h3>
                    <p style={{ color: '#0f172a', fontWeight: 'bold' }}>{totalEnrollments}</p>
                </div>
                {/* Placeholder for future metrics, ensuring 3-column layout is visually maintained */}
                <div className="stat-card" style={{ borderLeftColor: '#e2e8f0' }}>
                    <h3 style={{ color: '#64748b' }}>Future Metric</h3>
                    <p style={{ color: '#94a3b8', fontWeight: 'bold' }}>TBD</p>
                </div>
            </div>

            <h2 className="section-title" style={{ fontSize: '1.5rem', color: '#1e293b' }}>Course Performance Breakdown</h2>
            
            {loading ? (
                <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Fetching analytics data...</div>
            ) : error ? (
                <div className="error-state-full">Error loading analytics: {error}</div>
            ) : analyticsData.length === 0 ? (
                <div className="empty-state">
                    <BarChart3 size={48} className="text-gray-400 mb-4" />
                    <p>No published courses with enrollment data to display.</p>
                </div>
            ) : (
                <div className="course-analytics-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {analyticsData.map(course => (
                        // Reusing student course-card class with custom inline styles for a list/row layout
                        <div key={course._id} className="course-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderLeft: '5px solid #6366f1' }}>
                            {/* Course Info */}
                            <div style={{ flex: 2 }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{course.title}</h3>
                                <span className="badge-subject" style={{marginTop: '0.5rem', display: 'inline-block'}}>{course.subject}</span>
                            </div>
                            
                            {/* Enrollment Count */}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>Enrolled Students</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{course.totalStudentsEnrolled}</p>
                            </div>
                            
                            {/* Avg Quiz Score (PER COURSE - THIS IS THE CORRECT LOGIC) */}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>Avg. Quiz Score</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: course.averageQuizScore >= 50 ? '#10b981' : '#f59e0b' }}>
                                    {/* Display score, handle null if no one has taken a quiz */}
                                    {course.averageQuizScore !== null ? `${course.averageQuizScore.toFixed(1)}%` : 'N/A'}
                                </p>
                            </div>
                            
                            {/* Enrollment Trend Chart */}
                            <div style={{ flex: 2, paddingLeft: '1rem', borderLeft: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Enrollment Trend (Last 7 Days)</h4>
                                <EnrollmentTrendChart data={course.enrollmentTrend} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default StudentAnalytics;