import upath from "upath";
import gulp from "gulp";
import { JSDOM } from "jsdom";
import through2 from "through2";
import * as sass from "sass";
import _gulpSass from "gulp-sass";
const gulpSass = _gulpSass(sass);

import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnanoPlugin from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import { addToManifest } from "../common.js";

/**
 * 
 * @param {Stylesheet[]} stylesheets
 * @param {StyleOptions} options 
 * @returns 
 */
export function addStylesToHead(stylesheets, options) {
    return through2.obj(function (file, _, cb) {
        if (file.isBuffer) {
            const { preprocess, postprocess, minify, dist, manifest } = options;
            const dom = new JSDOM(file.contents.toString());
            const document = dom.window.document;

            // Array to hold all stream processes
            const tasks = stylesheets.map(({ sheet, isCritical }) => {
                return new Promise((resolve, reject) => {
                    let stream;

                    // Preprocessing (Sass)
                    if (preprocess === "sass") {
                        stream = gulp.src(sheet)
                            .pipe(gulpSass().on("error", gulpSass.logError));
                    }

                    // Postprocessing (PostCSS)
                    if (postprocess === "postcss") {
                        const plugins = [
                            autoprefixer(),
                            postcssPresetEnv()
                        ];
                        if (minify) plugins.push(cssnanoPlugin());

                        if (!stream) {
                            stream = gulp.src(sheet);
                        }
                        stream = stream.pipe(postcss(plugins));
                    }

                    // Handle critical vs non-critical CSS
                    if (isCritical) {
                        // Critical CSS: Inline in <style> tag
                        stream.pipe(through2.obj((f, _, cb) => {
                            if (f.isBuffer) {
                                const styleTag = document.createElement("style");
                                styleTag.textContent = f.contents.toString();
                                document.head.append(styleTag);
                                file.contents = Buffer.from(dom.serialize());
                            }
                            cb();
                        })).on('finish', resolve).on('error', reject);
                    } else {
                        // Non-Critical CSS: Link to external CSS file
                        stream.pipe(gulp.dest(dist || upath.resolve(process.cwd(), "dist")))
                            .on('finish', () => {
                                const link = document.createElement("link");
                                link.rel = "stylesheet";
                                let fileExt = upath.extname(upath.basename(sheet));
                                if(fileExt.endsWith("sass") || fileExt.endsWith("scss")) {
                                    fileExt = ".css";
                                }
                                link.href = upath.changeExt(upath.basename(sheet), fileExt);
                                document.head.append(link);
                                file.contents = Buffer.from(dom.serialize());
                                addToManifest(manifest, "/" + link.href).then(resolve).catch(reject);
                            })
                            .on('error', reject);
                    }
                });
            });

            // Ensure all streams have finished before completing the task
            Promise.all(tasks)
                .then(() => cb(null, file))
                .catch(err => cb(err));
        } else {
            cb(null, file);
        }
    });
}