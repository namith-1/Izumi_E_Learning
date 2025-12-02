# Admin Components - Redux Integration Template

This file shows the pattern for updating remaining admin components to use Redux.

## Pattern for AdminCourses.jsx

Replace the current implementation with this Redux-connected version:

```javascript
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  clearError,
  clearSuccess
} from '../../redux/slices/adminSlice';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminCourses.css';

const AdminCourses = () => {
  const dispatch = useDispatch();
  const { courses, loading, error, success, successMessage } = useSelector((state) => state.admin);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');
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
    dispatch(fetchCourses());
    const interval = setInterval(() => {
      dispatch(fetchCourses());
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    filterTable();
  }, [searchTerm, subjectFilter, instructorFilter, courses]);

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
    const subjectLower = subjectFilter.toLowerCase();
    const instructorLower = instructorFilter.toLowerCase();

    const filtered = Array.isArray(courses)
      ? courses.filter(course => {
          const matchesSearch =
            !searchTerm ||
            course.title.toLowerCase().includes(searchLower) ||
            course.subject.toLowerCase().includes(searchLower);
          const matchesSubject = !subjectFilter || course.subject.toLowerCase() === subjectLower;
          const matchesInstructor =
            !instructorFilter || course.instructor_name.toLowerCase() === instructorLower;
          return matchesSearch && matchesSubject && matchesInstructor;
        })
      : [];

    setFilteredCourses(filtered);
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    dispatch(addCourse(formData))
      .unwrap()
      .then(() => {
        setFormData({
          title: '',
          subject: '',
          instructor_id: '',
          price: '',
          description: ''
        });
      })
      .catch((err) => {
        console.error('Error adding course:', err);
      });
  };

  const handleEditCourse = (e) => {
    e.preventDefault();
    dispatch(updateCourse({ courseId: editingCourse._id, courseData: formData }))
      .unwrap()
      .then(() => {
        setEditingCourse(null);
        setFormData({
          title: '',
          subject: '',
          instructor_id: '',
          price: '',
          description: ''
        });
      })
      .catch((err) => {
        console.error('Error updating course:', err);
      });
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    dispatch(deleteCourse(courseId))
      .unwrap()
      .catch((err) => {
        console.error('Error deleting course:', err);
      });
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

  const uniqueSubjects = [...new Set(courses.map(c => c.subject))].sort();

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
                onClick={() => dispatch(fetchCourses())}
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
                              {course.enrolled_count}
                            </span>
                          </td>
                          <td>${course.price.toFixed(2)}</td>
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

      {/* Modals - Add/Edit (same as before) */}
      {/* ... modal JSX ... */}
    </div>
  );
};

export default AdminCourses;
```

## Key Changes for Each Component

### AdminPayments.jsx
1. Replace: `fetch('/admin/payments/data')` → `dispatch(fetchPayments(range))`
2. Replace: `fetch('/admin/payments/:id/status', ...)` → `dispatch(updatePaymentStatus({...}))`
3. Select: `const { payments, paymentStats, loading, error } = useSelector(state => state.admin)`
4. Show alerts for error/success from Redux state

### AdminRequests.jsx
1. Replace: `fetch('/admin/requests/data')` → `dispatch(fetchRequests())`
2. Replace: `fetch('/admin/requests/:id', ...)` → `dispatch(updateRequest({...}))`
3. Replace: `fetch('/admin/requests/:id', { method: 'DELETE' })` → `dispatch(deleteRequest(id))`
4. Select: `const { requests, loading, error } = useSelector(state => state.admin)`
5. Use success/error alerts from Redux

### AdminContent.jsx
1. Replace: `fetch('/admin/content/data')` → `dispatch(fetchContent())`
2. Replace: `fetch('/admin/content', ...)` → `dispatch(addContent(...))`
3. Replace: `fetch('/admin/content/:id', ...)` → `dispatch(updateContent({...}))`
4. Replace: `fetch('/admin/content/:id', { method: 'DELETE' })` → `dispatch(deleteContent(id))`
5. Select: `const { content, loading, error } = useSelector(state => state.admin)`

### AdminSidebar.jsx
1. Add logout handler
2. Import `adminLogout` thunk
3. Create logout click handler
4. Dispatch `adminLogout()` on logout link

```javascript
const handleLogout = () => {
  dispatch(adminLogout())
    .unwrap()
    .then(() => {
      navigate('/admin/login');
    })
    .catch(err => console.error('Logout error:', err));
};

// In link
<a 
  className="nav-link text-danger" 
  href="#" 
  onClick={(e) => {
    e.preventDefault();
    handleLogout();
  }}
>
  <i className="fas fa-sign-out-alt me-2"></i>Logout
</a>
```

## Template Checklist

When updating each component, follow this checklist:

- [ ] Import `useDispatch`, `useSelector`
- [ ] Import required Redux thunks
- [ ] Get `dispatch` and select state
- [ ] Add `useEffect` to fetch data on mount
- [ ] Add auto-refresh interval (15 seconds)
- [ ] Add error alert `useEffect`
- [ ] Add success alert `useEffect`
- [ ] Replace all `fetch()` calls with `dispatch(thunk())`
- [ ] Add `.unwrap().then().catch()` for async operations
- [ ] Show loading state while fetching
- [ ] Show error messages from Redux state
- [ ] Show success messages from Redux state
- [ ] Disable buttons during loading
- [ ] Close modals on success
- [ ] Clear forms on success
- [ ] Add alerts for all operations

## Running Locally

After updating components:

1. Start the client:
```bash
cd client
npm start
```

2. In another terminal, start the backend:
```bash
cd ..
npm start  # or nodemon server.js
```

3. Open http://localhost:3000/admin/login

4. Open Redux DevTools to see state updates

## Testing Checklist

For each updated component:

- [ ] Test login
- [ ] Test fetch (check Redux DevTools)
- [ ] Test add (verify Redux state + DB)
- [ ] Test update (verify Redux state + DB)
- [ ] Test delete (verify Redux state + DB)
- [ ] Test error handling (wrong credentials, server down)
- [ ] Test auto-refresh (15 second intervals)
- [ ] Test success messages
- [ ] Test error messages
- [ ] Test loading states
- [ ] Test offline mode (no response)

## Redux DevTools Inspection

In Redux DevTools, you should see:

1. `adminLogin/pending` → `adminLogin/fulfilled` (with admin data)
2. `fetchUsers/pending` → `fetchUsers/fulfilled` (with users array)
3. `addUser/pending` → `addUser/fulfilled` (with new user)
4. `updateUser/pending` → `updateUser/fulfilled` (with updated user)
5. `deleteUser/pending` → `deleteUser/fulfilled` (with deleted user ID)

Each action should update the corresponding state slice.
