import gulp from "gulp";
import * as sass from "sass";
import gulpSass from "gulp-sass";
const sassPlugin = gulpSass(sass);

import postcss from "gulp-postcss";
import postcssPresetEnv from "postcss-preset-env";
import autoprefixer from "autoprefixer";
import cssnanoPlugin from "cssnano";

const postcssPlugins = [
    postcssPresetEnv(),
    autoprefixer(),
    cssnanoPlugin()
];

async function buildSass(sources, dist) {
    return gulp.src(sources)
        .pipe(sassPlugin().on("error", sassPlugin.logError))
        .pipe(postcss(postcssPlugins))
        .pipe(gulp.dest(dist));
}

async function buildCss(sources, dist) {
    return gulp.src(sources)
        .pipe(postcss(postcssPlugins))
        .pipe(gulp.dest(dist));
}

export { buildCss, buildSass };