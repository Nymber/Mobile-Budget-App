# Deploying Mobile Budget App on DigitalOcean

This guide outlines the steps to deploy the Mobile Budget App on DigitalOcean.

## Option 1: Deployment using DigitalOcean Droplet

### 1. Create a DigitalOcean Droplet

1. Sign in to your DigitalOcean account
2. Click "Create" and select "Droplets"
3. Choose an image: Ubuntu 22.04 LTS
4. Select a plan: Basic Shared CPU (2GB RAM / 1 CPU minimum recommended)
5. Choose a datacenter region close to your users
6. Add SSH keys for secure access
7. Click "Create Droplet"

### 2. Set Up the Droplet

SSH into your droplet:

```bash
ssh root@your-droplet-ip
```

Update the system:

```bash
apt update && apt upgrade -y
```

Install Docker and Docker Compose:

```bash
apt install -y docker.io docker-compose
systemctl enable docker
systemctl start docker
```

# Configure Docker memory limits (important to prevent build failures)
```bash
# Create or modify the Docker daemon configuration
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "memory-swap": -1,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker to apply changes
systemctl restart docker
```

### 3. Deploy the Application

Clone your repository:

```bash
git clone https://github.com/yourusername/Mobile-Budget-App.git
cd Mobile-Budget-App
```

#### Handling "Killed" Errors During Build

If you encounter a "Killed" error during the npm installation step (e.g., `RUN npm ci` or `npm install`), this indicates that the build process ran out of memory. Here are ways to resolve this:

1. Allocate swap space to your droplet:
   ```bash
   # Create a 2GB swap file
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   # Make swap permanent
   echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
   ```

2. Modify your Dockerfile to use NodeJS with lower memory usage:
   ```dockerfile
   # Add NODE_OPTIONS before npm commands
   RUN NODE_OPTIONS="--max_old_space_size=512" npm ci --no-audit --no-fund --prefer-offline
   ```

3. Use a droplet with more memory (4GB RAM minimum recommended for Node.js builds)

#### Handling "COPY failed" Errors During Build

If you encounter an error like `COPY failed: stat app/next.config.js: file does not exist` during the Docker build process, you'll need to modify your Dockerfile. This happens when your Next.js project doesn't have a configuration file but the Dockerfile expects one.

To fix this issue:

1. Create an empty Next.js config file in your project root:
   ```bash
   echo 'module.exports = {}' > next.config.js
   ```

2. Or modify your Dockerfile to make the copy step conditional:
   ```dockerfile
   # Replace the failing COPY command with this
   COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
   COPY --from=builder --chown=nextjs:nodejs /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
   
   # Copy next.config.js only if it exists
   RUN if [ -f /app/next.config.js ]; then \
       cp /app/next.config.js ./next.config.js; \
       else echo 'module.exports = {}' > ./next.config.js; \
   fi
   ```

3. If using docker-compose, update your build command to ensure the file exists before building:
   ```yaml
   services:
     frontend:
       build:
         context: ./frontend
         args:
           - NODE_ENV=production
       command: sh -c '[ -f next.config.js ] || echo "module.exports = {}" > next.config.js && npm start'
   ```

Build and start the containers:

```bash
# For systems with limited memory, you can use this to build one container at a time
docker-compose build backend && docker-compose build frontend
docker-compose up -d

# Alternatively, use the --memory option to allocate more memory for the build
# docker-compose build --memory=2g
# docker-compose up -d
```

### 4. Configure Domain and SSL (Optional)

Install Nginx:

```bash
apt install -y nginx
```

Configure Nginx as a reverse proxy:

```bash
nano /etc/nginx/sites-available/mobile-budget-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/mobile-budget-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Set up SSL with Certbot:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Option 2: Deployment using DigitalOcean App Platform

### 1. Create a New App

1. Sign in to your DigitalOcean account
2. Go to "Apps" in the left sidebar and click "Create App"
3. Connect your GitHub repository
4. Select the branch you want to deploy

### 2. Configure Components

You'll need to configure two components:

#### Backend Component:
- Type: Service
- Source Directory: `/backend`
- Build Command: `pip install -r requirements.txt`
- Run Command: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
- HTTP Port: 8000

#### Frontend Component:
- Type: Web Service
- Source Directory: `/frontend`
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- HTTP Port: 3000

### 3. Configure Environment Variables

Add the following environment variables:
- `ENVIRONMENT=production`
- `NEXT_PUBLIC_API_URL=$APP_URL` (use the backend service URL)

### 4. Configure Database (Optional)

If you want to use a managed database instead of SQLite:
1. Create a DigitalOcean Managed Database (PostgreSQL)
2. Add the database connection details as environment variables
3. Update your application code to use the new database

## Maintenance and Monitoring

### Updating Your Application

For Droplet deployment:

```bash
cd ~/Mobile-Budget-App
git pull
docker-compose down
docker-compose up -d --build
```

For App Platform: Commits to your GitHub repository will trigger automatic deployments.

### Monitoring

1. Set up DigitalOcean Monitoring
2. Configure alerts for CPU, memory, and disk usage
3. Use the DigitalOcean Dashboard to monitor your resources

## Backup Strategy

1. For SQLite database:
   ```bash
   docker-compose exec backend sh -c "sqlite3 instance/financial_data.db '.backup /app/instance/financial_data.db.backup'"
   ```

2. For the entire application:
   ```bash
   # Create DigitalOcean Snapshots for your Droplet
   doctl compute droplet snapshot create your-droplet-id --snapshot-name "mobile-budget-app-backup-$(date +%Y%m%d)"
   ```

## Scaling

If you need to scale your application:
1. Upgrade your Droplet to a larger size
2. For App Platform, increase the number of instances for your services
3. Consider moving to a managed database service like DigitalOcean Managed Databases