import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import { checkAdminAuth } from './redux/slices/authSlice';
import { checkStudentAuth } from './redux/slices/studentAuthSlice';
import { checkInstructorAuth } from './redux/slices/instructorAuthSlice';
import './App.css';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InstructorLogin from './pages/instructor/InstructorLogin';
import InstructorSignup from './pages/instructor/InstructorSignup';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorProfile from './pages/instructor/InstructorProfile';
import InstructorStats from './pages/instructor/InstructorStats';
import InstructorStudentInfo from './pages/instructor/InstructorStudentInfo';
import InstructorContactAdmin from './pages/instructor/InstructorContactAdmin';
import InstructorCourseEdit from './pages/instructor/InstructorCourseEdit';
import CourseDetail from './pages/CourseDetail';
import AdminPanel from './pages/admin';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminSignup from './pages/admin/AdminSignup';
import {
  StudentDashboard,
  MyQuestions,
  QuestionsList,
  QuestionDetail,
  StudentLogin,
  StudentSignup,
  UpdateProfile,
  MyPurchases,
  StudentHome,
  StudentCourseList,
  StudentCourseView,
  DeleteAccount,
  RestoreAccount,
  Gamification,
  Magazines
} from './pages/student';
import PrivateRoute from './components/PrivateRoute';
import StudentNavbar from './components/StudentNavbar';

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// Student Protected Route Component
const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.studentAuth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      // Try to restore session
      // dispatch(checkStudentAuth()); 
      // Note: checkStudentAuth needs to be imported if we use it here, 
      // but usually AppContent handles initial auth check.
      // For now, we rely on the state.
    }
  }, [isAuthenticated, dispatch]);

  if (loading) return <div>Loading...</div>;
  
  // If not authenticated, redirect to student login
  return isAuthenticated ? (
    <>
      <StudentNavbar />
      <div className="student-content-container">
        {children}
      </div>
    </>
  ) : <Navigate to="/student/login" replace />;
};

// Instructor Protected Route Component
const InstructorProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.instructorAuth);
  
  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/instructor/login" replace />;
};

// Main App component wrapped in Redux Provider
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { isAuthenticated: adminAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check auth only once on app load
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // Silently fail if not authenticated
      }

      // Verify admin session if admin data exists in localStorage
      if (localStorage.getItem('admin')) {
        console.log('[App] Found admin in localStorage, verifying session...');
        dispatch(checkAdminAuth());
      }

      // Check student session
      dispatch(checkStudentAuth());
      dispatch(checkInstructorAuth());
      
      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        
        {/* Student Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/signup" element={<StudentSignup />} />
        <Route path="/student/dashboard" element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <StudentProtectedRoute>
            <UpdateProfile />
          </StudentProtectedRoute>
        } />
        <Route path="/student/purchases" element={
          <StudentProtectedRoute>
            <MyPurchases />
          </StudentProtectedRoute>
        } />
        <Route path="/student/questions" element={
          <StudentProtectedRoute>
            <QuestionsList />
          </StudentProtectedRoute>
        } />
        <Route path="/student/questions/my" element={
          <StudentProtectedRoute>
            <MyQuestions />
          </StudentProtectedRoute>
        } />
        <Route path="/student/questions/:id" element={
          <StudentProtectedRoute>
            <QuestionDetail />
          </StudentProtectedRoute>
        } />
        <Route path="/student/dashboard" element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        } />
        <Route path="/student/courses" element={
          <StudentProtectedRoute>
            <StudentCourseList />
          </StudentProtectedRoute>
        } />
        <Route path="/student/gamification" element={
          <StudentProtectedRoute>
            <Gamification />
          </StudentProtectedRoute>
        } />
        <Route path="/student/magazines" element={
          <StudentProtectedRoute>
            <Magazines />
          </StudentProtectedRoute>
        } />
        <Route path="/student/delete-account" element={
          <StudentProtectedRoute>
            <DeleteAccount />
          </StudentProtectedRoute>
        } />
        <Route path="/student/restore-account" element={
          <RestoreAccount />
        } />

        <Route 
          path="/admin/login" 
          element={<AdminLoginPage />}
        />
        <Route path="/admin/signup" element={<AdminSignup />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user} requiredRole="student">
              <Dashboard user={user} setUser={setUser} />
            </PrivateRoute>
          }
        />
        
        <Route path="/instructor/login" element={<InstructorLogin />} />
        <Route path="/instructor/signup" element={<InstructorSignup />} />
        <Route path="/instructor/dashboard" element={
          <InstructorProtectedRoute>
            <InstructorDashboard />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/profile" element={
          <InstructorProtectedRoute>
            <InstructorProfile />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/stats" element={
          <InstructorProtectedRoute>
            <InstructorStats />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/student-info" element={
          <InstructorProtectedRoute>
            <InstructorStudentInfo />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/contact" element={
          <InstructorProtectedRoute>
            <InstructorContactAdmin />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/create-course" element={
          <InstructorProtectedRoute>
            <InstructorCourseEdit />
          </InstructorProtectedRoute>
        } />
        <Route path="/instructor/course/:courseId/edit" element={
          <InstructorProtectedRoute>
            <InstructorCourseEdit />
          </InstructorProtectedRoute>
        } />
        
        <Route
          path="/course/:courseId/learn"
          element={
            <StudentProtectedRoute>
              <StudentCourseView />
            </StudentProtectedRoute>
          }
        />
        
        <Route
          path="/course/:courseId"
          element={
            <CourseDetail user={user} />
          }
        />
        
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminPanel user={user} setUser={setUser} />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;