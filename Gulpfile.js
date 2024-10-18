'use strict;'
import { deleteAsync } from "del";
import gulp from "gulp";
import fs from "node:fs";
import process from "node:process";
import addFontsToHead, { GoogleFont } from "./tasks/builder/fonts.js";
import { addStylesToHead } from "./tasks/builder/styles.js";
import { addServiceWorker, addSpeculationRules } from "./tasks/builder/performance.js";
import { DIST } from "./tasks/constants.js";
import { bundleJavascript } from "./tasks/builder/javascript.js";
import "./tasks/builder/manifest.js";
import { generateBaseManifest } from "./tasks/builder/manifest.js";

const NORMALIZECSS_LINK = "https://cdn.jsdelivr.net/npm/modern-normalize/modern-normalize.css";
const STYLES_ROOT = "./src/styles/";

gulp.task("init:cleanup", async function(cb) {
  await deleteAsync(["build/**/*", "dist/**/*"]);
  cb();
});

gulp.task("build:manifest-base", generateBaseManifest);

gulp.task("css:normalize", async function(cb) {
  const maybeContents = fs.existsSync(STYLES_ROOT + "modern-normalize.css");
  if(!maybeContents || maybeContents.length === 0) {
    const ncssResponse = await fetch(NORMALIZECSS_LINK, { method: "GET" });
    if(!ncssResponse.ok) {
      console.error(`error fetching CSS normalize: ${ncssResponse.statusText}`);
      process.exit(1);
    }
    console.info("successfully fetched normalize.css...");
    fs.writeFileSync(STYLES_ROOT + "modern-normalize.css", await ncssResponse.text());
  }
  cb();
});

gulp.task("build:index", function() {
  return gulp.src("src/pages/index.html")
    .pipe( addFontsToHead([
        new GoogleFont("family=Agdasima:wght@400;700")
      ], "manifest.json")
    )
    .pipe(
      addStylesToHead([{ sheet: "src/styles/index.sass", isCritical: true }], {
        manifest: "manifest.json",
        preprocess: "sass",
        postprocess: "postcss",
        dist: DIST,
        minify: true
      })
    )
    .pipe(addSpeculationRules())
    .pipe(addServiceWorker())
    .pipe(bundleJavascript([
      "src/index.js"
    ]))
    .pipe(gulp.dest(DIST))
});

gulp.task("app:watch-index", function(cb) {
  gulp.watch(
    STYLES_ROOT + "**/*.{sass,scss}",
    gulp.series("build:index")
  );
  gulp.watch(
    "src/**/*.js",
    gulp.series("build:index")
  );
  cb();
});

export default gulp.series(
  "init:cleanup",
  "css:normalize",
  "build:manifest-base",
  "build:index",
  "app:watch-index"
);