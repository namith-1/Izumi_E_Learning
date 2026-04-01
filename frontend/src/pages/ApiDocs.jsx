// frontend/src/pages/ApiDocs.jsx
import React from 'react';

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Izumi E-Learning Platform Documentation
          </h1>
          <p className="text-xl text-gray-600">
            Complete API and Frontend Documentation
          </p>
        </div>

        {/* Backend API Section */}
        <div className="bg-white shadow-lg rounded-lg mb-8">
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">🔧 Backend API Documentation</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive API Docs</h3>
              <p className="text-gray-600 mb-4">
                Access the complete Swagger API documentation with interactive testing capabilities.
              </p>
              <a
                href="http://localhost:5000/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📖 Open API Documentation
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🔐 Authentication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• POST /api/auth/register</li>
                  <li>• POST /api/auth/login</li>
                  <li>• POST /api/auth/logout</li>
                  <li>• GET /api/auth/me</li>
                  <li>• PUT /api/auth/profile</li>
                  <li>• GET /api/auth/teachers</li>
                  <li>• Google OAuth integration</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📚 Course Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GET /api/courses</li>
                  <li>• GET /api/courses/analytics</li>
                  <li>• GET /api/courses/:id</li>
                  <li>• POST /api/courses/upload-image</li>
                  <li>• POST /api/courses</li>
                  <li>• PUT /api/courses/:id</li>
                  <li>• POST /api/courses/upload-video</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🎓 Enrollment System</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GET /api/enrollment/my-courses</li>
                  <li>• POST /api/enrollment/enroll</li>
                  <li>• GET /api/enrollment/:courseId</li>
                  <li>• PUT /api/enrollment/:courseId/progress</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">👨‍💼 Admin Panel</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GET /api/admin/enrollments</li>
                  <li>• GET /api/admin/enrollments/student/:email</li>
                  <li>• GET /api/admin/users</li>
                  <li>• PUT /api/admin/users/:role/:id</li>
                  <li>• DELETE /api/admin/users/:role/:id</li>
                  <li>• GET /api/admin/teachers/courses/:email</li>
                  <li>• GET /api/admin/courses</li>
                  <li>• PUT /api/admin/courses/:id</li>
                  <li>• DELETE /api/admin/courses/:id</li>
                  <li>• GET /api/admin/reviewers</li>
                  <li>• POST /api/admin/reviewers</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📊 Analytics</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GET /api/analytics/admin/overview</li>
                  <li>• GET /api/analytics/admin/growth-trends</li>
                  <li>• GET /api/analytics/admin/subject-distribution</li>
                  <li>• GET /api/analytics/admin/top-courses</li>
                  <li>• GET /api/analytics/admin/instructor-leaderboard</li>
                  <li>• GET /api/analytics/courses/enrollment-trends</li>
                  <li>• GET /api/analytics/courses/completion-analysis</li>
                  <li>• GET /api/analytics/courses/rating-analysis</li>
                  <li>• GET /api/analytics/courses/price</li>
                  <li>• GET /api/analytics/instructor/my-stats</li>
                  <li>• GET /api/analytics/instructor/student-analytics</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">💬 Communication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• GET /api/chat/unread-count</li>
                  <li>• GET /api/chat/:courseId/messages</li>
                  <li>• GET /api/chat/:courseId/conversations</li>
                  <li>• Real-time Socket.IO chat</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 col-span-full">
                <h4 className="font-semibold text-gray-800 mb-2">✅ Review System</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Instructor Endpoints:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• POST /api/review/submit/:courseId</li>
                      <li>• GET /api/review/my-status</li>
                      <li>• POST /api/review/instructor-note/:courseId</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Reviewer Endpoints:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• GET /api/review/queue</li>
                      <li>• GET /api/review/history</li>
                      <li>• GET /api/review/stats</li>
                      <li>• GET /api/review/course/:id</li>
                      <li>• POST /api/review/course/:id/approve</li>
                      <li>• POST /api/review/course/:id/reject</li>
                      <li>• POST /api/review/course/:id/request-revision</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed API Endpoints</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Method</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Access</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Authentication */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">🔐 Authentication</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/register</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">User registration</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/login</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">User login with email/password</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-red-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/logout</td>
                      <td className="border border-gray-300 px-4 py-2">Authenticated</td>
                      <td className="border border-gray-300 px-4 py-2">User logout and session destruction</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/me</td>
                      <td className="border border-gray-300 px-4 py-2">Authenticated</td>
                      <td className="border border-gray-300 px-4 py-2">Get current user profile information</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">PUT</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/profile</td>
                      <td className="border border-gray-300 px-4 py-2">Authenticated</td>
                      <td className="border border-gray-300 px-4 py-2">Update user profile information</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/auth/teachers</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">Get list of all teachers</td>
                    </tr>

                    {/* Course Management */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">📚 Course Management</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">Get all published courses with filtering</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/analytics</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Get course analytics for instructors</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Create a new course</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">Get detailed course information</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">PUT</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Update course information</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-red-50">DELETE</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Delete a course</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/upload-video</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Upload course video to Cloudinary</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/courses/upload-image</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Upload course image to Cloudinary</td>
                    </tr>

                    {/* Enrollment */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">🎓 Enrollment System</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/enrollment/enroll</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Enroll in a course</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/enrollment/my-courses</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Get enrolled courses with progress</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">PUT</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/enrollment/progress</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Update course progress</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/enrollment/quiz-score</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Submit quiz score</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/enrollment/analytics</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Get enrollment analytics</td>
                    </tr>

                    {/* Admin */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">👨‍💼 Admin Panel</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/users</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get all users with pagination</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">PUT</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/users/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Update user information</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-red-50">DELETE</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/users/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Delete a user</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/courses</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get all courses for admin review</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">PUT</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/courses/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Update course status/approval</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/reviewers</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Assign reviewer role to user</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/enrollments</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get all enrollments</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/enrollments/student/:email</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get student enrollments by email</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/teachers/courses/:email</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get teacher courses by email</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-red-50">DELETE</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/courses/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Delete a course</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/admin/reviewers</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get all reviewers</td>
                    </tr>

                    {/* Analytics */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">📊 Analytics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/admin/overview</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get system overview statistics</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/admin/growth-trends</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get user/course growth trends</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/admin/subject-distribution</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get course distribution by subject</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/admin/top-courses</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get top performing courses</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/admin/instructor-leaderboard</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Get instructor performance rankings</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/instructor/my-stats</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Get instructor's course statistics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/analytics/instructor/student-analytics</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Get student performance analytics</td>
                    </tr>

                    {/* Chat */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">💬 Communication</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/chat/unread-count</td>
                      <td className="border border-gray-300 px-4 py-2">Authenticated</td>
                      <td className="border border-gray-300 px-4 py-2">Get count of unread messages</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/chat/:courseId/messages</td>
                      <td className="border border-gray-300 px-4 py-2">Authenticated</td>
                      <td className="border border-gray-300 px-4 py-2">Get chat messages for a course</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/chat/:courseId/conversations</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Get all conversations for instructor</td>
                    </tr>

                    {/* Review System */}
                    <tr className="bg-blue-50">
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">✅ Review System</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/submit/:courseId</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Submit course for review</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/my-status</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Get review status of instructor's courses</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/instructor-note/:courseId</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Add note to course under review</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/queue</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Get courses pending review</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/history</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Get review history</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/stats</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Get reviewer statistics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-blue-50">GET</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/course/:id</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Get course details for review</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-green-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/course/:id/approve</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Approve a course</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-red-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/course/:id/reject</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Reject a course</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm bg-yellow-50">POST</td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api/review/course/:id/request-revision</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Request course revision</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

        {/* Frontend Routes Section */}
        <div className="bg-white shadow-lg rounded-lg mb-8">
          <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">🌐 Frontend Routes & Components</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Routes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Route</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Component</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Access Level</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/</td>
                      <td className="border border-gray-300 px-4 py-2">LandingPage</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">Welcome page with platform overview</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/login</td>
                      <td className="border border-gray-300 px-4 py-2">Login</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">User authentication page</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/signup</td>
                      <td className="border border-gray-300 px-4 py-2">Signup</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">User registration page</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/admin-login</td>
                      <td className="border border-gray-300 px-4 py-2">AdminLogin</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">Administrative login page</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/student-dashboard/*</td>
                      <td className="border border-gray-300 px-4 py-2">StudentDashboard</td>
                      <td className="border border-gray-300 px-4 py-2">Student</td>
                      <td className="border border-gray-300 px-4 py-2">Student learning dashboard with enrolled courses</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/instructor-dashboard/*</td>
                      <td className="border border-gray-300 px-4 py-2">InstructorDashboard</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Instructor management dashboard</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/admin-dashboard/*</td>
                      <td className="border border-gray-300 px-4 py-2">AdminDashboard</td>
                      <td className="border border-gray-300 px-4 py-2">Admin</td>
                      <td className="border border-gray-300 px-4 py-2">Administrative control panel</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/reviewer-dashboard/*</td>
                      <td className="border border-gray-300 px-4 py-2">ReviewerDashboard</td>
                      <td className="border border-gray-300 px-4 py-2">Reviewer</td>
                      <td className="border border-gray-300 px-4 py-2">Course review and approval dashboard</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/create-course</td>
                      <td className="border border-gray-300 px-4 py-2">CourseEditor</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Create new course interface</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/courses/edit/:courseId</td>
                      <td className="border border-gray-300 px-4 py-2">CourseEditor</td>
                      <td className="border border-gray-300 px-4 py-2">Teacher</td>
                      <td className="border border-gray-300 px-4 py-2">Edit existing course interface</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">/api-docs</td>
                      <td className="border border-gray-300 px-4 py-2">ApiDocs</td>
                      <td className="border border-gray-300 px-4 py-2">Public</td>
                      <td className="border border-gray-300 px-4 py-2">API and frontend documentation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🔒 ProtectedRoute</h4>
                  <p className="text-sm text-gray-600">
                    Route guard component that checks user authentication and role-based access control.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">💬 CourseChat</h4>
                  <p className="text-sm text-gray-600">
                    Real-time chat component for course discussions using Socket.IO.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">📊 AnalyticsDashboard</h4>
                  <p className="text-sm text-gray-600">
                    Comprehensive analytics components for instructors and administrators.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">📝 QuizBuilder</h4>
                  <p className="text-sm text-gray-600">
                    Interactive quiz creation and editing component for instructors.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🎮 EducationalGames</h4>
                  <p className="text-sm text-gray-600">
                    Gamified learning components to enhance student engagement.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">💳 PaymentModal</h4>
                  <p className="text-sm text-gray-600">
                    Payment processing component for course enrollment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="bg-white shadow-lg rounded-lg mb-8">
          <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">👥 User Roles & Permissions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">🎓 Student</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Browse courses</li>
                  <li>• Enroll in courses</li>
                  <li>• Access learning materials</li>
                  <li>• Take quizzes</li>
                  <li>• Track progress</li>
                  <li>• Participate in discussions</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2">👨‍🏫 Teacher</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create courses</li>
                  <li>• Upload content</li>
                  <li>• Manage students</li>
                  <li>• View analytics</li>
                  <li>• Submit for review</li>
                  <li>• Access instructor dashboard</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-orange-600 mb-2">🔍 Reviewer</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Review course submissions</li>
                  <li>• Approve/reject courses</li>
                  <li>• Request revisions</li>
                  <li>• View review history</li>
                  <li>• Access reviewer dashboard</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">👑 Admin</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• User management</li>
                  <li>• Course oversight</li>
                  <li>• System analytics</li>
                  <li>• Reviewer management</li>
                  <li>• Platform configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">⚙️ Technical Architecture</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Backend Stack</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Node.js + Express.js</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">MongoDB + Mongoose</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Socket.IO for real-time chat</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">JWT + Session authentication</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Cloudinary for media uploads</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Frontend Stack</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">React 18 + Vite</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">React Router for navigation</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Tailwind CSS for styling</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Axios for API calls</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">Socket.IO client for chat</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default ApiDocs;