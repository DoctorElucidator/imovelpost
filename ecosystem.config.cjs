// PM2 process configuration for ImóvelPost API server.
// Run: pm2 start ecosystem.config.cjs
// Then: pm2 save && pm2 startup (to auto-start on reboot)

module.exports = {
  apps: [
    {
      name: "imovelpost-api",
      script: "./artifacts/api-server/dist/index.mjs",
      interpreter: "node",
      node_args: "--enable-source-maps",
      env: {
        NODE_ENV: "production",
        PORT: "8080",
        // Set DATABASE_URL and OPENAI_API_KEY in a .env file or directly here
        // DATABASE_URL: "postgresql://user:password@localhost:5432/imovelpost",
        // OPENAI_API_KEY: "sk-...",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
