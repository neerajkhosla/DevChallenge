# ReCustom User Metrics

A full-stack web application for managing user metrics and activities.

## Backend

### Tech Stack

- **Node.js** with **Express.js** - Web server framework
- **TypeScript** - Programming language
- **PostgreSQL** - Database
- **Swagger** - API documentation
- **PDFKit** - PDF generation
- **bcrypt** - Password hashing
- **UUID** - Unique identifier generation
- **CORS** - Cross-origin resource sharing

### Database Schema

The application uses PostgreSQL with the following tables:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- User Activity table
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details TEXT
);

-- User Activity Summary table
CREATE TABLE user_activity_summary (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_count INTEGER DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_activity_summary_unique UNIQUE (user_id, activity_type)
);

-- Indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_summary_user_id ON user_activity_summary(user_id);
```

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file in the backend directory with the following variables:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=usermetrics
```

3. Initialize the database:
```bash
npm run seed
```

4. Start the development server:
```bash
npm run dev
```

The backend server will start on http://localhost:3001. API documentation is available at http://localhost:3001/api-docs.

## Frontend

### Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Programming language
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentication
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Recharts** - Charts and graphs
- **Radix UI** - UI components

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create a `.env.local` file in the frontend directory with:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will be available at http://localhost:3000.

### Default Login Credentials

```
Email: admin@example.com
Password: Test@123
```

## Features

- User authentication and authorization
- Role-based access control (Admin/User)
- User management (CRUD operations)
- Activity tracking and logging
- PDF report generation
- Interactive dashboard with charts
- Responsive design

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:userId/activity` - Get user activity
- `POST /api/users/:userId/activity/log` - Log user activity
- `GET /api/users/:userId/activity-pdf` - Download activity report 