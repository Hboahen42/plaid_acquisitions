# 🐳 Docker Deployment Guide - Acquisitions API

This guide explains how to run the Acquisitions API using Docker with different configurations for development and production environments.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Neon account with API key (for both development and production)
- Git repository cloned locally

## 🛠️ Quick Setup

### 1. Clone and Setup Environment Files

```bash
git clone <your-repository-url>
cd acquisitions

# Copy and configure environment files
cp .env.development .env.development.local
cp .env.production .env.production.local
```

### 2. Configure Neon Settings

Edit your environment files with your actual Neon credentials:

**For `.env.development.local`:**

```bash
# Get these from your Neon Console
NEON_API_KEY=your_actual_neon_api_key
NEON_PROJECT_ID=your_actual_neon_project_id
PARENT_BRANCH_ID=your_main_branch_id
```

**For `.env.production.local`:**

```bash
# Your production Neon Cloud connection string
DATABASE_URL=postgres://username:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your_super_secure_jwt_secret_here
```

---

## 🏗️ Development Environment

### Overview

Development environment uses **Neon Local**, which creates ephemeral database branches that are automatically created when containers start and deleted when they stop. This gives you a fresh database for each development session.

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │ -> │   Neon Local    │ -> │   Neon Cloud    │
│  (Port 3000)    │    │   (Port 5432)   │    │   (Remote DB)   │
│                 │    │     Proxy       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Running Development Environment

```bash
# Start development environment with Neon Local
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up

# Or run in detached mode
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

### Development Features

- **🔄 Hot Reload**: Code changes automatically restart the application
- **🌿 Ephemeral Branches**: Fresh database branch for each session
- **🔍 Database Studio**: Optional Drizzle Studio for database management
- **📊 Debug Logging**: Detailed logging for development

### Optional: Run with Drizzle Studio

```bash
# Start with database management UI
docker-compose -f docker-compose.dev.yml --profile studio --env-file .env.development.local up
```

Access Drizzle Studio at: http://localhost:4983

### Development URLs

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/api
- **Drizzle Studio**: http://localhost:4983 (if enabled)

---

## 🚀 Production Environment

### Overview

Production environment connects directly to **Neon Cloud** without any local proxy. Uses optimized Docker images with security hardening.

### Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Your App      │ -> │   Neon Cloud    │
│  (Port 3000)    │    │   (Direct)      │
│   Production    │    │                 │
└─────────────────┘    └─────────────────┘
```

### Running Production Environment

```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up --build

# Run in detached mode (recommended for production)
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Database Migration (Production)

```bash
# Run database migrations before starting the app
docker-compose -f docker-compose.prod.yml --profile migration --env-file .env.production.local up migrator

# Or run migrations manually
docker-compose -f docker-compose.prod.yml --env-file .env.production.local run --rm app npm run db:migrate
```

### Production with Nginx (Optional)

```bash
# Start with Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx --env-file .env.production.local up -d
```

### Production URLs

- **API**: http://localhost:3000 (or through Nginx on port 80/443)
- **Health Check**: http://localhost:3000/health

---

## 🔧 Configuration Details

### Environment Variables Switching

The system automatically switches database connections based on the environment:

**Development** (`.env.development`):

```bash
DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions?sslmode=require
# ↑ Points to Neon Local container
```

**Production** (`.env.production`):

```bash
DATABASE_URL=postgres://username:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require
# ↑ Points directly to Neon Cloud
```

### Docker Images

The Dockerfile uses multi-stage builds:

- **Development**: `target: dev` - includes dev dependencies and hot reload
- **Production**: `target: production` - optimized, security hardened, non-root user

---

## 📚 Common Commands

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up

# View application logs
docker-compose -f docker-compose.dev.yml logs -f app

# View Neon Local logs
docker-compose -f docker-compose.dev.yml logs -f neon-local

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

### Production Commands

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build

# Scale application (if needed)
docker-compose -f docker-compose.prod.yml up --scale app=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop production environment
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Commands

```bash
# Generate new migration (development)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:generate

# Run migrations (development)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:migrate

# Run migrations (production)
docker-compose -f docker-compose.prod.yml --env-file .env.production.local run --rm app npm run db:migrate

# Access database directly (development)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local exec neon-local psql -h localhost -U neon -d acquisitions
```

---

## 🔐 Security Considerations

### Development Security

- Uses self-signed certificates (acceptable for local development)
- Debug logging enabled
- Hot reload with source code mounting

### Production Security

- Non-root user in container
- Resource limits and health checks
- Secure cookie settings
- Production logging configuration
- No source code mounting

---

## 🐛 Troubleshooting

### Common Issues

**1. Neon Local Connection Issues**

```bash
# Check Neon Local container status
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify environment variables
docker-compose -f docker-compose.dev.yml config
```

**2. Database Connection Errors**

```bash
# Test database connectivity
docker-compose -f docker-compose.dev.yml exec app node -e "console.log(process.env.DATABASE_URL)"

# Check application logs
docker-compose -f docker-compose.dev.yml logs -f app
```

**3. Port Conflicts**

```bash
# If port 3000 or 5432 are in use, modify the compose files:
# Change "3000:3000" to "3001:3000" for different external port
```

**4. Permission Issues (Linux/Mac)**

```bash
# Ensure proper permissions for mounted volumes
sudo chown -R $USER:$USER ./logs
chmod -R 755 ./logs
```

### Health Checks

All services include health checks. Monitor them with:

```bash
# Check service health
docker-compose -f docker-compose.dev.yml ps

# Detailed health check info
docker inspect acquisitions-app-dev | grep -A 20 Health
```

---

## 📖 Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Neon Console](https://console.neon.tech/) (for managing your database projects)

---

## 🤝 Development Workflow

### Recommended Development Flow

1. **Start Development Environment**:

   ```bash
   docker-compose -f docker-compose.dev.yml --env-file .env.development.local up
   ```

2. **Make Code Changes**: Files are automatically synced and the server restarts

3. **Database Changes**:

   ```bash
   # Generate migration
   docker-compose -f docker-compose.dev.yml run --rm app npm run db:generate

   # Apply migration
   docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate
   ```

4. **Testing**: Use the ephemeral database branch for clean testing

5. **Production Deployment**:

   ```bash
   # Test production build locally first
   docker-compose -f docker-compose.prod.yml --env-file .env.production.local up --build

   # Then deploy to your production environment
   ```

This setup provides you with a complete containerized development and production environment that seamlessly switches between Neon Local for development and Neon Cloud for production! 🎉
