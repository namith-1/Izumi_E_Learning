import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminContent.css';

const AdminContent = () => {
  const [contentModules, setContentModules] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    text: '',
    url: ''
  });

  useEffect(() => {
    populateCourses();
    refreshContentTable();
    const interval = setInterval(refreshContentTable, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchTerm, courseFilter, contentModules]);

  const populateCourses = async () => {
    try {
      const response = await fetch('/admin/courses/list');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          console.error('Courses data is not an array:', data);
          setCourses([]);
        }
      } else {
        console.error('Failed to fetch courses list');
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  };

  const refreshContentTable = async () => {
    setLoading(true);
    try {
      const res = await fetch('/admin/content/data');
      const data = await res.json();
      setContentModules(data);
    } catch (err) {
      console.error('Error refreshing content:', err);
      alert('Error refreshing content');
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    const searchLower = searchTerm.toLowerCase();

    const filtered = contentModules.filter(module => {
      const title = module.title || '';
      const description = module.description || module.text || '';
      
      const matchesSearch =
        !searchTerm ||
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
      const matchesCourse =
        !courseFilter ||
        module.course_id === courseFilter;

      return matchesSearch && matchesCourse;
    });

    setFilteredContent(filtered);
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          course_id: '',
          text: '',
          url: ''
        });
        refreshContentTable();
      } else {
        alert('Error adding content');
      }
    } catch (err) {
      console.error('Error adding content:', err);
      alert('Error adding content');
    }
  };

  const handleEditContent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/admin/content/${editingContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingContent(null);
        setFormData({
          title: '',
          course_id: '',
          text: '',
          url: ''
        });
        refreshContentTable();
      } else {
        alert('Error updating content');
      }
    } catch (err) {
      console.error('Error updating content:', err);
      alert('Error updating content');
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?'))
      return;

    try {
      const res = await fetch(`/admin/content/${contentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshContentTable();
      } else {
        alert('Error deleting content');
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      alert('Error deleting content');
    }
  };

  const openEditModal = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      course_id: content.course_id,
      text: content.text,
      url: content.url || ''
    });
    setShowEditModal(true);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Content Management</h2>
            <div>
              <button
                className="btn btn-secondary me-2"
                onClick={refreshContentTable}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus me-2"></i>Add New Content
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Course</th>
                      <th>Text</th>
                      <th>URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No content found
                        </td>
                      </tr>
                    ) : (
                      filteredContent.map(content => (
                        <tr key={content._id}>
                          <td>{content.title}</td>
                          <td>{getCourseName(content.course_id)}</td>
                          <td className="content-cell">
                            {content.text}
                          </td>
                          <td>
                            {content.url ? (
                              <a
                                href={content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="fas fa-link"></i>
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info me-2"
                              onClick={() => openEditModal(content)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteContent(content._id)}
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

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Content</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddContent}>
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select
                      className="form-select"
                      value={formData.course_id}
                      onChange={(e) =>
                        setFormData({ ...formData, course_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Content Text</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.text}
                      onChange={(e) =>
                        setFormData({ ...formData, text: e.target.value })
                      }
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Add Content
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Content</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditContent}>
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select
                      className="form-select"
                      value={formData.course_id}
                      onChange={(e) =>
                        setFormData({ ...formData, course_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Content Text</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.text}
                      onChange={(e) =>
                        setFormData({ ...formData, text: e.target.value })
                      }
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update Content
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

export default AdminContent;
