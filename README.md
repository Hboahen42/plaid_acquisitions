# Acquisitions API

A secure and scalable RESTful API built with Node.js and Express for managing user acquisitions with authentication, role-based access control, and advanced security features.

## Features

- User authentication (sign up, sign in, sign out)
- JWT-based authorization
- Role-based access control (admin, user, guest)
- User CRUD operations
- Advanced security with Arcjet (rate limiting, bot protection, shield)
- PostgreSQL database with Drizzle ORM
- Request logging with Winston and Morgan
- Input validation with Zod
- Docker support for development and production
- CI/CD pipeline with GitHub Actions
- Comprehensive error handling

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js v5
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Arcjet, Helmet, bcrypt
- **Validation:** Zod
- **Logging:** Winston, Morgan
- **Testing:** Jest, Supertest
- **Code Quality:** ESLint, Prettier
- **Containerization:** Docker

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or Neon account)
- Docker (optional, for containerized deployment)
- Arcjet API key (for security features)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Hboahen42/acquistions.git
cd acquistions
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see Environment Variables section)

4. Generate and run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=your_postgresql_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Arcjet
ARCJET_KEY=your_arcjet_api_key
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Starts the server with hot-reload enabled using Node's `--watch` flag.

### Production Mode

```bash
npm start
```

### Docker Development

```bash
npm run dev:docker
```

### Docker Production

```bash
npm run prod:docker
```

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint
- `GET /` - Welcome message
- `GET /api` - API status

### Authentication

- `POST /api/auth/sign-up` - Register a new user
- `POST /api/auth/sign-in` - Sign in and receive JWT token
- `POST /api/auth/sign-out` - Sign out (invalidate token)

### Users (Protected Routes)

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (authenticated users)
- `PUT /api/users/:id` - Update user by ID (authenticated users)
- `DELETE /api/users/:id` - Delete user by ID (admin only)

### Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Management

### Generate Migrations

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

### Drizzle Studio (Database GUI)

```bash
npm run db:studio
```

## Testing

Run tests with Jest:

```bash
npm test
```

## Code Quality

### Linting

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Fix linting errors automatically
```

### Formatting

```bash
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting
```

## Security Features

This API implements multiple layers of security:

- **Arcjet Protection:**
  - Rate limiting (role-based: admin 20/min, user 10/min, guest 5/min)
  - Bot detection and blocking
  - Shield protection against common attacks

- **Authentication & Authorization:**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Password hashing with bcrypt

- **HTTP Security:**
  - Helmet.js for security headers
  - CORS configuration
  - Cookie parsing with secure options

## Project Structure

```
acquistions/
├── src/
│   ├── config/          # Configuration files (database, logger, arcjet)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, security)
│   ├── models/          # Database models (Drizzle schemas)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── validations/     # Input validation schemas (Zod)
│   ├── app.js           # Express app setup
│   └── index.js         # Entry point
├── test/                # Test files
├── logs/                # Application logs
├── scripts/             # Deployment scripts
├── .github/workflows/   # CI/CD pipelines
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── package.json         # Project dependencies and scripts
```

## CI/CD

This project includes GitHub Actions workflows for:

- Building and pushing Docker images
- Running tests
- Code quality checks

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please open an issue at [GitHub Issues](https://github.com/Hboahen42/acquistions/issues)
