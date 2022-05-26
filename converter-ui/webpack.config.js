const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.css$/i,
        use: [
           'style-loader',
            'css-loader'
        ]
      }
    ]
  },
  devServer: {
    compress: true,
    bonjour: true,
    client: {
      logging: "log",
    },
    static: {
      directory: path.join(__dirname, 'dist')
    },
    allowedHosts: [
      'localhost', 'mylocaldomain.com'
    ],
    headers: {
      'host': 'mylocaldomain.com',
      'x-forwarded-for': '127.0.0.1',
      'x-forwarded-host': 'mylocaldomain.com',
      'x-forwarded-server': 'mylocaldomain.com'
    },
    port: 8081
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  }
};
