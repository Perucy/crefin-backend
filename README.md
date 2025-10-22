# 🚀 Crefin Backend API

> **Status:** 🚧 Currently in active development

A comprehensive financial management API for freelancers and independent contractors. Track income, expenses, financial goals, and get AI-powered insights to optimize your freelance business.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Crefin is a modern financial management platform designed specifically for freelancers, contractors, and gig workers. It helps track income, manage expenses, set financial goals, and provides AI-powered insights to maximize earnings and minimize tax liabilities.

### Key Highlights

- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 💰 **Income Tracking** - Log and analyze freelance earnings
- 💳 **Expense Management** - Track deductible business expenses
- 🎯 **Goal Setting** - Set and track financial goals with progress monitoring
- 📊 **Dashboard Analytics** - Real-time financial overview and insights
- 🤖 **AI Auditor** - Coming soon: AI-powered rate optimization
- 💸 **Payment System** - Coming soon: Integrated payment processing
- 📄 **Invoice Generation** - Coming soon: Professional invoice creation

---

## ✨ Features

### ✅ Implemented Features

#### 🔐 Authentication & User Management
- User registration with email verification
- Secure login with JWT tokens
- Refresh token rotation
- Password reset via email
- Email verification
- User profile management
- Session management

#### 💰 Income Tracking
- Log income from freelance projects
- Track hourly rates and hours worked
- Categorize by skill and client
- Monthly income summaries
- Income history with filtering
- Voice-to-text income logging support

#### 💳 Expense Management
- Log business expenses
- Mark expenses as tax-deductible
- Categorize expenses
- Receipt URL storage
- Monthly expense summaries
- Deductible expense calculations

#### 🎯 Financial Goals
- Create custom financial goals
- Track progress with percentage completion
- Multiple goal categories (travel, real estate, education, etc.)
- Add funds to goals
- Deadline tracking with days remaining
- Update and delete goals

#### 📊 Dashboard
- Real-time financial balance
- Total income and expenses overview
- Available balance after goals allocation
- This month vs last month comparison
- Top earning skills
- Top expense categories
- Recent activity tracking
- Total transaction count

### 🚧 In Development

- 🤖 AI Rate Auditor - Analyze and optimize your rates
- 💸 Payment Integration - Stripe, PayPal, Venmo webhooks
- 📊 Market Rates - Compare your rates to market averages
- 👥 Client Management - Track client information and history
- 📄 Invoice Generation - Create and send professional invoices
- 🧾 Tax Calculator - Quarterly tax estimates
- 📈 Advanced Analytics - Detailed financial reports
- 🔔 Notifications - Email and push notifications
- 💎 Premium Features - Subscription management

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **Cache:** Redis
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Email:** Nodemailer
- **Logging:** Winston

### DevOps & Tools
- **Version Control:** Git
- **Package Manager:** npm
- **Environment:** dotenv
- **Security:** Helmet, CORS, bcrypt
- **Rate Limiting:** express-rate-limit

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis installed and running (optional, for caching)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/crefin-backend.git
   cd crefin-backend
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
```env
   # Server
   NODE_ENV=development
   PORT=3000

   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/crefin

   # JWT Secrets
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

   # Redis (optional)
   REDIS_URL=redis://localhost:6379

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM=noreply@crefin.app

   # Frontend URL
   FRONTEND_URL=http://localhost:3001

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
```

4. **Set up the database**
```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
```

5. **Start the development server**
```bash
   npm run dev
```

   The API will be available at `http://localhost:3000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/verify-email` | Verify email address | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| GET | `/auth/me` | Get current user | Yes |

### User Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| PUT | `/users/profile/picture` | Update profile picture | Yes |

### Income Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/income` | Log new income | Yes |
| GET | `/income` | Get income history | Yes |
| GET | `/income/summary` | Get monthly income summary | Yes |
| DELETE | `/income/:id` | Delete income entry | Yes |

### Expense Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/expenses` | Log new expense | Yes |
| GET | `/expenses` | Get expense history | Yes |
| GET | `/expenses/summary` | Get monthly expense summary | Yes |
| DELETE | `/expenses/:id` | Delete expense entry | Yes |

### Goals Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/goals` | Create new goal | Yes |
| GET | `/goals` | Get all goals | Yes |
| GET | `/goals/:id` | Get goal by ID | Yes |
| PATCH | `/goals/:id` | Update goal | Yes |
| DELETE | `/goals/:id` | Delete goal | Yes |
| POST | `/goals/:id/add-funds` | Add money to goal | Yes |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get complete dashboard summary | Yes |
| GET | `/dashboard/balance` | Get balance overview | Yes |
| GET | `/dashboard/stats` | Get quick statistics | Yes |

---

## 📊 Database Schema

### Core Tables

#### Users
- User authentication and profile information
- Email verification status
- Premium subscription status
- Profile details (name, phone, profession, skills, hourly rate)

#### Income Logs
- Income tracking records
- Project and client information
- Skill categorization
- Hourly rate and hours worked
- Link to payment records

#### Expense Logs
- Business expense records
- Category classification
- Tax deductibility flag
- Receipt storage
- Link to payment records

#### Goals
- Financial goal tracking
- Target and current amounts
- Category and deadline
- Progress calculation

#### Payments
- Payment transaction records
- Sent/received payments
- Escrow support
- External payment integration (Stripe, PayPal, Venmo)

#### Market Rates
- Cached market rate data
- Skill-based rate averages
- Regional pricing information
- Source and confidence metrics

#### Refresh Tokens
- JWT refresh token storage
- Session management

#### Alerts
- AI-generated insights and notifications
- Severity levels
- Dismissal tracking

#### Premium Payments
- Subscription payment history
- Billing period tracking
- Stripe integration

---

## 📁 Project Structure
```
crefin-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma database configuration
│   │   └── redis.ts             # Redis cache configuration
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication handlers
│   │   ├── user.controller.ts   # User profile handlers
│   │   ├── income.controller.ts # Income tracking handlers
│   │   ├── expense.controller.ts # Expense tracking handlers
│   │   ├── goal.controller.ts   # Goal management handlers
│   │   └── dashboard.controller.ts # Dashboard data handlers
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication middleware
│   │   ├── validator.ts         # Zod validation middleware
│   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   └── errorHandler.ts      # Global error handler
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication routes
│   │   ├── user.routes.ts       # User profile routes
│   │   ├── income.routes.ts     # Income tracking routes
│   │   ├── expense.routes.ts    # Expense tracking routes
│   │   ├── goal.routes.ts       # Goal management routes
│   │   └── dashboard.routes.ts  # Dashboard routes
│   ├── services/
│   │   ├── auth.service.ts      # Authentication business logic
│   │   ├── user.service.ts      # User management business logic
│   │   ├── income.service.ts    # Income tracking business logic
│   │   ├── expense.service.ts   # Expense tracking business logic
│   │   ├── goal.service.ts      # Goal management business logic
│   │   ├── dashboard.service.ts # Dashboard data aggregation
│   │   └── email.service.ts     # Email sending service
│   ├── types/
│   │   ├── auth.types.ts        # Authentication type definitions
│   │   ├── user.types.ts        # User type definitions
│   │   ├── income.types.ts      # Income type definitions
│   │   ├── expense.types.ts     # Expense type definitions
│   │   ├── goal.types.ts        # Goal type definitions
│   │   └── dashboard.types.ts   # Dashboard type definitions
│   ├── utils/
│   │   ├── jwt.ts               # JWT token utilities
│   │   ├── logger.ts            # Winston logger setup
│   │   ├── response.ts          # Response formatting utilities
│   │   ├── errors.ts            # Custom error classes
│   │   └── validators.ts        # Common validation functions
│   ├── app.ts                   # Express app configuration
│   └── server.ts                # Server entry point
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── .env                         # Environment variables
├── .env.example                 # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚧 Development Status

### Current Phase: Core Features Development

**Completed (75%):**
- ✅ Authentication & User Management
- ✅ Income Tracking
- ✅ Expense Management
- ✅ Financial Goals
- ✅ Dashboard Analytics

**In Progress (25%):**
- 🚧 AI Rate Auditor
- 🚧 Payment Integration
- 🚧 Market Rates Service
- 🚧 Client Management
- 🚧 Invoice Generation

**Upcoming:**
- 📋 Tax Calculator
- 📋 Advanced Analytics & Reports
- 📋 Notifications System
- 📋 Premium Subscriptions

### API Endpoints Progress

**Total Endpoints:** 28 implemented / ~50 planned (56% complete)

---

## 📈 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "stack": "Error stack trace (only in development)"
  }
}
```

---

## 🔒 Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Prisma ORM
- ✅ XSS protection
- ✅ Environment variable security

---

## 🧪 Testing
```bash
# Run tests (coming soon)
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 📦 Deployment

### Production Build
```bash
# Build the project
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Make sure to set these environment variables in your production environment:
- `NODE_ENV=production`
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Production database URL
- Production Redis URL (if using)
- SMTP credentials for email

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Perucy
- GitHub: [@perucy](https://github.com/perucy)

---

## 🙏 Acknowledgments

- Built with ❤️ for freelancers worldwide
- Inspired by the need for better financial tools for independent workers
- Special thanks to the open-source community

---

## 📞 Support

For support, raise an issue in this repo

---

**Last Updated:** October 22, 2025

---

<p align="center">
  Made with ❤️ by the Crefin Team
</p>
