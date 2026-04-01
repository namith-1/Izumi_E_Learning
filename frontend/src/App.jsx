import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './store'; // Action to check session on load
import AppRoutes from './routes/AppRoutes';       // The routes we just extracted

function App() {
  const dispatch = useDispatch();

  // On App load, check if the user has an active session cookie
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;