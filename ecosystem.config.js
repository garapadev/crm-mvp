module.exports = {
  apps: [
    {
      name: 'crm-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      cwd: 'c:/projetos/mvp28',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: 'postgresql://crm_user:crm_password@localhost:5432/crm_mvp',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'your-nextauth-secret-here-dev',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: './logs/crm-web-error.log',
      out_file: './logs/crm-web-out.log',
      log_file: './logs/crm-web.log',
      time: true,
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', '.next', 'logs'],
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
    },
    {
      name: 'crm-webhook-worker',
      script: './src/workers/webhook-worker.js',
      cwd: 'c:/projetos/mvp28',
      env: {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://crm_user:crm_password@localhost:5432/crm_mvp',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: './logs/webhook-worker-error.log',
      out_file: './logs/webhook-worker-out.log',
      log_file: './logs/webhook-worker.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
    },
    {
      name: 'crm-email-sync',
      script: './src/workers/email-sync-worker.js',
      cwd: 'c:/projetos/mvp28',
      env: {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://crm_user:crm_password@localhost:5432/crm_mvp',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: './logs/email-sync-error.log',
      out_file: './logs/email-sync-out.log',
      log_file: './logs/email-sync.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      cron_restart: '0 */4 * * *', // Reiniciar a cada 4 horas
      kill_timeout: 5000,
    }
  ],
  
  deploy: {
    production: {
      user: 'app',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/crm-mvp.git',
      path: '/home/app/crm-mvp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}