import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminRequests.css';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  useEffect(() => {
    refreshRequestsTable();
    const interval = setInterval(refreshRequestsTable, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, priorityFilter, courseFilter, requests]);

  const refreshRequestsTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/admin/requests/data', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }
      const data = await response.json();
      setRequests(data);
      updateStatistics(data);
    } catch (err) {
      console.error('Error refreshing requests:', err);
      alert('Error refreshing requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatistics = (requestData) => {
    const total = requestData.length;
    const pending = requestData.filter(r => r.status === 'pending').length;
    const approved = requestData.filter(r => r.status === 'approved').length;
    const rejected = requestData.filter(r => r.status === 'rejected').length;

    setStats({ total, pending, approved, rejected });
  };

  const filterRequests = () => {
    const searchLower = searchTerm.toLowerCase();
    const statusLower = statusFilter.toLowerCase();
    const priorityLower = priorityFilter.toLowerCase();

    const filtered = requests.filter(req => {
      const user = req.user || '';
      const message = req.message || '';
      
      const matchesSearch =
        !searchTerm ||
        user.toLowerCase().includes(searchLower) ||
        message.toLowerCase().includes(searchLower);
      const matchesStatus = !statusFilter || req.status === statusLower;
      const matchesPriority =
        !priorityFilter || req.priority === priorityLower;
      const matchesCourse =
        !courseFilter ||
        (req.course && req.course.toLowerCase() === courseFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesPriority && matchesCourse;
    });

    setFilteredRequests(filtered);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setUpdateStatus(request.status);
    setUpdateNotes(request.notes || '');
    setShowViewModal(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/admin/requests/${selectedRequest._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          notes: updateNotes
        })
      });

      if (response.ok) {
        setShowViewModal(false);
        setSelectedRequest(null);
        refreshRequestsTable();
      } else {
        alert('Error updating request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request');
    }
  };

  const handleQuickAction = async (requestId, action) => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const response = await fetch(`/admin/requests/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        refreshRequestsTable();
      } else {
        alert('Error updating request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?'))
      return;

    try {
      const response = await fetch(`/admin/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        refreshRequestsTable();
      } else {
        alert('Error deleting request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error deleting request');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCourseFilter('');
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#fd7e14';
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const uniqueCourses = [...new Set(requests
    .filter(r => r.course)
    .map(r => r.course)
  )].sort();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Request Management</h2>
            <button
              className="btn btn-secondary"
              onClick={refreshRequestsTable}
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
                <div className="card-body text-center">
                  <h5 className="card-title">Total Requests</h5>
                  <h2>{stats.total}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body text-center">
                  <h5 className="card-title">Pending</h5>
                  <h2 style={{ color: '#fd7e14' }}>{stats.pending}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body text-center">
                  <h5 className="card-title">Approved</h5>
                  <h2 style={{ color: '#28a745' }}>{stats.approved}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card stat-card">
                <div className="card-body text-center">
                  <h5 className="card-title">Rejected</h5>
                  <h2 style={{ color: '#6c757d' }}>{stats.rejected}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {uniqueCourses.map(course => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Message</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map(request => (
                        <tr key={request._id}>
                          <td>{request.user}</td>
                          <td className="message-cell">
                            {request.message}
                          </td>
                          <td>
                            <span
                              className={`badge bg-${getPriorityColor(request.priority)}`}
                              style={{
                                animation: request.priority?.toLowerCase() === 'high'
                                  ? 'pulse 2s ease-in-out infinite'
                                  : 'none'
                              }}
                            >
                              {request.priority}
                            </span>
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(request.status),
                                color: 'white'
                              }}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {new Date(request.date).toLocaleDateString('en-GB')}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info me-2"
                              onClick={() => handleViewRequest(request)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() =>
                                    handleQuickAction(request._id, 'approve')
                                  }
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() =>
                                    handleQuickAction(request._id, 'reject')
                                  }
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteRequest(request._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
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

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>User:</strong>
                    <p>{selectedRequest.user}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Priority:</strong>
                    <p>
                      <span className={`badge bg-${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Date:</strong>
                    <p>{new Date(selectedRequest.date).toLocaleString()}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Course:</strong>
                    <p>{selectedRequest.course || 'N/A'}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Message:</strong>
                  <p className="message-full">{selectedRequest.message}</p>
                </div>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <select
                    className="form-select"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-3">
                  <strong>Notes:</strong>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateRequest}
                >
                  Update Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
