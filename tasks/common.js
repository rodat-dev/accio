import { DIST } from "./constants.js";
import gulp from "gulp";
import through2 from "through2";
import upath from "upath";

/**
* @description adds fonts and preconnect URLs to manifest for caching by SW
* @param {NodeJS.WritableStream | string | undefined} manifest
* @param {string} assetUrl
*/
export function addToManifest(manifest, assetUrl) {
    if(!manifest) return;
    return new Promise((resolve, reject) => {
        gulp.src(upath.resolve(DIST, "**", manifest))
        .pipe(through2.obj((file, _, cb) => {
            if(file.isBuffer) {
                const parsedManifest = JSON.parse(file.contents.toString());
                parsedManifest[assetUrl] = assetUrl;
                file.contents = Buffer.from(JSON.stringify(parsedManifest, null, "\t"));
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(DIST))
        .on("finish", resolve).on("error", reject);
    });
}