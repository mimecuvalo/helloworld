module.exports = {
  _comment: 'This is used by pm2 on production.',
  apps: [
    {
      name: 'helloworld',
      script: 'yarn serve:prod',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      args: '',
      // instances: 1,
      autorestart: true,
      error_file: '/dev/stderr',
      out_file: '/dev/stdout',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
