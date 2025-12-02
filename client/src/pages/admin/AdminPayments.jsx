import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminPayments.css';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    monthCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    avgTransaction: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('daily');
  const [topCourses, setTopCourses] = useState([]);

  useEffect(() => {
    loadPaymentData();
    const interval = setInterval(loadPaymentData, 15000);
    return () => clearInterval(interval);
  }, [chartRange]);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, dateFilter, payments]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/admin/payments/data?range=${chartRange}`);
      if (!response.ok) throw new Error('Failed to fetch payment data');

      const data = await response.json();
      setPayments(data.payments || []);
      setStats(data.stats || {});
      setTopCourses(data.chartData?.topCourses || []);
    } catch (error) {
      console.error('Error loading payment data:', error);
      alert('Error loading payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    const searchLower = searchTerm.toLowerCase();

    const filtered = payments.filter(p => {
      const matchSearch =
        !searchTerm ||
        p.user.toLowerCase().includes(searchLower) ||
        p.course.toLowerCase().includes(searchLower);
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchDate =
        !dateFilter ||
        new Date(p.date).toISOString().split('T')[0] === dateFilter;
      return matchSearch && matchStatus && matchDate;
    });

    setFilteredPayments(filtered);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm('Are you sure you want to update this payment status?'))
      return;

    try {
      const response = await fetch(`/admin/payments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadPaymentData();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Payments Management</h2>
            <button
              className="btn btn-secondary"
              onClick={loadPaymentData}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-2"></i>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body">
                  <h5 className="card-title">Total Revenue</h5>
                  <h2>${stats.totalRevenue?.toLocaleString()}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body">
                  <h5 className="card-title">Month Revenue</h5>
                  <h2>${stats.monthRevenue?.toLocaleString()}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body">
                  <h5 className="card-title">Pending Amount</h5>
                  <h2>${stats.pendingAmount?.toLocaleString()}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body">
                  <h5 className="card-title">Avg Transaction</h5>
                  <h2>${stats.avgTransaction?.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Top Courses */}
          {topCourses.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Top Courses by Revenue</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {topCourses.map((course, index) => (
                    <div key={index} className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <span
                          className="badge me-2"
                          style={{
                            backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'][
                              index
                            ] || '#6c757d'
                          }}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div className="fw-bold">{course.title}</div>
                          <small className="text-muted">
                            ${course.revenue} - {course.sales} sales
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="date"
                    className="form-control"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Course</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(payment => (
                        <tr key={payment._id}>
                          <td>{payment.user}</td>
                          <td>{payment.course}</td>
                          <td>${payment.amount.toFixed(2)}</td>
                          <td>
                            {new Date(payment.date).toLocaleDateString('en-GB')}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                payment.status === 'completed'
                                  ? 'bg-success'
                                  : payment.status === 'pending'
                                  ? 'bg-warning'
                                  : 'bg-danger'
                              }`}
                            >
                              {(payment.status || 'unknown').charAt(0).toUpperCase() +
                                (payment.status || 'unknown').slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              {payment.status === 'pending' && (
                                <button
                                  className="btn btn-success"
                                  onClick={() =>
                                    handleUpdateStatus(payment._id, 'completed')
                                  }
                                >
                                  Approve
                                </button>
                              )}
                              {payment.status !== 'failed' && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() =>
                                    handleUpdateStatus(payment._id, 'failed')
                                  }
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
