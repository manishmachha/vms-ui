const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const config = withModuleFederationPlugin({

  name: 'vms',

  exposes: {
    './routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' }),
  },

});

// Set publicPath to 'auto' to ensure correct asset resolution through the proxy
config.output.publicPath = 'auto';

module.exports = config;
