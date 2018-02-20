var path = require('path');
var webpack = require('webpack');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin'); 
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var ROOT_PATH = path.resolve(__dirname);
var SRC_PATH = path.resolve(ROOT_PATH, 'src');
var BUILD_PATH = path.resolve(ROOT_PATH, 'dist');

module.exports = {
    entry: {
        app: path.resolve(SRC_PATH, 'index.ts'),
    },

    output: {
        filename: '[name].bundle.js',
        path: BUILD_PATH
    },

    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: ['babel-loader', 'awesome-typescript-loader']
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader'],
                publicPath: '../'
            }),
        }, {
            test: /\.js$/,
            enforce: 'pre',
            loader: 'source-map-loader'
        }]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({ 
            template: path.resolve(SRC_PATH, 'template/index.html'),
            filename: path.resolve(BUILD_PATH, 'index.html'), 
            hash: false,
        }),
        new ExtractTextPlugin('[name].bundle.css'),
        new CommonsChunkPlugin({
            name: 'common',
        }),
    ],

    resolve: {
        extensions: ['.js', '.ts', '.less', '.scss', '.css'],
    },

    devServer: {
        contentBase: BUILD_PATH,
        compress: true,
        inline: true,
        port: 3000,
        stats: {
            maxModules: Infinity,
        }
    },
};