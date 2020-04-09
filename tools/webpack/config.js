const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

// Setup the plugins for development/production.
const getPlugins = () => {
  // Common
  const plugins = [
    new webpack.DefinePlugin({
      BASEURL: isDev ? '"http://localhost:8000"' : `"${process.env.HOST}"`,
    }),
    new ManifestPlugin({
      fileName: path.resolve(process.cwd(), 'dist/webpack-assets.json'),
      filter: (file) => file.isInitial,
    }),
    new ExtractCssChunks({
      // Don't use hash in development, we need the persistent for "renderHtml.js"
      filename: isDev ? '[name].css' : '[name].[contenthash:8].css',
      chunkFilename: isDev ? '[id].css' : '[id].[contenthash:8].css',
    }),
    new webpack.ProgressPlugin(),
  ];

  if (isDev) {
    // Development
    plugins.push(
      new webpack.HotModuleReplacementPlugin()
    );
  } else {
    plugins.push(
      // Production
      new webpack.HashedModuleIdsPlugin(),
      new CompressionPlugin({
        test: /\.(js|css|html)$/,
        threshold: 10240,
      })
    );
  }

  return plugins;
};

// Setup the entry for development/production.
const getEntry = () => {
  // Development
  let entry = [
    // Allow for hot reloading CSS changes.
    'webpack-hot-middleware/client',
    // Our client JS entrypoint.
    './client/index.js'
  ];

  // production
  if (!isDev) {
    entry = ['./client/index.js'];
  }

  return entry;
};

// Loaders for CSS and SASS.
const getStyleLoaders = ({cssModules, postCss, sass}) => {
  // These are both booleans.
  const loaderCount = postCss + sass;

  const loaders = [
    {
      loader: ExtractCssChunks.loader,
      options: {
        hmr: isDev,
        // If hmr does not work, this is a forceful method.
        reloadAll: true,
      },
    },
    {
      loader: 'css-loader',
      options: {
        importLoaders: loaderCount,
        modules: cssModules && {
          localIdentName: isDev ? '[name]__[local]' : '[hash:base64:5]',
          context: path.resolve(process.cwd(), 'client'),
        },
        sourceMap: true,
      },
    },
  ];

  if (postCss) {
    loaders.push({ loader: 'postcss-loader', options: { sourceMap: true } });
  }

  if (sass) {
    loaders.push({ loader: 'sass-loader', options: { sourceMap: true } });
  }

  return loaders;
};

module.exports = {
  mode: isDev ? 'development' : 'production',
  plugins: getPlugins(),
  entry: getEntry(),
  output: {
    filename: 'main.js',
    path: path.resolve(process.cwd(), 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: getStyleLoaders({cssModules: true, postCss: true, sass: false}),
      },
      {
        test: /\.(scss|sass)$/,
        exclude: /node_modules/,
        use: getStyleLoaders({cssModules: true, postCss: true, sass: true}),
      },
      {
        test: /\.css$/,
        include: /node_modules/,
        use: getStyleLoaders({cssModules: false, postCss: false, sass: false}),
      },
    ]
  },
};
