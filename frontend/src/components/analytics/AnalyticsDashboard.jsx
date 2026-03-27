import React, { useEffect, useState } from 'react';
import TimeRangeFilter from './TimeRangeFilter';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAdminAnalytics,
    fetchGrowthTrends,
    fetchSubjectDistribution,
    fetchTopCourses,
    fetchInstructorLeaderboard
} from '../../store';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import InstructorAnalytics from './InstructorAnalytics';
import { TrendingUp, TrendingDown, Users, BookOpen, GraduationCap, Award, Loader2, Filter, X, Eye } from 'lucide-react';
import './AnalyticsDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AnalyticsDashboard = () => {
    const dispatch = useDispatch();
    const { overview, growthTrends, subjectDistribution, topCourses, instructorLeaderboard, loading, error } = useSelector(state => state.analytics);

    const [timeRange, setTimeRange] = useState(30);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [selectedInstructorId, setSelectedInstructorId] = useState(null);

    useEffect(() => {
        dispatch(fetchAdminAnalytics(timeRange));
        dispatch(fetchGrowthTrends({ days: timeRange, subject: selectedSubject }));
        dispatch(fetchSubjectDistribution());
        dispatch(fetchTopCourses({ limit: 10, sortBy: 'enrollments', subject: selectedSubject }));
        dispatch(fetchInstructorLeaderboard());
    }, [dispatch, timeRange, selectedSubject]);

    // Derived lists for dropdowns
    const subjects = ['All', ...new Set(subjectDistribution?.map(s => s.subject) || [])];

    const handleInstructorClick = (instructorId) => {
        setSelectedInstructorId(instructorId);
    };

    const closeInstructorModal = () => {
        setSelectedInstructorId(null);
    };

    if (loading && !overview) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-container">Error loading analytics: {error}</div>;
    }

    const getTrendIndicator = (current, previous) => {
        if (!previous || previous === 0) return null;
        const change = ((current / previous) * 100 - 100).toFixed(1);
        const isPositive = change > 0;
        return (
            <span className={`trend-indicator ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(change)}%
            </span>
        );
    };

    return (
        <div className="analytics-dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-intro">
                <h1>Platform Analytics</h1>
                <p className="text-gray-600">Comprehensive insights into platform performance and growth</p>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeRangeFilter selectedRange={timeRange} onChange={setTimeRange} />

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} className="text-gray-500" />
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="status-filter"
                    >
                        {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject === 'All' ? 'All Subjects' : subject}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="metrics-grid">
                    <div className="stat-card blue">
                        <div className="stat-icon"><Users size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Students</h3>
                            <p className="stat-value">{overview.totalStudents}</p>
                            {overview.growth && getTrendIndicator(overview.growth.students, overview.totalStudents - overview.growth.students)}
                        </div>
                    </div>

                    <div className="stat-card green">
                        <div className="stat-icon"><GraduationCap size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Instructors</h3>
                            <p className="stat-value">{overview.totalInstructors}</p>
                            {overview.growth && getTrendIndicator(overview.growth.instructors, overview.totalInstructors - overview.growth.instructors)}
                        </div>
                    </div>

                    <div className="stat-card orange">
                        <div className="stat-icon"><BookOpen size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Courses</h3>
                            <p className="stat-value">{overview.totalCourses}</p>
                            {overview.growth && getTrendIndicator(overview.growth.courses, overview.totalCourses - overview.growth.courses)}
                        </div>
                    </div>

                    <div className="stat-card purple">
                        <div className="stat-icon"><Award size={24} /></div>
                        <div className="stat-content">
                            <h3>Completion Rate</h3>
                            <p className="stat-value">{overview.completionRate}%</p>
                            <span className="stat-label">Platform Average</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Growth Trends Section */}
            {growthTrends && (
                <div className="analytics-section">
                    <h2 className="section-title">Growth Trends (Last {timeRange} Days) {selectedSubject !== 'All' && `- ${selectedSubject}`}</h2>
                    <div className="chart-grid">
                        <div className="chart-card">
                            <h3>User Registrations</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={growthTrends.students}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" name="Students" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <h3>Course Creations</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={growthTrends.courses}>
                                    <defs>
                                        <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCourses)" name="Courses" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card full-width">
                            <h3>Enrollment Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={growthTrends.enrollments}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: '#f3f4f6' }}
                                    />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Enrollments" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Subject Distribution & Top Courses */}
            <div className="analytics-section">
                <div className="chart-grid">
                    {subjectDistribution && subjectDistribution.length > 0 && (
                        <div className="chart-card">
                            <h3>Subject Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={subjectDistribution}
                                        dataKey="enrollments"
                                        nameKey="subject"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => entry.subject}
                                    >
                                        {subjectDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {topCourses && topCourses.length > 0 && (
                        <div className="chart-card">
                            <h3>Top Courses by Enrollment {selectedSubject !== 'All' && `(${selectedSubject})`}</h3>
                            <div className="top-courses-list">
                                {topCourses.slice(0, 5).map((course, idx) => (
                                    <div key={course._id} className="course-item">
                                        <div className="course-rank">#{idx + 1}</div>
                                        <div className="course-info">
                                            <h4>{course.title}</h4>
                                            <span className="course-subject">{course.subject}</span>
                                        </div>
                                        <div className="course-stats">
                                            <span className="enrollment-count">{course.totalEnrollments} students</span>
                                            <span className="completion-rate">{course.completionRate?.toFixed(0)}% completion</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructor Leaderboard */}
            {instructorLeaderboard && instructorLeaderboard.length > 0 && (
                <div className="analytics-section">
                    <h2 className="section-title">Instructor Leaderboard</h2>
                    <div className="table-card">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Instructor</th>
                                    <th>Courses</th>
                                    <th>Students Taught</th>
                                    <th>Completion Rate</th>
                                    <th>Avg Rating</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructorLeaderboard.slice(0, 10).map((instructor, idx) => (
                                    <tr key={instructor._id}>
                                        <td className="rank-cell">
                                            <span className={`rank-badge ${idx < 3 ? 'top-three' : ''}`}>
                                                #{idx + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="instructor-name">
                                                <strong>{instructor.name}</strong>
                                                {instructor.specialization && (
                                                    <span className="specialization">{instructor.specialization}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{instructor.courseCount}</td>
                                        <td><strong className="highlight-blue">{instructor.totalStudents}</strong></td>
                                        <td>
                                            <span className={`completion-badge ${instructor.completionRate >= 70 ? 'high' : instructor.completionRate >= 40 ? 'medium' : 'low'}`}>
                                                {instructor.completionRate}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className="rating-display">⭐ {instructor.avgRating}</span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleInstructorClick(instructor._id)}
                                                className="btn-icon text-blue-600 hover:text-blue-800"
                                                title="View Detailed Analytics"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Instructor Analytics Modal */}
            {selectedInstructorId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={closeInstructorModal}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <div className="p-6">
                            <InstructorAnalytics instructorId={selectedInstructorId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
