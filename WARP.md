# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with auto-reload using Node.js --watch
- Server runs on port 3000 (or PORT env var)
- Access health check at `/health` and API root at `/api`

### Code Quality
- `npm run lint` - Run ESLint for code linting
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Database Operations
- `npm run db:generate` - Generate Drizzle migrations from schema changes
- `npm run db:migrate` - Apply pending migrations to database
- `npm run db:studio` - Launch Drizzle Studio for database management

## Architecture Overview

This is a Node.js/Express API application following a layered architecture pattern with clear separation of concerns:

### Project Structure
- **Models** (`src/models/`): Drizzle ORM schema definitions (PostgreSQL via Neon)
- **Controllers** (`src/controllers/`): HTTP request handlers and response formatting
- **Services** (`src/services/`): Business logic layer, database operations
- **Routes** (`src/routes/`): Express route definitions and middleware binding
- **Validations** (`src/validations/`): Zod schema validation for request data
- **Utils** (`src/utils/`): Shared utilities (JWT, cookies, formatting)
- **Config** (`src/config/`): Application configuration (database, logging)
- **Middleware** (`src/middleware/`): Custom Express middleware

### Key Dependencies
- **Database**: Drizzle ORM with Neon PostgreSQL serverless
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for request schema validation
- **Logging**: Winston logger with Morgan HTTP request logging
- **Security**: Helmet, CORS, cookie-parser

### Import Paths
The project uses Node.js subpath imports for cleaner imports:
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validaations/*` → `./src/validaations/*` (note: contains typo in package.json)

## Code Style Standards

### ESLint Configuration
- 2-space indentation with switch case indentation
- Single quotes for strings
- Semicolons required
- Prefer const over let, arrow functions over regular functions
- Unix line endings
- Unused variables allowed with `_` prefix

### Database Patterns
- Use Drizzle ORM with PostgreSQL dialect
- Models defined with `pgTable` in `src/models/`
- Database connection exported from `src/config/database.js`
- Migrations stored in `drizzle/` directory

### Authentication Flow
- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- User roles supported (default: 'user')
- Validation with Zod schemas before controller processing

### Error Handling
- Controllers should catch errors and pass to Express error handler via `next(e)`
- Use Winston logger for structured logging
- Format validation errors with custom utility functions
- HTTP status codes: 400 (validation), 401 (auth), 409 (conflict), 500 (server)

### Environment Configuration
Required environment variables (see `.env.example`):
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Winston log level
- `DATABASE_URL` - Neon PostgreSQL connection string