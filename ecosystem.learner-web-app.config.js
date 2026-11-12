module.exports = {
  apps: [
    {
      name: 'learner-web-app',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      cwd: 'apps/learner-web-app',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
