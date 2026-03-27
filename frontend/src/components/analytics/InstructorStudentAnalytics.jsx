import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorStudentAnalytics } from '../../store';
import { Search, Loader2, AlertCircle, Mail, BookOpen, CheckCircle, Clock } from 'lucide-react';
import './AnalyticsDashboard.css'; // Use shared analytics styles

const InstructorStudentAnalytics = () => {
    const dispatch = useDispatch();
    const { studentAnalytics, loading, error } = useSelector(state => state.analytics);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        dispatch(fetchInstructorStudentAnalytics());
    }, [dispatch]);

    if (loading && (!studentAnalytics || studentAnalytics.length === 0)) {
        return (
            <div className="analytics-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading student data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-error">
                <AlertCircle size={48} />
                <p>Error loading data: {error}</p>
                <button onClick={() => dispatch(fetchInstructorStudentAnalytics())} className="retry-btn">Retry</button>
            </div>
        );
    }

    // Filter Logic
    const filteredStudents = studentAnalytics?.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
        return matchesSearch && matchesStatus;
    }) || [];

    return (
        <div className="instructor-student-analytics">
            <div className="analytics-header-row">
                <div>
                    <h2>Student Analytics</h2>
                    <p className="text-gray-600">Track student progress and performance across your courses.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-wrapper">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students, emails, or courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="status-filter"
                    >
                        <option value="all">All Status</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <div className="table-card">
                <div className="table-responsive">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Enrolled Course</th>
                                <th>Progress</th>
                                <th>Avg. Quiz Score</th>
                                <th>Last Active</th>
                                <th>Engagement</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={`${student.id}-${student.courseName}`}>
                                        <td>
                                            <div className="student-info">
                                                <div className="student-name">{student.name}</div>
                                                <div className="student-email">
                                                    <Mail size={12} /> {student.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="course-badge">
                                                <BookOpen size={14} />
                                                <span>{student.courseName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-bar-sm">
                                                    <div
                                                        className="progress-fill-sm"
                                                        style={{
                                                            width: `${student.progress}%`,
                                                            backgroundColor: student.progress === 100 ? '#10b981' : '#3b82f6'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text-sm">{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            {student.avgQuizScore !== 'N/A' ? (
                                                <span className={`score-badge ${parseFloat(student.avgQuizScore) >= 80 ? 'high' : parseFloat(student.avgQuizScore) >= 60 ? 'medium' : 'low'}`}>
                                                    {student.avgQuizScore}%
                                                </span>
                                            ) : (
                                                <span className="no-data">No Quizzes</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Clock size={14} />
                                                <span>{new Date(student.lastActive).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {(() => {
                                                const lastActive = new Date(student.lastActive);
                                                const now = new Date();
                                                const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
                                                let engagement = 'Low';
                                                let colorClass = 'bg-red-100 text-red-700';

                                                if (student.status === 'completed') {
                                                    engagement = 'Completed';
                                                    colorClass = 'bg-green-100 text-green-700';
                                                } else if (daysSinceActive < 7 && student.progress > 0) {
                                                    engagement = 'High';
                                                    colorClass = 'bg-green-100 text-green-700';
                                                } else if (daysSinceActive < 30) {
                                                    engagement = 'Medium';
                                                    colorClass = 'bg-yellow-100 text-yellow-700';
                                                }

                                                return (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                                        {engagement}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${student.status}`}>
                                                {student.status === 'completed' ? <CheckCircle size={14} /> : null}
                                                {student.status === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No students found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstructorStudentAnalytics;
