import gulp from "gulp";
import fs from "node:fs";
import babel from "gulp-babel";
import GulpUglify from "gulp-uglify";
import upath from "upath";
import through2 from "through2";
import { JSDOM } from "jsdom";
import { DIST, MANIFEST, SPECRULES, SW, SW_INSTALL } from "../constants.js";
import { addToManifest } from "../common.js";
import {rollup} from "rollup";
import replace from "@rollup/plugin-replace";
import rollupBabel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";

export function addServiceWorker() {
    return through2.obj(function(file, _, cb) {
        if(!file.isBuffer) {
            cb(null, file);
            return;
        }

        const dom = new JSDOM(file.contents.toString());
        const document = dom.window.document;
        const swFilename = upath.basename(SW);
        const swInstallFilename = upath.basename(SW_INSTALL);

        Promise.all([
            new Promise((resolve, reject) => {
                const manifestJson = fs.readFileSync(upath.resolve(DIST, MANIFEST), { encoding: "utf-8" });
                rollup({
                    input: SW,
                    plugins: [
                        rollupBabel({
                            presets: ["@babel/preset-env"],
                            babelHelpers: "bundled",
                            exclude: "node_modules/**",
                            comments: false,
                        }),
                        replace({
                            "process.env.MANIFEST": manifestJson,
                            preventAssignment: true
                        }),
                        terser()
                    ]
                })
                .then(bundle => bundle.write({
                        file: upath.resolve(DIST, swFilename),
                        format: "esm",
                        strict: true
                }))
                .then(resolve)
                .catch(reject);
            }),
            new Promise((resolve, reject) => {
                rollup({
                    input: SW_INSTALL,
                    plugins: [
                        rollupBabel({
                            presets: ["@babel/preset-env"],
                            babelHelpers: "bundled",
                            exclude: "node_modules/**",
                            comments: false,
                        }),
                        terser()
                    ]
                })
                .then(bundle => bundle.write({
                        file: upath.resolve(DIST, swInstallFilename),
                        format: "esm",
                        strict: true
                }))
                .then(resolve)
                .catch(reject);
            }),
            new Promise((resolve, reject) => {
                try {
                    const swScript = document.createElement("script");
                    swScript.type = "module";
                    swScript.src = swFilename;

                    const swInstallScript = document.createElement("script");
                    swInstallScript.type = "module";
                    swInstallScript.src = swInstallFilename;

                    document.body.append(swInstallScript);
                    file.contents = Buffer.from(dom.serialize());
                    resolve();
                } catch(err) {
                    console.error(`failed to add SW Install script to html - ${err}`);
                    reject(err);
                }
            }),
            addToManifest(MANIFEST, "/" + swFilename),
            addToManifest(MANIFEST, "/" + swInstallFilename)
        ])
        .then(() => cb(null, file))
        .catch(err => cb(err, null));
    });
}

export function addSpeculationRules() {
    return through2.obj(function(file, _, cb) {
        if(!file.isBuffer) {
            cb(null, file);
            return;
        }

        const dom = new JSDOM(file.contents.toString());    
        const document = dom.window.document;

        Promise.all([
            new Promise((resolve, reject) => {
            gulp.src(SPECRULES)
                .pipe(babel())
                .pipe(GulpUglify())
                .pipe(gulp.dest(DIST))
                .on("finish", resolve)
                .on("error", reject);
            }),
            new Promise((resolve, reject) => {
                try {
                    const script = document.createElement("script");
                    script.type = "module";
                    script.src = upath.basename(SPECRULES);
                    document.body.append(script);
                    file.contents = Buffer.from(dom.serialize());
                    resolve();
                } catch(err) {
                    console.error(`failed to add speculationrules.js to html - ${err}`);
                    reject(err);
                }
            }),
            new Promise((resolve, reject) => {
                addToManifest(MANIFEST, "/" + upath.basename(SPECRULES))
                    .then(resolve)
                    .catch(reject);
            })  
        ])
        .then(() => cb(null, file))
        .catch(err => cb(err, null));
    });
}