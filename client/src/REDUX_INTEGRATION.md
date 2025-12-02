# Admin Panel Redux Integration Guide

## Overview

This guide covers the Redux integration for the admin panel authentication and data management in the Izumi E-Learning Platform.

## Redux Architecture

### Store Structure

```javascript
store
├── auth (Authentication State)
│   ├── admin
│   ├── token
│   ├── isAuthenticated
│   ├── loading
│   └── error
└── admin (Admin Data State)
    ├── dashboardStats
    ├── users
    ├── courses
    ├── payments
    ├── requests
    ├── content
    ├── loading
    └── error
```

## Installation

Redux and Redux Toolkit are already installed via:
```bash
npm install @reduxjs/toolkit react-redux
```

## Directory Structure

```
client/src/
├── redux/
│   ├── store.js                    # Redux store configuration
│   └── slices/
│       ├── authSlice.js            # Admin authentication reducer
│       └── adminSlice.js           # Admin data management reducer
├── services/
│   └── adminApi.js                 # API service with axios
└── pages/admin/
    ├── index.jsx                   # Admin router
    ├── AdminLogin.jsx              # Redux-connected login
    ├── AdminDashboard.jsx          # Redux-connected dashboard
    ├── AdminUsers.jsx              # Redux-connected user management
    └── ...other admin pages
```

## Key Features

### 1. Authentication Slice (`authSlice.js`)

**Async Thunks:**
- `adminLogin` - Handles admin login
- `adminLogout` - Handles admin logout
- `checkAdminAuth` - Verifies admin session

**State:**
```javascript
{
  admin: { _id, name, email, role },
  token: 'jwt_token',
  isAuthenticated: true/false,
  loading: false,
  error: null
}
```

**Usage in Components:**
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../../redux/slices/authSlice';

const { isAuthenticated, loading, error } = useSelector(state => state.auth);
const dispatch = useDispatch();

// Login
dispatch(adminLogin({ email, password }))
  .unwrap()
  .then(() => navigate('/admin/dashboard'))
  .catch(err => setError(err));
```

### 2. Admin Slice (`adminSlice.js`)

**Fetch Thunks:**
- `fetchDashboardStats` - Get dashboard statistics
- `fetchUsers` - Get all users
- `fetchCourses` - Get all courses
- `fetchPayments` - Get payment data
- `fetchRequests` - Get all requests
- `fetchContent` - Get all content

**CRUD Thunks:**
- `addUser`, `updateUser`, `deleteUser`
- `addCourse`, `updateCourse`, `deleteCourse`
- `updatePaymentStatus`
- `updateRequest`, `deleteRequest`
- `addContent`, `updateContent`, `deleteContent`

**State:**
```javascript
{
  dashboardStats: { totalStudents, totalInstructors, ... },
  users: [],
  courses: [],
  payments: [],
  requests: [],
  content: [],
  loading: false,
  error: null,
  success: false,
  successMessage: '',
  currentFilter: {}
}
```

**Usage in Components:**
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, addUser, clearError } from '../../redux/slices/adminSlice';

const { users, loading, error, success } = useSelector(state => state.admin);
const dispatch = useDispatch();

// Fetch users
useEffect(() => {
  dispatch(fetchUsers());
}, [dispatch]);

// Add user
const handleAddUser = (userData) => {
  dispatch(addUser(userData))
    .unwrap()
    .then(() => {
      // Success - component state clears
    })
    .catch(err => console.error(err));
};

// Clear error
dispatch(clearError());
```

### 3. Admin API Service (`adminApi.js`)

All API calls are centralized and include:
- Automatic token injection in headers
- Base URL configuration
- Interceptors for error handling
- Session validation

**Main Endpoints:**

**Authentication:**
- `loginAdmin(credentials)` - POST /admin/login
- `logoutAdmin()` - POST /admin/logout
- `getAdminProfile()` - GET /admin/profile

**Dashboard:**
- `getDashboardStats()` - GET /admin/dashboard/stats

**Users:**
- `getUsers()` - GET /admin/users/data
- `createUser(userData)` - POST /admin/users
- `updateUser(userId, userData)` - PUT /admin/users/:id
- `deleteUser(userId, role)` - DELETE /admin/users/:id

**Courses:**
- `getCourses()` - GET /admin/courses/data
- `getInstructors()` - GET /admin/instructors
- `createCourse(courseData)` - POST /admin/courses
- `updateCourse(courseId, courseData)` - PUT /admin/courses/:id
- `deleteCourse(courseId)` - DELETE /admin/courses/:id

**Payments:**
- `getPayments(range)` - GET /admin/payments/data
- `updatePaymentStatus(paymentId, status)` - PUT /admin/payments/:id/status

**Requests:**
- `getRequests()` - GET /admin/requests/data
- `updateRequest(requestId, data)` - PUT /admin/requests/:id
- `deleteRequest(requestId)` - DELETE /admin/requests/:id

**Content:**
- `getContent()` - GET /admin/content/data
- `createContent(contentData)` - POST /admin/content
- `updateContent(contentId, contentData)` - PUT /admin/content/:id
- `deleteContent(contentId)` - DELETE /admin/content/:id

### 4. App.js Integration

The main App component now:
- Wraps all routes with Redux Provider
- Initializes admin auth check on mount
- Provides AdminProtectedRoute for admin pages
- Handles both user and admin authentication states

```javascript
<Provider store={store}>
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Protected admin routes */}
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <AdminPanel />
          </AdminProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
</Provider>
```

## Component Integration Examples

### AdminLogin Component

Uses Redux for authentication:

```javascript
const AdminLogin = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(adminLogin({ email, password }))
      .unwrap()
      .then(() => navigate('/admin/dashboard'))
      .catch(err => setError(err));
  };
};
```

### AdminUsers Component

Fetches and manages users with Redux:

```javascript
const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error, success } = useSelector(state => state.admin);

  useEffect(() => {
    dispatch(fetchUsers());
    const interval = setInterval(() => dispatch(fetchUsers()), 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleAddUser = (userData) => {
    dispatch(addUser(userData))
      .unwrap()
      .catch(err => console.error(err));
  };
};
```

## Token Management

### Auto-Injection

The `adminApi.js` automatically injects the JWT token in request headers:

```javascript
// Token is automatically added to Authorization header
const token = localStorage.getItem('adminToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Session Validation

If a 401 response is received, the token is automatically cleared:

```javascript
if (error.response?.status === 401) {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
  window.location.href = '/admin/login';
}
```

## Error Handling

All components have built-in error handling:

```javascript
// In components
useEffect(() => {
  if (error) {
    // Show error message
    setTimeout(() => dispatch(clearError()), 5000);
  }
}, [error, dispatch]);

// In form submissions
dispatch(someAction())
  .unwrap()
  .then(() => {
    // Success handling
  })
  .catch(err => {
    // Error is automatically set in Redux state
    console.error(err);
  });
```

## Success Notifications

After successful operations:

```javascript
// Redux state contains success flag and message
{ 
  success: true,
  successMessage: 'User added successfully'
}

// Clear success notification after timeout
useEffect(() => {
  if (success) {
    setTimeout(() => dispatch(clearSuccess()), 3000);
  }
}, [success, dispatch]);
```

## Auto-Refresh

Most admin pages auto-refresh data every 15 seconds:

```javascript
useEffect(() => {
  dispatch(fetchSomeData());
  
  const interval = setInterval(() => {
    dispatch(fetchSomeData());
  }, 15000);
  
  return () => clearInterval(interval);
}, [dispatch]);
```

## Security Features

1. **JWT Token Storage** - Token stored in localStorage with key `adminToken`
2. **Token Auto-Injection** - Token automatically added to all API requests
3. **Session Validation** - Invalid tokens trigger automatic redirect to login
4. **Request Interceptors** - Centralized error and response handling
5. **Protected Routes** - AdminProtectedRoute component validates authentication

## Debugging

Enable Redux DevTools in Chrome/Firefox for debugging:
- Install Redux DevTools browser extension
- Redux Toolkit automatically enables DevTools in development

## Best Practices

1. **Always use `useDispatch` and `useSelector` hooks** - Never access store directly
2. **Handle async operations with `.unwrap()`** - Properly catch and handle errors
3. **Clear errors after display** - Use `clearError()` to manage error state
4. **Use success notifications** - Provide user feedback for operations
5. **Auto-refresh data periodically** - Keep data fresh without manual refresh
6. **Validate on the backend** - Don't rely only on frontend validation
7. **Use loading states** - Disable buttons during async operations

## Troubleshooting

### Token not being sent
- Check localStorage has `adminToken` key
- Verify `adminApi.js` interceptors are configured
- Check network tab in DevTools for Authorization header

### 401 errors
- Token may be expired
- User session may have ended on backend
- Check backend authentication middleware

### State not updating
- Verify async thunk is dispatched correctly
- Check reducer handles the action type
- Use Redux DevTools to inspect actions

### API endpoints not found
- Verify backend server is running on correct port
- Check proxy setting in `package.json` (should be `http://localhost:4000`)
- Verify API routes match backend endpoints
