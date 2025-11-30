import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Search } from 'lucide-react';
import { fetchAllCourses, fetchAllTeachers } from '../../store';

const CourseSearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize navigate
  
  // Get data from Redux store
  const { list: allCourses, loading: coursesLoading } = useSelector(state => state.courses); 
  const { entities: teacherEntities, loading: teachersLoading } = useSelector(state => state.teachers); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // 1. Fetch data when component mounts
  useEffect(() => {
    // Fetch courses AND teachers
    dispatch(fetchAllCourses());
    dispatch(fetchAllTeachers());
  }, [dispatch]);

  const loading = coursesLoading || teachersLoading;

  // Handler for viewing the course
  const handleViewCourse = (courseId) => {
    // Navigate directly to the viewer page. The viewer component handles fetching details and enrollment status.
    navigate(`/student-dashboard/courses/${courseId}`);
  };


  // 2. Memoized function to enrich courses with instructor name
  const enrichedCourses = useMemo(() => {
    return allCourses.map(course => {
      const instructor = teacherEntities[course.teacherId]; 
      return {
        ...course,
        instructorName: instructor ? instructor.name : 'Unknown Instructor'
      };
    });
  }, [allCourses, teacherEntities]);

  // 3. Client-side filtering logic
  const filteredCourses = enrichedCourses.filter(course => {
    const term = searchTerm.toLowerCase();

    const instructorName = course.instructorName || 'Unknown Instructor';

    const matchesSearch = (course.title || '').toLowerCase().includes(term) ||
                          (course.description || '').toLowerCase().includes(term) ||
                          (course.subject || '').toLowerCase().includes(term) ||
                          instructorName.toLowerCase().includes(term); 
    
    const matchesSubject = subjectFilter === '' || (course.subject && course.subject.toLowerCase() === subjectFilter.toLowerCase());
    
    return matchesSearch && matchesSubject;
  });

  // Extract unique subjects for the filter dropdown
  const uniqueSubjects = useMemo(() => {
    return [...new Set(enrichedCourses.map(course => course.subject).filter(s => s))];
  }, [enrichedCourses]);

  return (
    <>
      <div className="dashboard-intro">
        <h1>Course Catalog</h1>
        <p className="text-gray-600">Find your next learning path.</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="course-search-controls">
        <div className="search-input-group">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, description, instructor, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{
                backgroundColor: 'white',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                boxSizing: 'border-box',
                fontSize: '1rem'
            }}
          />
        </div>
        
        <select 
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Subjects</option>
          {uniqueSubjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>
      
      {/* Course Listing */}
      <section className="course-section">
        {loading ? (
          <div className="loading-state">Loading courses and instructors...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="course-grid student-course-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card"> 
                <div className="course-card-header">
                  <span className="badge-subject">{course.subject}</span>
                  <span className="badge-rating">★ {course.rating || 0}</span>
                </div>
                <p className="course-instructor">By: {course.instructorName}</p>
                <h3>{course.title}</h3>
                <p className="course-desc">
                  {course.description 
                    ? course.description.substring(0, 80) + '...' 
                    : 'No description provided.'}
                </p>
                <div className="course-card-footer">
                  <button 
                    className="btn-browse"
                    onClick={() => handleViewCourse(course._id)} // Navigate to view course
                  >
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses match your search criteria.</p>
          </div>
        )}
      </section>
    </>
  );
};

export default CourseSearch;