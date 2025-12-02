import React, { useEffect, useState } from 'react';
import { getInstructorCoursesStats, getCourseStatsOverTime } from '../../services/instructorCourseApi';
import InstructorNavbar from '../../components/instructor/InstructorNavbar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const InstructorStudentInfo = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getInstructorCoursesStats();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourse(data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;

    const fetchStats = async () => {
      try {
        const data = await getCourseStatsOverTime(selectedCourse);
        
        const labels = data.map(d => d._id);
        const counts = data.map(d => d.enrollments);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Enrollments Over Time',
              data: counts,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching course stats:', error);
      }
    };

    fetchStats();
  }, [selectedCourse]);

  return (
    <>
      <InstructorNavbar />
      <div className="container mt-4">
        <h2>Student Enrollment Analytics</h2>
        
        <div className="mb-3">
          <label className="form-label">Select Course</label>
          <select 
            className="form-select" 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        {chartData && (
          <div style={{ height: '400px' }}>
            <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
          </div>
        )}
      </div>
    </>
  );
};

export default InstructorStudentInfo;
