const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/index.tsx",
    module: {
        rules: [
            {
                test: /\.(tsx|ts)$/,
                exclude: /node_modules/,
                use: ["babel-loader", "eslint-loader", "ts-loader"]
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
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        path: path.resolve(__dirname, "dist/"),
        publicPath: "/",
        filename: "bundle.js",
        clean: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: __dirname + "/public/index.html",
            filename: "index.html",
            inject: "body"
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: __dirname + "/public/assets/images", to: "./assets/images" },
                { from: __dirname + "/public/favicon.ico", to: "./" },
                { from: __dirname + "/public/site.webmanifest", to: "./" }
            ]
        })
    ]
};