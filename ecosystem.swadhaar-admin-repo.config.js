module.exports = {
  apps: [
    {
      name: 'swadhaar-admin-repo',
      script: 'node_modules/.bin/next',
      args: `start -p ${process.env.PORT || 3004}`,
      cwd: 'apps/swadhaar-admin-repo',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
