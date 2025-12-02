import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
  clearError,
  clearSuccess
} from '../../redux/slices/adminSlice';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminUsers.css';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error, success, successMessage } = useSelector((state) => state.admin);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    address: '',
    role: 'student'
  });

  useEffect(() => {
    dispatch(fetchUsers());
    const interval = setInterval(() => {
      dispatch(fetchUsers());
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    filterTable();
  }, [searchTerm, roleFilter, users]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      setTimeout(() => dispatch(clearSuccess()), 3000);
      if (showAddModal) setShowAddModal(false);
      if (showEditModal) setShowEditModal(false);
    }
  }, [success, dispatch, showAddModal, showEditModal]);

  const filterTable = () => {
    const searchLower = searchTerm.toLowerCase();
    const roleLower = roleFilter.toLowerCase();

    // Users is already an array from Redux
    const filtered = Array.isArray(users)
      ? users.filter(user => {
          const name = user.name || '';
          const email = user.email || '';
          const role = user.role || '';

          const matchesSearch =
            !searchTerm ||
            name.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);
          const matchesRole = !roleLower || role.toLowerCase() === roleLower;
          return matchesSearch && matchesRole;
        })
      : [];

    setFilteredUsers(filtered);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    dispatch(addUser(formData))
      .unwrap()
      .then(() => {
        setFormData({ name: '', email: '', password: '', contact: '', address: '', role: 'student' });
      })
      .catch((err) => {
        console.error('Error adding user:', err);
      });
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    // Don't send password on edit for now
    const { password, ...updateData } = formData;
    dispatch(updateUser({ userId: editingUser._id, userData: updateData }))
      .unwrap()
      .then(() => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', contact: '', address: '', role: 'student' });
      })
      .catch((err) => {
        console.error('Error updating user:', err);
      });
  };

  const handleDeleteUser = async (userId, role) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    dispatch(deleteUser({ userId, role }))
      .unwrap()
      .catch((err) => {
        console.error('Error deleting user:', err);
      });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      contact: user.contact || '',
      address: user.address || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>User Management</h2>
            <div>
              <button
                className="btn btn-secondary me-2"
                onClick={() => dispatch(fetchUsers())}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus me-2"></i>Add New User
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => dispatch(clearError())}
              ></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {successMessage}
            </div>
          )}

          {/* Search and Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} data-role={user.role}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.contact || '-'}</td>
                          <td>{user.address || '-'}</td>
                          <td>
                            <span
                              className={`badge ${
                                user.role === 'student' ? 'bg-primary' : 'bg-success'
                              }`}
                            >
                              {(user.role || 'unknown').charAt(0).toUpperCase() + (user.role || 'unknown').slice(1)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info me-2"
                              onClick={() => openEditModal(user)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteUser(user._id, user.role)}
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddUser}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Add User
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditUser}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update User
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
