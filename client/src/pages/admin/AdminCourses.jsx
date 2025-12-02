import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminCourses.css';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    instructor_id: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    refreshCoursesTable();
    populateInstructors();
    const interval = setInterval(refreshCoursesTable, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterTable();
  }, [searchTerm, subjectFilter, instructorFilter, courses]);

  const populateInstructors = async () => {
    try {
      const res = await fetch('/admin/instructors');
      const data = await res.json();
      setInstructors(data);
    } catch (err) {
      console.error('Error fetching instructors:', err);
    }
  };

  const refreshCoursesTable = async () => {
    setLoading(true);
    try {
      const res = await fetch('/admin/courses/data');
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error('Error refreshing courses:', err);
      alert('Error refreshing courses');
    } finally {
      setLoading(false);
    }
  };

  const filterTable = () => {
    const searchLower = searchTerm.toLowerCase();
    const subjectLower = subjectFilter.toLowerCase();
    const instructorLower = instructorFilter.toLowerCase();

    const filtered = courses.filter(course => {
      const title = course.title || '';
      const subject = course.subject || '';
      const instructorName = course.instructor_name || '';

      const matchesSearch =
        !searchTerm ||
        title.toLowerCase().includes(searchLower) ||
        subject.toLowerCase().includes(searchLower);
      const matchesSubject = !subjectFilter || subject.toLowerCase() === subjectLower;
      const matchesInstructor =
        !instructorFilter || instructorName.toLowerCase() === instructorLower;
      return matchesSearch && matchesSubject && matchesInstructor;
    });

    setFilteredCourses(filtered);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          subject: '',
          instructor_id: '',
          price: '',
          description: ''
        });
        refreshCoursesTable();
      } else {
        alert('Error adding course');
      }
    } catch (err) {
      console.error('Error adding course:', err);
      alert('Error adding course');
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/admin/courses/${editingCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingCourse(null);
        setFormData({
          title: '',
          subject: '',
          instructor_id: '',
          price: '',
          description: ''
        });
        refreshCoursesTable();
      } else {
        alert('Error updating course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      alert('Error updating course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const res = await fetch(`/admin/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshCoursesTable();
      } else {
        alert('Error deleting course');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error deleting course');
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      subject: course.subject,
      instructor_id: course.instructor_id,
      price: course.price,
      description: course.description || ''
    });
    setShowEditModal(true);
  };

  const uniqueSubjects = [...new Set(courses.map(c => c.subject || ''))].filter(Boolean).sort();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Course Management</h2>
            <div>
              <button
                className="btn btn-secondary me-2"
                onClick={refreshCoursesTable}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus me-2"></i>Add New Course
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  >
                    <option value="">All Subjects</option>
                    {uniqueSubjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                  >
                    <option value="">All Instructors</option>
                    {instructors.map(instr => (
                      <option key={instr._id} value={instr.name}>
                        {instr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Instructor</th>
                      <th>Enrolled</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No courses found
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map(course => (
                        <tr key={course._id}>
                          <td>{course.title}</td>
                          <td>{course.subject}</td>
                          <td>{course.instructor_name}</td>
                          <td>
                            <span className="badge bg-info">
                              {course.enrolled_count || 0}
                            </span>
                          </td>
                          <td>${(typeof course.price === 'number' ? course.price : 0).toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-info me-2"
                              onClick={() => openEditModal(course)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteCourse(course._id)}
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

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Course</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddCourse}>
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
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Instructor</label>
                    <select
                      className="form-select"
                      value={formData.instructor_id}
                      onChange={(e) =>
                        setFormData({ ...formData, instructor_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map(instr => (
                        <option key={instr._id} value={instr._id}>
                          {instr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Add Course
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Course</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditCourse}>
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
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Instructor</label>
                    <select
                      className="form-select"
                      value={formData.instructor_id}
                      onChange={(e) =>
                        setFormData({ ...formData, instructor_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map(instr => (
                        <option key={instr._id} value={instr._id}>
                          {instr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update Course
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

export default AdminCourses;
