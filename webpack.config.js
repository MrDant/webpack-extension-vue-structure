const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const CopyPlugin = require("copy-webpack-plugin");
const { version, license, name, description } = require("./package.json");
const ExtensionReloader = require("webpack-extension-reloader");
const webpack = require("webpack");

const pathPolyfill = require.resolve("webextension-polyfill");
const arrayCopyPlugin = [
  { from: "icons", to: "icons", ignore: ["icon.xcf"] },
  {
    from: "manifest.json",
    to: "manifest.json",
    transform: content => {
      let jsonContent = JSON.parse(content);
      jsonContent = Object.assign(jsonContent, {
        version,
        name,
        description
      });

      if (pathPolyfill) {
        Object.keys(jsonContent).map(function(key) {
          if (jsonContent[key].scripts) {
            jsonContent[key].scripts.unshift("browser-polyfill.js");
          }
        });
      } else {
        console.log(
          "\x1b[33m-------------------------------------------------------\x1b[32m \n",
          "exec :",
          "\x1b[1m",
          "npm install webextension-polyfill --save-dev;",
          "\x1b[0m\x1b[32m",
          "\n to apply a browser-polyfill extensions\n",
          "\x1b[33m-------------------------------------------------------\x1b[0m \n\n"
        );
      }

      return JSON.stringify(jsonContent, null, 2);
    }
  }
];
if (pathPolyfill) {
  arrayCopyPlugin.push({
    from: pathPolyfill,
    to: "browser-polyfill.js", // Where to copy the file in the destination folder
    flatten: true // Don't keep the node_modules tree
  });
}
const config = {
  mode: "development",
  context: __dirname + "/src",
  entry: {
    background: "./background.js",
    "popup/popup": "./popup/popup.js",
    "options/options": "./options/options.js"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    chunkFilename: "[name].js"
  },
  resolve: {
    alias: {
      vue$: "vue/dist/vue.esm.js"
    },
    extensions: ["*", ".js", ".vue", ".json"]
  },
  devtool: "inline-source-map",
  plugins: [
    new webpack.DefinePlugin({
      global: "window"
    }),
    new CopyPlugin(arrayCopyPlugin),
    new HtmlWebpackPlugin({
      filename: "options/options.html",
      template: "vue.html",
      chunks: ["options/options"]
    }),
    new HtmlWebpackPlugin({
      filename: "popup/popup.html",
      template: "vue.html",
      chunks: ["popup/popup"]
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new VueLoaderPlugin()
  ],
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all"
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loaders: "vue-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          outputPath: "./images/"
        }
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          outputPath: "./fonts/"
        }
      }
    ]
  }
};

if (process.argv.indexOf("--watch") > 0) {
  config.plugins.unshift(
    new ExtensionReloader({
      manifest: __dirname + "/src/manifest.json"
    })
  );
} else {
  config.plugins.unshift(new CleanWebpackPlugin());
}

module.exports = config;
