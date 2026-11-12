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
    {
      name: 'players',
      script: 'node_modules/.bin/next',
      args: 'start -p 4108',
      cwd: 'mfes/players',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
