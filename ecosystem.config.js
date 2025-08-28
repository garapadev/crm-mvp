module.exports = {
  apps: [
    {
      name: 'crm-web',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
      cwd: '/opt/gdev/crm-mvp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        REDIS_URL: process.env.REDIS_URL
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        REDIS_URL: process.env.REDIS_URL
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/crm-web-error.log',
      out_file: './logs/crm-web-out.log',
      log_file: './logs/crm-web.log',
      time: true
    }
  ],
  
  deploy: {
    production: {
      user: 'app',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/crm-mvp.git',
      path: '/opt/gdev/crm-mvp',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy': 'npm ci && npm run build && npm run db:migrate && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install git -y',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://crm_user:crm_password@localhost:5432/crm_mvp',
        NEXTAUTH_URL: 'https://your-domain.com',
        NEXTAUTH_SECRET: 'your-nextauth-secret-here-prod',
        REDIS_URL: 'redis://localhost:6379'
      }
    },
    staging: {
      user: 'app',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/crm-mvp.git',
      path: '/opt/gdev/crm-mvp-staging',
      'post-deploy': 'npm ci && npm run build && npm run db:migrate && pm2 reload ecosystem.config.js --env staging && pm2 save',
      env: {
        NODE_ENV: 'staging',
        DATABASE_URL: 'postgresql://crm_user:crm_password@localhost:5432/crm_mvp_staging',
        NEXTAUTH_URL: 'https://staging.your-domain.com',
        NEXTAUTH_SECRET: 'your-nextauth-secret-here-staging',
        REDIS_URL: 'redis://localhost:6379'
      }
    }
  }
}