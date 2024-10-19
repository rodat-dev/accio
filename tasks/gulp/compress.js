import gulp from "gulp";
import gulpBrotli from "gulp-brotli";

async function compressWithBrotli(sources, dist) {
    return gulp.src(sources, { buffer: false })
            .pipe(gulpBrotli.compress({
                extension: "brotli",
                skipLarger: true
            }))
            .pipe(gulp.dest(dist));
}

export default compressWithBrotli;