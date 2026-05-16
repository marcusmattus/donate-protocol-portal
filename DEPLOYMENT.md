# Deployment Guide - Donate Protocol

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Quick Deploy

```bash
npm install -g vercel
vercel
```

#### Manual Configuration

1. Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "SOLANA_NETWORK": "devnet",
    "SOLANA_RPC_URL": "https://api.devnet.solana.com",
    "ENABLE_REAL_TRANSACTIONS": "false"
  }
}
```

2. Deploy:
```bash
vercel deploy --prod
```

#### Environment Variables in Vercel Dashboard

- Go to Project Settings → Environment Variables
- Add all variables from `.env.example`
- Redeploy

### Option 2: Docker Deployment

#### Build Docker Image

```bash
docker build -t donate-protocol:latest .
```

#### Run Container

```bash
docker run -p 3000:3000 \
  -e SOLANA_NETWORK=devnet \
  -e SOLANA_RPC_URL=https://api.devnet.solana.com \
  donate-protocol:latest
```

#### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

Services started:
- Next.js API: `http://localhost:3000`
- Telegram Bot: `http://localhost:3001`

### Option 3: Heroku

#### Procfile

```
web: npm start
```

#### Deploy

```bash
heroku login
heroku create donate-protocol
git push heroku main
heroku config:set SOLANA_NETWORK=devnet
```

### Option 4: AWS EC2

#### Launch Instance

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-repo/donate-protocol.git
cd donate-protocol

# Install and build
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start "npm start" --name "donate-protocol"
pm2 startup
pm2 save
```

#### Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.donate-protocol.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Option 5: Railway.app

```bash
# Connect to Railway
railway link

# Deploy
railway up

# View logs
railway logs
```

### Option 6: Self-Hosted (VPS)

#### Prerequisites

- Ubuntu 20.04+ server
- Node.js 18+
- Nginx
- PM2
- SSL certificate (Let's Encrypt)

#### Setup Script

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/your-repo/donate-protocol.git
cd donate-protocol

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start "npm start" --name "donate-protocol"
pm2 startup
pm2 save

# Configure Nginx
sudo tee /etc/nginx/sites-available/donate-protocol > /dev/null <<EOF
server {
    listen 80;
    server_name api.donate-protocol.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/donate-protocol /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.donate-protocol.com

echo "✅ Deployment complete!"
```

## Environment Configuration by Deployment

### Development
```env
NODE_ENV=development
SOLANA_NETWORK=devnet
ENABLE_REAL_TRANSACTIONS=false
ENABLE_TELEGRAM_BOT=false
```

### Staging
```env
NODE_ENV=production
SOLANA_NETWORK=devnet
ENABLE_REAL_TRANSACTIONS=false
ENABLE_TELEGRAM_BOT=true
```

### Production
```env
NODE_ENV=production
SOLANA_NETWORK=mainnet-beta
ENABLE_REAL_TRANSACTIONS=true
ENABLE_TELEGRAM_BOT=true
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm run test:demo
      
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## Monitoring & Logging

### Log Aggregation

```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs donate-protocol

# Stream logs
pm2 logs donate-protocol --lines 100 --stream
```

### Health Checks

```bash
# Check service health
curl http://api.donate-protocol.com/health

# Monitor uptime
watch -n 5 'curl -s http://api.donate-protocol.com/health | jq'
```

### Performance Monitoring

- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking
  ```javascript
  import * as Sentry from "@sentry/nextjs";
  Sentry.init({ dsn: "your-dsn-url" });
  ```

## Database Setup (Production)

### PostgreSQL

```bash
# Create database
createdb donate_protocol

# Run migrations
psql donate_protocol < migrations/001_initial.sql

# Backup
pg_dump donate_protocol > backup.sql
```

### Redis

```bash
# Install
sudo apt install redis-server

# Start
sudo systemctl start redis-server

# Test
redis-cli ping
```

## API Rate Limiting

Add to `next.config.mjs`:

```javascript
export default {
  experimental: {
    rateLimit: {
      interval: 60 * 1000, // 1 minute
      tokensPerInterval: 100,
    },
  },
}
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set security headers (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS configured properly
- [ ] Environment variables not in code
- [ ] Regular dependency updates
- [ ] Monitoring and alerting setup
- [ ] Backup strategy implemented
- [ ] Incident response plan

## Performance Optimization

### Caching Strategy

```bash
# Cache charities/strategies (60 seconds)
# Cache portfolios (30 seconds)
# No cache on real-time data

# Set in API routes:
response.headers.set('Cache-Control', 'public, s-maxage=60')
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_donations_wallet ON donations(from_wallet);
CREATE INDEX idx_trades_strategy ON trades(strategy_id);
CREATE INDEX idx_charities_verified ON charities(verified);
```

## Rollback Plan

```bash
# Revert to previous version
git revert HEAD
npm run build
vercel deploy --prod

# Or use PM2
pm2 save
pm2 restart donate-protocol
```

## Support

- **Documentation**: https://donate-protocol.com/docs
- **Issues**: GitHub Issues
- **Discussion**: GitHub Discussions
- **Email**: support@donate-protocol.com

---

**Last Updated**: May 2026
**Version**: 0.1.0
