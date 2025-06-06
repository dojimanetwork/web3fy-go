# Web3FyGo Deployment Guide

This guide covers deploying the Web3FyGo application using Docker and Docker Compose.

## Prerequisites

- Docker 20.0 or higher
- Docker Compose v2.0 or higher
- At least 2GB RAM available
- 5GB free disk space

## Deployment Options

### 1. Production Deployment (Recommended)

#### Quick Start
```bash
# Clone the repository
git clone <your-repo-url>
cd web3fygo

# Set environment variables
export DB_PASSWORD="your_secure_password_here"

# Build and start the production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Environment Variables
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_PASSWORD=your_secure_password_here
DB_NAME=web3fygo_prod
DB_USER=web3fygo_user

# Application Configuration
NODE_ENV=production
PORT=3000

# Puppeteer Configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 2. Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.prod.yml --target development up -d
```

## Services

The production deployment includes:

### Application (`app`)
- **Port**: 3000
- **Technology**: Node.js + TypeScript + Express
- **Features**: Amazon product scraping with Puppeteer
- **Health Check**: `http://localhost:3000/api/health`

### Database (`postgres`)
- **Port**: 5432
- **Version**: PostgreSQL 15 Alpine
- **Database**: `web3fygo_prod`
- **Health Check**: Built-in PostgreSQL health check

### Reverse Proxy (`nginx`)
- **Ports**: 80 (HTTP), 443 (HTTPS ready)
- **Features**: Rate limiting, compression, security headers
- **Health Check**: `http://localhost/health`

## Build Targets

The Dockerfile supports multiple build targets:

- `base`: Base image with system dependencies
- `development`: Development environment with hot reload
- `build`: Build stage for compiling TypeScript
- `production`: Optimized production image

## Docker Commands

### Build Commands
```bash
# Build production image
docker build --target production -t web3fygo:prod .

# Build development image
docker build --target development -t web3fygo:dev .

# Build specific target
docker build --target build -t web3fygo:build .
```

### Management Commands
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart a service
docker-compose -f docker-compose.prod.yml restart [service_name]

# Scale the application (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

### Database Management
```bash
# Database initialization (automatic on first run)
docker-compose -f docker-compose.prod.yml exec postgres psql -U web3fygo_user -d web3fygo_prod

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U web3fygo_user web3fygo_prod > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U web3fygo_user -d web3fygo_prod < backup.sql
```

## Performance Optimization

### Puppeteer Configuration
- Uses system Chrome installation (`/usr/bin/google-chrome-stable`)
- Configured for headless operation in production
- Optimized for Docker environment

### Rate Limiting (Nginx)
- API endpoints: 10 requests/second
- Scraping endpoints: 2 requests/second
- Configurable burst limits

### Resource Limits
Add to `docker-compose.prod.yml` if needed:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## Monitoring & Health Checks

### Application Health
```bash
# Check application health
curl http://localhost:3000/api/health

# Check via Nginx
curl http://localhost/health
```

### Service Status
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service health
docker-compose -f docker-compose.prod.yml exec app curl -f http://localhost:3000/api/health
```

### Logs
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## Security Considerations

### Network Security
- Internal Docker network isolation
- Nginx reverse proxy with security headers
- Rate limiting on sensitive endpoints

### Application Security
- Non-root user in containers
- Minimal base images (Alpine/slim)
- Security headers via Nginx

### Database Security
- User with limited privileges
- Network isolation
- Persistent volume for data

## Troubleshooting

### Common Issues

#### Puppeteer Chrome Issues
```bash
# Check Chrome installation in container
docker-compose -f docker-compose.prod.yml exec app /usr/bin/google-chrome-stable --version

# Check Puppeteer configuration
docker-compose -f docker-compose.prod.yml exec app env | grep PUPPETEER
```

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose -f docker-compose.prod.yml exec app pg_isready -h postgres -p 5432

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### Application Issues
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Debug mode (if needed)
docker-compose -f docker-compose.prod.yml exec app npm run diagnose
```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove images (optional)
docker system prune -a

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## API Endpoints

Once deployed, the following endpoints are available:

- `GET /api/health` - Health check
- `GET /api/info` - Application information
- `GET /api/products` - Get trending products
- `GET /api/products-enhanced` - Get enhanced product data
- `GET /api/product/details?url=<amazon_url>` - Get specific product details
- `GET /api/database/stats` - Database statistics

## Production Checklist

- [ ] Set secure database password
- [ ] Configure SSL/TLS (HTTPS)
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Set up domain name and DNS
- [ ] Test all endpoints
- [ ] Monitor resource usage
- [ ] Set up CI/CD pipeline

## Support

For issues and questions:
1. Check the logs first
2. Review this deployment guide
3. Check the main README.md
4. Review application documentation 