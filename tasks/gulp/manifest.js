import gulp from "gulp";
import file from "gulp-file";
import gulpIf from "gulp-if";
import through2 from "through2";
import { JSDOM } from "jsdom";

async function injectManifestToHtml(htmlSrc, dist) {
    return gulp.src(htmlSrc)
        .pipe(through2.obj(function(file, _, cb) {
            if(file.isBuffer) {
                const dom = new JSDOM(file.contents.toString());
                const document = dom.window.document;

                const manifestLink = document.createElement("link");
                manifestLink.rel = "manifest";
                manifestLink.href = "manifest.json";
                document.head.append(manifestLink);
                file.contents = Buffer.from(dom.serialize());
                cb(null, file);
            } else {
                cb();
            }
        }))
        .pipe(gulp.dest(dist));
}

async function generateManifest(assets, dist, injectToHtmlSrc) {
    let manifestJson = {};
    assets.forEach(asset => {
        manifestJson[asset] = asset;
    })

    const contents = JSON.stringify(manifestJson, null, "\t");
    return Promise.all([
        new Promise((resolve, reject) => {
            try {
                const stream = file("manifest.json", contents, { src: true })
                .pipe(gulp.dest(dist));
                resolve(stream);
            } catch(err) {
                reject(err);
            }
        }),
        injectToHtmlSrc ? 
            new Promise((resolve, reject) => {
                injectManifestToHtml(injectToHtmlSrc, dist)
                    .then(res => resolve(res))
                    .catch(err => reject(err))
            })
            : Promise.resolve()
    ]);
}

export default generateManifest;