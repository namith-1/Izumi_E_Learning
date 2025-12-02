import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchInstructorCourses } from '../../redux/slices/instructorCourseSlice';
import InstructorNavbar from '../../components/instructor/InstructorNavbar';
import { checkInstructorAuth } from '../../services/instructorAuthApi';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const { courses, loading, error, successMessage } = useSelector((state) => state.instructorCourse);

  useEffect(() => {
    // Proactively verify auth; helps show actionable error if not logged in
    (async () => {
      try {
        await checkInstructorAuth();
      } catch (e) {
        console.warn('Instructor auth not verified:', e?.response?.data || e.message);
      }
      dispatch(fetchInstructorCourses());
    })();
  }, [dispatch]);

  return (
    <>
      <InstructorNavbar />
      <div className="container mt-4">
        <h2>Instructor Dashboard</h2>
        {loading && <div className="alert alert-info">Loading...</div>}
        {error && (
          <div className="alert alert-danger">
            {error}
            {String(error).toLowerCase().includes('unauthorized') && (
              <div className="mt-2">
                You may need to log in as an instructor.
                <Link to="/instructor/login" className="ms-2">Go to Login</Link>
              </div>
            )}
          </div>
        )}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>My Courses</h4>
          <Link to="/instructor/create-course" className="btn btn-success">
            Create New Course
          </Link>
        </div>

        <div className="row">
          {courses.length === 0 && !loading ? (
            <div className="col-12">
              <p>No courses found. Create one to get started!</p>
            </div>
          ) : (
            courses.map((course) => (
              <div className="col-md-4 mb-4" key={course._id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{course.title}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">{course.subject}</h6>
                    <p className="card-text">
                      {course.tagline || 'No tagline provided.'}
                    </p>
                    <Link to={`/instructor/course/${course._id}/edit`} className="btn btn-primary btn-sm">Edit Course</Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
};

export default InstructorDashboard;
