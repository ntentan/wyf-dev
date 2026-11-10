import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir, extensions) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { recursive: true })
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            const basename = path.basename(file);
            return extensions.includes(ext) && !basename.startsWith('_') && !basename.endsWith('.min.js');
        })
        .map(file => path.resolve(dir, file));
}

const wyfDevScssDir = path.resolve(__dirname, 'vendor/ntentan/wyf-dev/scss');

// Collect SCSS/CSS from wyf-dev/scss, assets/scss, and assets/css
const appStyles = [
    ...getFiles(wyfDevScssDir, ['.scss', '.sass', '.css']),
    ...getFiles(path.resolve(__dirname, 'assets/scss'), ['.scss', '.sass']),
    ...getFiles(path.resolve(__dirname, 'assets/css'), ['.css'])
];

const wyfDevJsDir = path.resolve(__dirname, 'vendor/ntentan/wyf-dev/js');
const bootJs = path.resolve(wyfDevJsDir, 'boot.js');
const fzuiDistDir = path.resolve(__dirname, 'vendor/ekowabaka/ui/dist');

export default (env, argv) => {
    const isProduction = argv.mode === 'production' || (!argv.mode && process.env.NODE_ENV === 'production');

    return {
        mode: isProduction ? 'production' : 'development',
        devtool: 'source-map',
        optimization: {
            minimize: false,
        },
        entry: {
            app: [
                ...appStyles,
                bootJs,
            ],
        },
        output: {
            path: path.resolve(__dirname, 'public'),
            filename: 'js/app.js',
            library: {
                name: 'app',
                type: 'umd',
            },
            globalObject: 'typeof self !== "undefined" ? self : this',
        },
        resolve: {
            alias: {
                'app$': path.resolve(__dirname, 'src/js/main.js'),
                'app': path.resolve(__dirname, 'src/js'),
                [path.resolve(wyfDevJsDir, 'app/index')]: path.resolve(__dirname, 'src/js/main.js'),
                'boot$': bootJs,
                'boot': bootJs,
                'fzui$': path.resolve(__dirname, 'vendor/ekowabaka/ui/js/fzui.js'),
                'fzui': path.resolve(__dirname, 'vendor/ekowabaka/ui/js'),
                '@ekowabaka/ui$': path.resolve(__dirname, 'vendor/ekowabaka/ui/js/fzui.js'),
                '@ekowabaka/ui': path.resolve(__dirname, 'vendor/ekowabaka/ui/js'),
                'wyf-dev$': path.resolve(wyfDevJsDir, 'wyf.js'),
                'wyf-dev': wyfDevJsDir,
                'wyf$': path.resolve(wyfDevJsDir, 'wyf.js'),
                'wyf': wyfDevJsDir,
                [path.resolve(__dirname, 'vendor/ekowabaka/ui/sass/fzui.scss')]: false,
            },
        },
        module: {
            rules: [
                {
                    test: /\.(s[ac]ss|css)$/i,
                    include: [path.resolve(__dirname, 'vendor/ekowabaka/ui/js')],
                    type: 'asset/source',
                    use: ['sass-loader'],
                },
                {
                    test: /\.s[ac]ss$/i,
                    include: [
                        wyfDevScssDir,
                        path.resolve(__dirname, 'assets/scss'),
                        path.resolve(__dirname, 'assets/css'),
                    ],
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.css$/i,
                    include: [
                        wyfDevScssDir,
                        path.resolve(__dirname, 'assets/scss'),
                        path.resolve(__dirname, 'assets/css'),
                    ],
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'css/app.css',
            }),
            new CopyPlugin({
                patterns: [
                    // Copy main fzui.css (raw or minified) as public/css/fzui.css
                    {
                        from: path.resolve(fzuiDistDir, isProduction ? 'fzui.min.css' : 'fzui.css'),
                        to: 'css/fzui.css',
                        noErrorOnMissing: true,
                    },
                    // Copy modular CSS files from vendor/ekowabaka/ui/dist/css into public/css
                    {
                        from: path.resolve(fzuiDistDir, 'css'),
                        to: ({ absoluteFilename }) => {
                            const basename = path.basename(absoluteFilename);
                            const cleanName = isProduction ? basename.replace(/\.min\.css$/, '.css') : basename;
                            return `css/${cleanName}`;
                        },
                        filter: (filepath) => {
                            const isMin = filepath.endsWith('.min.css');
                            return isProduction ? isMin : (!isMin && filepath.endsWith('.css'));
                        },
                        noErrorOnMissing: true,
                    },
                ],
            }),
        ],
    };
};
