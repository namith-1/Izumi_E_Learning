import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './store'; 
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const dispatch = useDispatch();

  // On App load, check if the user has an active session cookie
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}

export default App;