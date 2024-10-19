import gulp from "gulp";
import { deleteAsync } from "del";
import compressWithBrotli from "./tasks/gulp/compress.js";
import { buildCss, buildSass } from "./tasks/gulp/styles.js";
import gulpImport from "./tasks/gulp/fetch.js";
import generateManifest from "./tasks/gulp/manifest.js";

gulp.task("init:clean", function() {
    return deleteAsync(["dist/**/*"]);
})

gulp.task("build:sass", function() {
    return buildSass("src/styles/**/*.{sass,scss}", "dist/");
});

gulp.task("build:css", function() {
    return buildCss("src/styles/**/*.css", "dist/");
});

gulp.task("fetch:normalize", function() {
    return gulpImport("https://cdn.jsdelivr.net/npm/modern-normalize/modern-normalize.css", "src/styles/", "normalize.css");
});

gulp.task("compress:css", function() {
    return compressWithBrotli("dist/*.css", "dist/");
});

gulp.task("compress:html", function() {
    return compressWithBrotli("dist/*.html", "dist/");
});

gulp.task("pwa:gen-manifest", function() {
    return generateManifest(["/index.css", "/index.html", "/index.js"], "dist/", "src/pages/**/*.html");
});

gulp.task("watch:sass", function(cb) {
    gulp.watch("src/styles/**/*.{sass,scss}", gulp.series("build:sass"));
    cb();
});

gulp.task("compress:all", function(cb) {
    gulp.series("compress:css", "compress:html");
    cb();
})

export default gulp.series(
    "init:clean",
    "fetch:normalize",
    "build:sass",
    "pwa:gen-manifest",
    "watch:sass"
);