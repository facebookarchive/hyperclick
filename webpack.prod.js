const webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');

const config = require('./webpack.config.js');

config.plugins = config.plugins.concat([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  new BabiliPlugin(),
  ...config.plugins,
]);

module.exports = config;
