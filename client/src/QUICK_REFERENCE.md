# Redux Admin Panel - Quick Reference

## Installation (Already Done ✅)

```bash
npm install @reduxjs/toolkit react-redux
```

## File Structure

```
src/
├── redux/
│   ├── store.js                      # Redux store
│   └── slices/
│       ├── authSlice.js              # Auth reducer & thunks
│       └── adminSlice.js             # Admin reducer & thunks
├── services/
│   └── adminApi.js                   # API calls with interceptors
└── pages/admin/
    ├── AdminLogin.jsx ✅ (Connected)
    ├── AdminDashboard.jsx ✅ (Connected)
    ├── AdminUsers.jsx ✅ (Connected)
    ├── AdminCourses.jsx (TODO)
    ├── AdminPayments.jsx (TODO)
    ├── AdminRequests.jsx (TODO)
    └── AdminContent.jsx (TODO)
```

## Auth Thunks

```javascript
// Login
import { adminLogin } from '../../redux/slices/authSlice';
dispatch(adminLogin({ email, password }))

// Logout
import { adminLogout } from '../../redux/slices/authSlice';
dispatch(adminLogout())

// Check session
import { checkAdminAuth } from '../../redux/slices/authSlice';
dispatch(checkAdminAuth())
```

## Auth Selectors

```javascript
const { admin, token, isAuthenticated, loading, error } = useSelector(state => state.auth);
```

## Admin Data Thunks

### Fetch
```javascript
dispatch(fetchDashboardStats())
dispatch(fetchUsers())
dispatch(fetchCourses())
dispatch(fetchPayments(range))
dispatch(fetchRequests())
dispatch(fetchContent())
```

### Create
```javascript
dispatch(addUser(userData))
dispatch(addCourse(courseData))
dispatch(addContent(contentData))
```

### Update
```javascript
dispatch(updateUser({ userId, userData }))
dispatch(updateCourse({ courseId, courseData }))
dispatch(updateRequest({ requestId, status, notes }))
dispatch(updatePaymentStatus({ paymentId, status }))
dispatch(updateContent({ contentId, contentData }))
```

### Delete
```javascript
dispatch(deleteUser({ userId, role }))
dispatch(deleteCourse(courseId))
dispatch(deleteRequest(requestId))
dispatch(deleteContent(contentId))
```

## Admin Selectors

```javascript
const { users, courses, payments, requests, content, loading, error, success, successMessage } 
  = useSelector(state => state.admin);
```

## Common Patterns

### In useEffect - Fetch Data
```javascript
useEffect(() => {
  dispatch(fetchUsers());
  
  // Auto-refresh every 15 seconds
  const interval = setInterval(() => dispatch(fetchUsers()), 15000);
  return () => clearInterval(interval);
}, [dispatch]);
```

### In Form Submit - Add/Update
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  
  dispatch(addUser(formData))
    .unwrap()
    .then(() => {
      // Success - form clears automatically
      setShowModal(false);
    })
    .catch(err => {
      // Error displayed via Redux state
      console.error(err);
    });
};
```

### Show Error Alert
```javascript
useEffect(() => {
  if (error) {
    setTimeout(() => dispatch(clearError()), 5000);
  }
}, [error, dispatch]);

// In JSX
{error && (
  <div className="alert alert-danger">
    {error}
    <button onClick={() => dispatch(clearError())}>×</button>
  </div>
)}
```

### Show Success Alert
```javascript
useEffect(() => {
  if (success) {
    setTimeout(() => dispatch(clearSuccess()), 3000);
  }
}, [success, dispatch]);

// In JSX
{success && (
  <div className="alert alert-success">
    {successMessage}
  </div>
)}
```

### Loading State
```javascript
{loading ? (
  <div className="spinner-border"></div>
) : (
  // Render data
)}

// Or disable button
<button disabled={loading}>
  {loading ? 'Loading...' : 'Save'}
</button>
```

## API Service (`adminApi.js`)

All endpoints have automatic:
- ✅ Token injection
- ✅ Error handling
- ✅ 401 redirect
- ✅ Response parsing

Base URL: `/admin`

**Example:**
```javascript
import * as adminApi from '../../services/adminApi';

// These are already called by Redux thunks
await adminApi.loginAdmin({ email, password })
await adminApi.getUsers()
await adminApi.createUser(userData)
```

## Redux DevTools

View Redux state and actions:
1. Install "Redux DevTools" Chrome extension
2. Open DevTools → Redux tab
3. See all actions and state changes
4. Time-travel debug

## Error Handling

```javascript
// Automatic with Redux
dispatch(someThunk())
  .unwrap()
  .then(() => {
    // Success
  })
  .catch(err => {
    // Error automatically in Redux state
    // Show user feedback from state
  });
```

## Token Management

**Automatic in `adminApi.js`:**
- Injects token in `Authorization: Bearer <token>` header
- Stores token in `localStorage.adminToken`
- Clears token on 401 response
- Redirects to `/admin/login` on 401

## Logout

```javascript
import { adminLogout } from '../../redux/slices/authSlice';

dispatch(adminLogout())
  .unwrap()
  .then(() => navigate('/admin/login'))
```

## Session Check

Called automatically in `App.js` on page load:

```javascript
dispatch(checkAdminAuth())
```

## Protected Route

Used in `App.js`:

```javascript
<Route
  path="/admin/*"
  element={
    <AdminProtectedRoute>
      <AdminPanel />
    </AdminProtectedRoute>
  }
/>
```

## Component Update Checklist

When updating a component to use Redux:

- [ ] Import `useDispatch` and `useSelector`
- [ ] Import required thunks from slice
- [ ] Get `dispatch` with `useDispatch()`
- [ ] Select data with `useSelector()`
- [ ] Add fetch in `useEffect` with `[dispatch]`
- [ ] Add success/error alerts in `useEffect`
- [ ] Replace fetch calls with `dispatch(thunk())`
- [ ] Use `.unwrap()` for error handling
- [ ] Show loading states
- [ ] Clear modals on success

## Common Redux Actions

```javascript
// Error management
dispatch(clearError())

// Success management
dispatch(clearSuccess())

// Filter management
dispatch(setFilter({ section: 'users', filter: {...} }))
dispatch(clearFilters())
```

## State Shape Reference

```javascript
// Full Redux State
{
  auth: {
    admin: { _id, name, email, role },
    token: 'jwt...',
    isAuthenticated: true,
    loading: false,
    error: null,
    lastUpdated: '2024-12-02T...'
  },
  admin: {
    dashboardStats: {...},
    users: [...],
    courses: [...],
    payments: [...],
    requests: [...],
    content: [...],
    loading: false,
    error: null,
    success: false,
    successMessage: '',
    currentFilter: {...}
  }
}
```

## Debugging Tips

### Check State
```javascript
const state = useSelector(state => state); // Full state
console.log(state);
```

### Check Token
```javascript
console.log(localStorage.getItem('adminToken'));
```

### Test API Directly
```javascript
import * as adminApi from '../../services/adminApi';

adminApi.getUsers()
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

### Redux DevTools Time Travel
1. Open Redux tab in DevTools
2. Click any action
3. See state at that point
4. Click "Jump" to go back/forward

## Notes

- All async operations use Redux Toolkit's `createAsyncThunk`
- All API calls go through `adminApi.js` interceptors
- All errors/success automatically go to Redux state
- No manual error handling needed in components
- Components just read from Redux state
- Auto-refresh happens every 15 seconds for list views
