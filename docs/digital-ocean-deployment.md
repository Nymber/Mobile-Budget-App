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

### 3. Deploy the Application

Clone your repository:

```bash
git clone https://github.com/yourusername/Mobile-Budget-App.git
cd Mobile-Budget-App
```

Build and start the containers:

```bash
docker-compose up -d
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