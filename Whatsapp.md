# Hadoota Masreya CRM & Management System

Internal CRM system for managing restaurant operations, employees, reservations, and customers.

## Features

### Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (super_admin, branch_manager, shift_supervisor, etc.)
- HTTP-only cookies for security

### Employee Management
- Create, update, and delete employees
- Assign roles and permissions
- Branch assignments
- PIN codes for quick station access

### Table Management
- Create and manage tables per section
- Define table capacities (min/max seats)
- Activate/deactivate tables
- Floor plan positioning

### Reservation Management
- View all reservations
- Filter by date, branch, section
- Real-time availability checking
- Automatic table assignment
- Status updates (pending, confirmed, seated, completed, cancelled)

### Customer Management
- View customer profiles
- Track visit history and spending
- VIP and preference management
- Dietary restrictions tracking

### Availability System
- Check table availability in real-time
- Prevent double-bookings
- Match party size to appropriate tables
- Time-slot conflict detection

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: JWT + bcrypt

## Setup

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Configure environment variables:
```bash
# .env file is already set up with database credentials
```

3. Start development server:
```bash
npm run dev
```

The CRM API will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users/Employees
- `GET /api/users` - Get all users (admin only)
- `GET /api/branches/:branchId/users` - Get users by branch
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (super admin only)

### Tables
- `GET /api/sections/:sectionId/tables` - Get tables by section
- `POST /api/tables` - Create table
- `PATCH /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table
- `POST /api/tables/check-availability` - Check table availability

### Reservations
- `GET /api/reservations` - Get all reservations
- `GET /api/reservations/date/:date` - Get reservations by date
- `GET /api/branches/:branchId/reservations` - Get reservations by branch
- `PATCH /api/reservations/:id` - Update reservation

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `PATCH /api/customers/:id` - Update customer

## User Roles

- **super_admin**: Full system access
- **branch_manager**: Manage specific branch operations
- **shift_supervisor**: Supervise shift operations
- **cashier**: Handle payments and orders
- **kitchen_staff**: Kitchen operations
- **bar_staff**: Bar operations
- **shisha_staff**: Shisha service
- **cafe_staff**: Cafe operations
- **waiter**: Table service

## Database Schema

Shares the same PostgreSQL database with the main customer-facing website. Tables are prefixed with the `Hadoota_Masreya_Manager` schema.

Key tables:
- `users` - Employee/staff accounts
- `tables` - Physical restaurant tables
- `reservations` - Customer reservations
- `customers` - Customer profiles
- `branches` - Restaurant locations
- `sections` - Areas within branches
