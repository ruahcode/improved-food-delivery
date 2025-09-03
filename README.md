# Food Delivery Application

A full-stack food delivery application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- User authentication (register, login, logout)
- Restaurant browsing and searching
- Menu management
- Shopping cart functionality
- Order placement and tracking
- Payment integration
- Admin dashboard

## Security Features

### Authentication & Authorization
- JWT-based authentication with secure HTTP-only cookies
- Role-based access control (User, Restaurant Owner, Admin)
- Session management with automatic expiration
- Secure password hashing using bcrypt

### Data Protection
- Input validation and sanitization
- Protection against NoSQL injection
- Rate limiting on authentication endpoints
- Secure cookie configuration
- CORS protection

### Secure Development
- Environment-based configuration
- Centralized error handling
- Request validation middleware
- Secure HTTP headers

## Prerequisites

- Node.js (v14 or later)
- MongoDB (v4.4 or later)
- npm or yarn

## Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd FoodDelivery
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```

4. Create a `.env` file in the `server` directory with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   NODE_ENV=development
   PORT=5000
   CHAPA_PUBLIC_KEY=your_chapa_public_key
   CHAPA_SECRET_KEY=your_chapa_secret_key
   ```

5. Create a `.env` file in the `client` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5173
   ```

## Running the Application

1. Start the server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the client:
   ```bash
   cd ../client
   npm start
   ```

3. Access the application at `http://localhost:5173`

## Testing

### Server Tests
```bash
cd server
npm test
```

### Client Tests
```bash
cd client
npm test
```

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Security Best Practices

1. **Environment Variables**: Never commit sensitive data to version control.
2. **Dependencies**: Keep all dependencies up to date.
3. **Authentication**: Always use HTTPS in production.
4. **Input Validation**: Validate and sanitize all user inputs.
5. **Error Handling**: Never expose stack traces in production.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or open an issue in the repository.
# automatic-garbanzo
