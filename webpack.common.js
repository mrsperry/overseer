const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
    template: __dirname + "/public/index.html",
    filename: "index.html",
    inject: "body"
});

module.exports = {
    entry: "./src/components/index.tsx",
    module: {
        rules: [
            {
                test: /\.(tsx|js)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react",
                            "@babel/preset-typescript"
                        ]
                    },
                },
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.png$/i,
                exclude: /node_modules/,
                type: "asset/resource"
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".js"]
    },
    output: {
        path: path.resolve(__dirname, "dist/"),
        publicPath: "/",
        filename: "bundle.js"
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        HTMLWebpackPluginConfig,
        new ForkTSCheckerWebpackPlugin({
            async: false,
            eslint: {
                files: "./src/components/**/*",
            },
        })
    ]
};