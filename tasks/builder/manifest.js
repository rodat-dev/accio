import gulp from "gulp";
import fs from "node:fs";
import upath from "upath";
import { DIST, PAGES } from "../constants.js";

export function generateBaseManifest() {
    console.group("[BUILD:MANIFEST-BASE]");
    return new Promise((resolve, reject) => {
        fs.glob(PAGES, function(err, matches) {
            if(err) {
                console.error(`failed to generate baseline manifest - ${err}`);
                reject(err);
            }

            let manifestEntries = {};
            for(const m of matches) {
                let value = "/" + upath.basename(m);
                manifestEntries[value] = value;
            }
            console.info("Base html entries:", manifestEntries);

            fs.writeFileSync(DIST + "manifest.json", JSON.stringify(manifestEntries, null, "\t"));
            resolve();
        });
    });
}