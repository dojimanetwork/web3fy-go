# GitHub Actions CI/CD Pipeline

This document explains the GitHub Actions workflows for building, testing, and deploying the Web3FyGo application.

## 📋 **Overview**

We have three main workflows:

1. **`docker-build.yml`** - Main build pipeline with GitHub Container Registry
2. **`docker-hub.yml`** - Alternative pipeline for Docker Hub
3. **`deploy.yml`** - Multi-cloud deployment pipeline

## 🚀 **Workflows**

### 1. Main Build Pipeline (`docker-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Tags starting with `v*` (e.g., `v1.0.0`)
- Pull requests to `main` or `develop`

**Features:**
- ✅ Multi-platform builds (AMD64, ARM64)
- ✅ Matrix builds (development, production targets)
- ✅ GitHub Container Registry (ghcr.io)
- ✅ Build caching for faster builds
- ✅ Security scanning with Trivy
- ✅ Automatic staging/production deployment

**Image Tags Generated:**
```
ghcr.io/username/web3fygo:main-production
ghcr.io/username/web3fygo:main-development
ghcr.io/username/web3fygo:v1.0.0-production
ghcr.io/username/web3fygo:latest-production
```

### 2. Docker Hub Pipeline (`docker-hub.yml`)

**Alternative to GitHub Container Registry**

**Additional Features:**
- ✅ Code quality checks (linting, type checking)
- ✅ Unit tests execution
- ✅ Docker Hub integration

**Required Secrets:**
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_ACCESS_TOKEN`

### 3. Deployment Pipeline (`deploy.yml`)

**Supports Multiple Platforms:**
- AWS ECS
- DigitalOcean App Platform
- Kubernetes
- VPS with Docker Compose
- Slack notifications

## 🔧 **Setup Instructions**

### 1. GitHub Container Registry (Recommended)

1. **Enable GitHub Packages:**
   ```bash
   # No additional setup needed - uses GITHUB_TOKEN automatically
   ```

2. **Repository Settings:**
   - Go to your repository → Settings → Actions → General
   - Enable "Read and write permissions" for GITHUB_TOKEN

### 2. Docker Hub Alternative

1. **Create Docker Hub Access Token:**
   - Go to Docker Hub → Account Settings → Security
   - Create new access token

2. **Add GitHub Secrets:**
   ```
   DOCKER_HUB_USERNAME: your_dockerhub_username
   DOCKER_HUB_ACCESS_TOKEN: your_access_token
   ```

3. **Update Repository Name:**
   ```yaml
   # In .github/workflows/docker-hub.yml
   env:
     DOCKER_HUB_REPO: your_username/web3fygo
   ```

### 3. Deployment Setup

#### AWS ECS Deployment

**Required Secrets:**
```
AWS_ACCESS_KEY_ID: your_aws_access_key
AWS_SECRET_ACCESS_KEY: your_aws_secret_key
AWS_REGION: us-east-1
ECS_CLUSTER_NAME: web3fygo-cluster
ECS_SERVICE_NAME: web3fygo-service
ECS_TASK_DEFINITION: web3fygo-task
```

**ECS Task Definition Example:**
```json
{
  "family": "web3fygo-task",
  "containerDefinitions": [
    {
      "name": "web3fygo-app",
      "image": "ghcr.io/username/web3fygo:latest-production",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

#### DigitalOcean App Platform

**Required Secrets:**
```
DIGITALOCEAN_ACCESS_TOKEN: your_do_token
DO_APP_ID: your_app_id
```

**App Spec Example (`.do/app.yaml`):**
```yaml
name: web3fygo
services:
- name: web3fygo-app
  image:
    registry_type: GHCR
    repository: username/web3fygo
    tag: latest-production
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
```

#### Kubernetes Deployment

**Required Secrets:**
```
KUBE_CONFIG: base64_encoded_kubeconfig
```

**Kubernetes Manifests Example:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web3fygo-app
  namespace: web3fygo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web3fygo-app
  template:
    metadata:
      labels:
        app: web3fygo-app
    spec:
      containers:
      - name: web3fygo-app
        image: ghcr.io/username/web3fygo:latest-production
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

#### VPS Docker Compose Deployment

**Required Secrets:**
```
VPS_HOST: your_server_ip
VPS_USERNAME: your_ssh_username
VPS_SSH_KEY: your_private_ssh_key
```

**Server Setup:**
```bash
# On your VPS
mkdir -p /opt/web3fygo
cd /opt/web3fygo

# Copy docker-compose.prod.yml to server
# Update image references to use your registry
```

## 🏷️ **Tagging Strategy**

### Semantic Versioning
```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0
```

**Generated Images:**
- `v1.0.0-production` - Exact version
- `v1.0-production` - Minor version
- `v1-production` - Major version
- `latest-production` - Latest stable

### Branch-based Tags
- `main-production` - Latest main branch
- `develop-production` - Latest develop branch
- `pr-123-production` - Pull request builds

## 🔒 **Security Features**

### 1. Vulnerability Scanning
- **Trivy** scans for OS and library vulnerabilities
- Fails on CRITICAL and HIGH severity issues
- Results uploaded to GitHub Security tab

### 2. SARIF Reports
- Security findings integrated with GitHub Security
- Automated security alerts
- Dependency vulnerability tracking

### 3. Multi-stage Builds
- Minimal production images
- No development dependencies in production
- Non-root user execution

## 📊 **Monitoring & Notifications**

### Slack Integration
**Setup:**
1. Create Slack webhook URL
2. Add secret: `SLACK_WEBHOOK_URL`
3. Configure channel in workflow

### Build Status
- ✅ **Success**: Green checkmarks, Slack notification
- ❌ **Failure**: Red X, Slack alert with details
- 🟡 **In Progress**: Yellow circle, real-time updates

## 🚦 **Usage Examples**

### 1. Development Workflow
```bash
# Feature development
git checkout -b feature/new-endpoint
# Make changes
git push origin feature/new-endpoint
# Create PR → triggers build without push
```

### 2. Release Workflow
```bash
# Release preparation
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0
# Triggers: build → security scan → deploy to production
```

### 3. Hotfix Workflow
```bash
# Emergency fix
git checkout -b hotfix/critical-fix
# Make fix
git push origin hotfix/critical-fix
# Create PR to main → review → merge → auto-deploy
```

## 🛠️ **Customization**

### Adding New Deployment Target
```yaml
deploy-to-new-platform:
  runs-on: ubuntu-latest
  if: github.event.workflow_run.conclusion == 'success'
  environment: new-platform
  
  steps:
    - name: Deploy to New Platform
      run: |
        # Your deployment commands here
```

### Custom Build Arguments
```yaml
- name: Build with custom args
  uses: docker/build-push-action@v5
  with:
    build-args: |
      NODE_ENV=production
      API_VERSION=v2
      CUSTOM_FLAG=true
```

### Environment-specific Configs
```yaml
# Use different configs per environment
- name: Deploy staging
  if: github.ref == 'refs/heads/develop'
  run: |
    docker-compose -f docker-compose.staging.yml up -d

- name: Deploy production  
  if: startsWith(github.ref, 'refs/tags/v')
  run: |
    docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 **Troubleshooting**

### Common Issues

#### 1. Build Failures
```bash
# Check workflow logs in GitHub Actions tab
# Common causes:
# - Dockerfile syntax errors
# - Missing dependencies
# - Test failures
```

#### 2. Registry Authentication
```bash
# Verify secrets are set correctly
# For GHCR: GITHUB_TOKEN permissions
# For Docker Hub: username/token validity
```

#### 3. Deployment Failures
```bash
# Check deployment logs
# Verify target platform connectivity
# Confirm image availability
```

### Debug Mode
```yaml
# Add to workflow for debugging
- name: Debug info
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    docker images
```

## 📚 **Best Practices**

1. **Use matrix builds** for multiple targets
2. **Cache layers** for faster builds
3. **Scan for vulnerabilities** before deployment
4. **Use semantic versioning** for releases
5. **Test before deployment** with staging environment
6. **Monitor build times** and optimize as needed
7. **Keep secrets secure** and rotate regularly
8. **Use environments** for deployment protection

## 🎯 **Next Steps**

- [ ] Set up monitoring and alerting
- [ ] Configure automatic rollbacks
- [ ] Add integration tests
- [ ] Set up blue-green deployments
- [ ] Configure auto-scaling
- [ ] Add performance testing
- [ ] Set up backup strategies 