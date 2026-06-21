# Izumi E-Learning Platform

A comprehensive gamified e-learning platform built with Node.js, Express, and MongoDB.

## Features

- **Student Management**: Registration, login, profile management
- **Instructor Portal**: Course creation and management
- **Course System**: Hierarchical module structure with progress tracking
- **Q&A System**: Questions and answers with voting
- **Magazine System**: Educational content publishing
- **Gamification**: Progress tracking and achievements
- **Admin Panel**: Administrative oversight and management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Izumi_E_Learning
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration:

   ```
   MONGODB_URI=mongodb://localhost:27017/izumi3
   PORT=4000
   SESSION_SECRET=your-secure-session-secret
   NODE_ENV=development
   ```

5. Start MongoDB service on your system

6. (Optional) Seed initial data:
   ```bash
   npm run seed
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The application will be available at `http://localhost:4000`

## Project Structure

```
├── controllers/         # Request handlers
├── models/             # Database models and business logic
├── routes/             # Route definitions
├── views/              # Frontend templates and static files
├── middlewares/        # Authentication and other middleware
├── required/           # Database configuration
├── extras/             # Additional utilities and test files
├── server.js           # Main application file
├── seedData.js         # Database seeding utility
└── package.json        # Project dependencies and scripts
```

## API Endpoints

### Authentication

- `POST /signup` - Student registration
- `POST /login` - Student login
- `GET /load_user_info` - Get current user info

### Courses

- `GET /courses` - List all courses
- `GET /course/:id` - Get course details
- `POST /enroll` - Enroll in a course

### Questions & Answers

- `GET /questions` - List all questions
- `POST /questions/new` - Create new question
- `POST /answers/new` - Submit answer

### Admin

- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - User management

## Development

### Adding New Features

1. Create model in `models/` directory
2. Add controller logic in `controllers/`
3. Define routes in `routes/`
4. Create views in `views/`

### Database Seeding

To populate the database with initial data:

```bash
npm run seed
```

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Input validation and error handling
- Secure session configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
