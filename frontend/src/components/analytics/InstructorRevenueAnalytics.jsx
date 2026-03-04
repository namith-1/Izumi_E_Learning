import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorRevenueAnalytics } from '../../store';
import { DollarSign, Users, Loader2, TrendingUp } from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const InstructorRevenueAnalytics = () => {
    const dispatch = useDispatch();
    const { instructorRevenueData = [], loading } = useSelector(state => state.analytics);

    // Filter States
    const [revenueGranularity, setRevenueGranularity] = useState('day'); // 'day', 'month', 'year'
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1); // Default to last 30 days
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedCourse, setSelectedCourse] = useState('all');

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchInstructorRevenueAnalytics());
    }, [dispatch]);

    // Get unique courses for filter
    const uniqueCourses = useMemo(() => {
        if (!instructorRevenueData || instructorRevenueData.length === 0) return [];
        const courses = [...new Set(instructorRevenueData.map(d => JSON.stringify({ id: d.courseId, name: d.courseName })))];
        return courses.map(c => JSON.parse(c));
    }, [instructorRevenueData]);

    // Aggregation Logic
    const processedRevenueData = useMemo(() => {
        if (!instructorRevenueData || instructorRevenueData.length === 0) return [];

        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);

        // 1. Filter by Date Range and Course
        let filtered = instructorRevenueData.filter(record => {
            const recordDate = new Date(record.date);
            const dateMatch = recordDate >= from && recordDate <= to;
            const courseMatch = selectedCourse === 'all' || record.courseId.toString() === selectedCourse;
            return dateMatch && courseMatch;
        });

        // 2. Aggregate by Granularity
        const aggregated = {};
        
        filtered.forEach(record => {
            let key = record.date; // default 'day' (YYYY-MM-DD)
            
            if (revenueGranularity === 'month') {
                key = record.date.substring(0, 7); // Extracts 'YYYY-MM'
            } else if (revenueGranularity === 'year') {
                key = record.date.substring(0, 4); // Extracts 'YYYY'
            }

            if (!aggregated[key]) {
                aggregated[key] = { timePeriod: key, totalRevenue: 0, totalEnrollments: 0 };
            }
            aggregated[key].totalRevenue += record.dayWisePrice;
            aggregated[key].totalEnrollments += record.numberOfEnrollments;
        });

        // 3. Sort chronologically
        return Object.values(aggregated).sort((a, b) => a.timePeriod.localeCompare(b.timePeriod));
    }, [instructorRevenueData, dateFrom, dateTo, revenueGranularity, selectedCourse]);

    const totalRev = processedRevenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalEnr = processedRevenueData.reduce((sum, item) => sum + item.totalEnrollments, 0);
    const avgRevenuePerEnrollment = totalEnr > 0 ? (totalRev / totalEnr).toFixed(2) : 0;

    if (loading && instructorRevenueData.length === 0) {
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /> Loading revenue data...</div>;
    }

    return (
        <div className="instructor-revenue-analytics-container">
            {/* Top Stat Cards */}
            <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card green">
                    <div className="stat-icon"><DollarSign size={24} /></div>
                    <div className="stat-content">
                        <h3>Total Revenue</h3>
                        <p className="stat-value">${totalRev.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-content">
                        <h3>Total Enrollments</h3>
                        <p className="stat-value">{totalEnr}</p>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <h3>Avg per Enrollment</h3>
                        <p className="stat-value">${avgRevenuePerEnrollment}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-end', border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                <div className="input-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Select Course</label>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, minWidth: 200 }}>
                        <option value="all">All Courses</option>
                        {uniqueCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>From Date</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
                </div>
                <div className="input-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>To Date</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
                </div>
                <div className="input-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Group By</label>
                    <select value={revenueGranularity} onChange={e => setRevenueGranularity(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, minWidth: 150 }}>
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                    </select>
                </div>
            </div>

            {/* Line Chart */}
            <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
                <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Revenue Trend</h3>
                {processedRevenueData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>No revenue data found for this period.</div>
                ) : (
                    <div style={{ height: 400, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="timePeriod" />
                                <YAxis yAxisId="left" tickFormatter={(val) => `$${val}`} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip 
                                    formatter={(value, name) => [name === 'totalRevenue' ? `$${value.toFixed(2)}` : value, name === 'totalRevenue' ? 'Revenue' : 'Enrollments']}
                                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="totalRevenue" name="Revenue" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                                <Line yAxisId="right" type="monotone" dataKey="totalEnrollments" name="Enrollments" stroke="#3b82f6" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Bar Chart - Revenue by Course */}
            {selectedCourse === 'all' && processedRevenueData.length > 0 && (
                <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Revenue by Course</h3>
                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={instructorRevenueData.filter(r => {
                                const d = new Date(r.date);
                                const from = new Date(dateFrom);
                                const to = new Date(dateTo);
                                to.setHours(23, 59, 59, 999);
                                return d >= from && d <= to;
                            })}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={100} />
                                <YAxis tickFormatter={(val) => `$${val}`} />
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                <Bar dataKey="dayWisePrice" fill="#10b981" name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorRevenueAnalytics;
