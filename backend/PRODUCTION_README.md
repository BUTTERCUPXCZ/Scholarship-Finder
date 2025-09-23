# Backend Production Deployment Guide

This guide will help you deploy your scholarship backend application to production.

## 🏗️ Production Setup Overview

The backend is now configured with:
- ✅ TypeScript compilation for production
- ✅ Environment-specific configurations
- ✅ Docker containerization
- ✅ Health checks and monitoring
- ✅ Security middleware
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Database migrations

## 📋 Prerequisites

Before deploying to production, ensure you have:

1. **Node.js 18+** installed
2. **Docker** and **Docker Compose** installed
3. **Production database** setup (PostgreSQL recommended)
4. **Environment variables** configured

## 🔧 Environment Configuration

1. Copy the production environment template:
   ```bash
   cp .env.production .env
   ```

2. Fill in your production values in `.env`:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=your_production_database_url_here
   JWT_SECRET=your_super_secure_jwt_secret_here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-production-domain.com
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CORS_ORIGINS=https://your-production-domain.com
   ```

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

1. **Quick deployment using the script:**
   ```powershell
   # Windows PowerShell
   .\deploy.ps1
   ```
   
   ```bash
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Manual deployment:**
   ```bash
   # Build the application
   npm run build
   
   # Run database migrations
   npm run prisma:deploy
   
   # Build and start with Docker
   docker-compose up -d
   ```

### Option 2: Direct Node.js Deployment

1. **Install dependencies:**
   ```bash
   npm ci --only=production
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Run database migrations:**
   ```bash
   npm run prisma:deploy
   ```

4. **Start the application:**
   ```bash
   npm run start
   ```

## 📊 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript application for production (standard)
- `npm run build:safe` - Build using fallback method (if rimraf issues occur)
- `npm run clean` - Clean the build directory (using npx rimraf)
- `npm run clean:fallback` - Clean using Node.js fs (fallback method)
- `npm run start` - Start the production server
- `npm run start:prod` - Build and start in one command
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:deploy` - Deploy database migrations to production

### 🔧 Build Troubleshooting

If you encounter build issues, you can:

1. **Use the build checker:**
   ```powershell
   # Windows
   .\build-check.ps1
   
   # Linux/Mac  
   chmod +x build-check.sh
   ./build-check.sh
   ```

2. **Use the safe build method:**
   ```bash
   npm run build:safe
   ```

3. **Manual troubleshooting:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Try compilation directly
   npx tsc
   ```

## 🔍 Health Monitoring

The application includes a health check endpoint:
- **URL:** `http://your-domain:3000/health`
- **Response:** JSON with status, timestamp, environment, and version

Example response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-23T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 🐳 Docker Configuration

### Dockerfile Features
- Multi-stage build for optimized image size
- Non-root user for security
- Health checks included
- Signal handling with dumb-init

### Docker Compose Features
- Environment variable management
- Automatic restart policies
- Health check configuration
- Optional database service

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate limiting** - Prevents abuse
- **CORS** - Configurable cross-origin requests
- **JWT authentication** - Secure token-based auth
- **Environment-based configuration** - Separate dev/prod settings

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration |
| `FRONTEND_URL` | Yes | - | Frontend application URL |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `CORS_ORIGINS` | No | - | Comma-separated allowed origins |

## 🚨 Troubleshooting

### Common Issues

1. **TypeScript compilation errors:**
   ```bash
   npm run clean && npm run build
   ```

2. **Database connection issues:**
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from your server
   - Run migrations: `npm run prisma:deploy`

3. **Environment variable issues:**
   - Check `.env` file exists and has correct values
   - Verify all required variables are set

4. **Docker issues:**
   - Ensure Docker is running
   - Check Docker logs: `docker-compose logs`
   - Rebuild image: `docker-compose build --no-cache`

### Logs and Debugging

- **View application logs:**
  ```bash
  docker-compose logs -f backend
  ```

- **Check container status:**
  ```bash
  docker-compose ps
  ```

- **Access container shell:**
  ```bash
  docker-compose exec backend sh
  ```

## 📈 Production Best Practices

1. **Use a process manager** (PM2, Docker, etc.)
2. **Set up log aggregation** (ELK stack, Datadog, etc.)
3. **Monitor application metrics** (CPU, memory, response times)
4. **Regular database backups**
5. **SSL/TLS termination** (nginx, CloudFlare, etc.)
6. **Environment secret management** (Vault, AWS Secrets Manager, etc.)

## 🔄 Updates and Maintenance

To update the application:

1. Pull latest code
2. Install dependencies: `npm ci`
3. Run migrations: `npm run prisma:deploy`
4. Build and restart: `docker-compose up -d --build`

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify environment configuration
3. Test the health endpoint
4. Review Docker container status