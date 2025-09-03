---
description: Repository Information Overview
alwaysApply: true
---

# Food Delivery Application Information

## Summary
A full-stack food delivery application built with the MERN stack (MongoDB, Express.js, React, Node.js). Features include user authentication, restaurant browsing, menu management, shopping cart functionality, order placement/tracking, payment integration, and an admin dashboard.

## Structure
- **client/**: React frontend application built with Vite
- **server/**: Express.js backend API
- **testsprite_tests/**: Automated test suite using TestSprite
- **Root files**: Configuration files and test scripts

## Projects

### Backend (server/)

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js v14+ required
**Package Manager**: npm
**Main Entry Point**: server.js

#### Dependencies
**Main Dependencies**:
- express: ^4.21.2 (Web framework)
- mongoose: ^8.17.2 (MongoDB ODM)
- jsonwebtoken: ^9.0.2 (Authentication)
- bcrypt/bcryptjs: ^5.1.0/^2.4.3 (Password hashing)
- express-rate-limit: ^8.0.1 (Security)
- helmet: ^8.1.0 (Security headers)
- winston: 3.11.0 (Logging)

**Development Dependencies**:
- jest: ^30.0.5 (Testing)
- supertest: ^7.1.4 (API testing)
- nodemon: ^3.0.1 (Development server)
- mongodb-memory-server: ^8.0.0 (Testing)

#### Build & Installation
```bash
cd server
npm install
npm run dev  # Development mode
npm start    # Production mode
npm run seed # Seed database
```

#### Testing
**Framework**: Jest
**Test Location**: Not explicitly defined, likely in a /tests directory
**Run Command**:
```bash
cd server
npm test
```

### Frontend (client/)

#### Language & Runtime
**Language**: JavaScript/JSX (React)
**Version**: React 18.2.0
**Build System**: Vite 5.0.8
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.1
- axios: ^1.10.0 (HTTP client)
- chart.js/react-chartjs-2: ^4.5.0/^5.3.0 (Data visualization)
- react-toastify: ^11.0.5 (Notifications)

**Development Dependencies**:
- @vitejs/plugin-react: ^4.5.2
- eslint: ^9.29.0
- tailwindcss: ^3.3.6
- postcss: ^8.4.32
- autoprefixer: ^10.4.16

#### Build & Installation
```bash
cd client
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

### Testing Framework (testsprite_tests/)

#### Specification & Tools
**Type**: TestSprite test suite
**Required Tools**: @testsprite/testsprite-mcp

#### Key Resources
**Main Files**:
- TC*.py files: Test case implementations
- testsprite_backend_test_plan.json: Backend test configuration
- testsprite_frontend_test_plan.json: Frontend test configuration

#### Usage & Operations
**Key Commands**:
```bash
npx @testsprite/testsprite-mcp@latest
```

## Security Features
- JWT-based authentication with HTTP-only cookies
- Role-based access control (User, Restaurant Owner, Admin)
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS protection with configured origins
- Secure HTTP headers with Helmet