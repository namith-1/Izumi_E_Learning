import React, { useEffect, useState } from 'react';
import { checkInstructorAuth } from '../../services/instructorAuthApi';
import InstructorNavbar from '../../components/instructor/InstructorNavbar';

const InstructorProfile = () => {
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await checkInstructorAuth();
        setInstructor(data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!instructor) return <div>No instructor data found.</div>;

  return (
    <>
      <InstructorNavbar />
      <div className="container mt-5">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Instructor Personal Details</h3>
          </div>
          <div className="card-body">
            <p><strong>Name:</strong> {instructor.name || instructor.username}</p>
            <p><strong>Email:</strong> {instructor.email}</p>
            <p><strong>Contact:</strong> {instructor.contact}</p>
            <p><strong>Address:</strong> {instructor.address}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstructorProfile;
