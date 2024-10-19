import gulp from "gulp";
import file from "gulp-file";

async function gulpImport(href, dist, fileName) {
    const res = await fetch(href);
    if(!res.ok) {
        const errMessage = `failed to fetch: ${res.statusText}`;
        console.error(errMessage);
        throw new Error(errMessage);
    }

    const contents = await res.text();
    return file(fileName, contents, { src: true })
        .pipe(gulp.dest(dist));
}

export default gulpImport;