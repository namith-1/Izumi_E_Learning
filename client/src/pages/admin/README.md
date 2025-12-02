# Admin Panel React Components

This directory contains all React JSX components for the admin panel, converted from the original EJS templates.

## Folder Structure

```
client/src/
├── pages/admin/
│   ├── index.jsx                 # Main admin router
│   ├── AdminLogin.jsx            # Admin login page
│   ├── AdminLogin.css
│   ├── AdminDashboard.jsx        # Dashboard with stats
│   ├── AdminDashboard.css
│   ├── AdminUsers.jsx            # User management
│   ├── AdminUsers.css
│   ├── AdminCourses.jsx          # Course management
│   ├── AdminCourses.css
│   ├── AdminPayments.jsx         # Payment management
│   ├── AdminPayments.css
│   ├── AdminRequests.jsx         # Request management
│   ├── AdminRequests.css
│   ├── AdminContent.jsx          # Content management
│   └── AdminContent.css
│
└── components/admin/
    ├── AdminSidebar.jsx          # Sidebar navigation
    └── AdminSidebar.css
```

## Components Overview

### AdminLogin (`AdminLogin.jsx`)
- Admin authentication page
- Email and password input fields
- Error handling and loading states
- Stores auth token in localStorage

### AdminDashboard (`AdminDashboard.jsx`)
- Overview dashboard with key statistics
- Total students, instructors, courses, and enrollments
- Quick action buttons for common tasks
- Auto-refreshes stats every 15 seconds

### AdminUsers (`AdminUsers.jsx`)
- User management interface
- CRUD operations for students and instructors
- Search and filter functionality (by name, email, role)
- Modal forms for adding/editing users
- Delete user functionality with confirmation

### AdminCourses (`AdminCourses.jsx`)
- Course management system
- Search courses by title or subject
- Filter by instructor and subject
- Add/edit/delete courses
- Display enrolled student count and pricing

### AdminPayments (`AdminPayments.jsx`)
- Payment and revenue tracking
- Statistics cards (total revenue, monthly revenue, pending, average)
- Top courses by revenue display
- Search and filter payments by user, course, status, and date
- Quick approve/reject buttons for pending payments

### AdminRequests (`AdminRequests.jsx`)
- Support request management
- View detailed request information in modal
- Priority badges (high, medium, low) with animations
- Status management (pending, approved, rejected)
- Search and multi-filter functionality
- Quick action buttons for approval/rejection

### AdminContent (`AdminContent.jsx`)
- Content module management
- Link content to specific courses
- CRUD operations for course materials
- Search and filter by course
- URL support for external resources

### AdminSidebar (`components/admin/AdminSidebar.jsx`)
- Navigation sidebar for all admin pages
- Active route highlighting
- Logout functionality
- Responsive design

## Integration with App.js

Add the following route to your main `App.js`:

```jsx
import AdminPanel from './pages/admin';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}
```

## Dependencies

Make sure these npm packages are installed:
```bash
npm install react react-router-dom bootstrap
```

## Features

✅ **Authentication** - Login system with token management
✅ **Dashboard** - Real-time statistics and quick actions
✅ **User Management** - Create, read, update, delete users
✅ **Course Management** - Manage courses and instructors
✅ **Payment Tracking** - Monitor revenue and payment status
✅ **Request Management** - Handle support/admin requests
✅ **Content Management** - Manage course materials
✅ **Responsive Design** - Works on desktop and tablet
✅ **Auto-Refresh** - Data updates every 15 seconds
✅ **Search & Filter** - Advanced filtering on all pages

## API Endpoints Used

### Authentication
- `POST /admin/login` - Admin login
- `GET /admin/logout` - Admin logout

### Dashboard
- `GET /admin/dashboard/stats` - Get dashboard statistics

### Users
- `GET /admin/users/data` - Get all users
- `POST /admin/users` - Add new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Courses
- `GET /admin/courses/data` - Get all courses
- `GET /admin/courses/list` - Get courses list
- `GET /admin/instructors` - Get instructors
- `POST /admin/courses` - Add course
- `PUT /admin/courses/:id` - Update course
- `DELETE /admin/courses/:id` - Delete course

### Payments
- `GET /admin/payments/data` - Get payment data
- `GET /admin/payments/:id` - Get payment details
- `PUT /admin/payments/:id/status` - Update payment status

### Requests
- `GET /admin/requests/data` - Get all requests
- `PUT /admin/requests/:id` - Update request
- `DELETE /admin/requests/:id` - Delete request

### Content
- `GET /admin/content/data` - Get all content
- `POST /admin/content` - Add content
- `PUT /admin/content/:id` - Update content
- `DELETE /admin/content/:id` - Delete content

## Styling

All components use Bootstrap 5 classes for consistent styling. Additional custom CSS is provided in corresponding `.css` files:
- Custom sidebar styling
- Modal animations
- Hover effects on tables and buttons
- Status badge colors
- Responsive grid layouts

## Future Enhancements

- Add pagination to tables
- Export data to CSV
- Advanced analytics and charts
- Bulk operations
- Email notifications
- Role-based access control (RBAC)
