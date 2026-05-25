import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorAnalytics } from '../../store';
import TimeRangeFilter from './TimeRangeFilter';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, Star, Loader2, AlertCircle } from 'lucide-react';
import './InstructorAnalytics.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const InstructorAnalytics = ({ instructorId }) => {
    const dispatch = useDispatch();
    const { instructorStats, loading, error } = useSelector(state => state.analytics);
    const { user } = useSelector(state => state.auth);

    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        // Pass instructorId if present, otherwise just timeRange (which defaults to current user)
        const params = instructorId ? { days: timeRange, instructorId } : timeRange;
        dispatch(fetchInstructorAnalytics(params));
    }, [dispatch, timeRange, instructorId]);

    if (loading && !instructorStats) {
        return (
            <div className="analytics-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-error">
                <AlertCircle size={48} />
                <p>Error loading analytics: {error}</p>
                <button onClick={() => dispatch(fetchInstructorAnalytics(instructorId ? { days: timeRange, instructorId } : timeRange))} className="retry-btn">Retry</button>
            </div>
        );
    }

    if (!instructorStats) return null;

    const { overview, subjectDistribution, coursePerformance, enrollmentTrend } = instructorStats;

    return (
        <div className="instructor-analytics">
            <header className="analytics-header">
                <div>
                    <h1>{instructorId ? 'Instructor Insights' : 'Instructor Dashboard'}</h1>
                    <p>{instructorId ? 'Viewing detailed performance metrics.' : `Welcome back, ${user?.name}. Here's how your courses are performing.`}</p>
                </div>
                <TimeRangeFilter selectedRange={timeRange} onChange={setTimeRange} />
            </header>

            {/* Overview Stats */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="icon-wrapper"><BookOpen size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Courses</h3>
                        <p className="value">{overview.totalCourses}</p>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="icon-wrapper"><Users size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Students</h3>
                        <p className="value">{overview.totalStudents}</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="icon-wrapper"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>Active Students</h3>
                        <p className="value">{overview.activeStudents}</p>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="icon-wrapper"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>Completion Rate</h3>
                        <p className="value">{overview.completionRate}%</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-container main-chart">
                    <h3>Enrollment Trend</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={enrollmentTrend}>
                                <defs>
                                    <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEnrollments)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container side-chart">
                    <h3>Subject Distribution</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={subjectDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {subjectDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Course Performance Table */}
            <div className="table-section">
                <h3>Course Performance</h3>
                <div className="table-responsive">
                    <table className="performance-table">
                        <thead>
                            <tr>
                                <th>Course Title</th>
                                <th>Subject</th>
                                <th>Enrollments</th>
                                <th>Completion Rate</th>
                                <th>Avg. Quiz Score</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coursePerformance.map(course => (
                                <tr key={course._id}>
                                    <td className="course-title-cell">
                                        <span className="course-title">{course.title}</span>
                                    </td>
                                    <td><span className="subject-badge">{course.subject}</span></td>
                                    <td>{course.totalEnrollments}</td>
                                    <td>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${course.completionRate}%`, backgroundColor: course.completionRate > 70 ? '#10b981' : course.completionRate > 40 ? '#f59e0b' : '#ef4444' }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">{course.completionRate}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {course.avgQuizScore ? (
                                            <span className={`score-badge ${course.avgQuizScore >= 80 ? 'high' : course.avgQuizScore >= 60 ? 'medium' : 'low'}`}>
                                                {Math.round(course.avgQuizScore)}%
                                            </span>
                                        ) : (
                                            <span className="no-data">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="rating-cell">
                                            <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                                            <span className="rating-text">{course.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstructorAnalytics;
