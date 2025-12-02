import React, { useEffect, useState } from 'react';
import { getCoursesWithStats } from '../../services/instructorCourseApi';
import InstructorNavbar from '../../components/instructor/InstructorNavbar';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InstructorStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCoursesWithStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;

  // Prepare data for chart
  const chartData = {
    labels: stats.map(s => s.title),
    datasets: [
      {
        label: 'Enrolled Students',
        data: stats.map(s => s.enrolled_count || 0),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <>
      <InstructorNavbar />
      <div className="container mt-4">
        <h2>Course Statistics</h2>
        <div style={{ height: '400px' }}>
          <Bar options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
        </div>
        <div className="mt-4">
            <h4>Details</h4>
            <table className="table">
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Enrolled</th>
                        <th>Rating</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map(s => (
                        <tr key={s._id}>
                            <td>{s.title}</td>
                            <td>{s.enrolled_count || 0}</td>
                            <td>{s.avg_rating || 'N/A'}</td>
                            <td>{s.price || 'Free'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </>
  );
};

export default InstructorStats;
