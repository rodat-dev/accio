import upath from "upath";
import through2 from "through2";
import { JSDOM } from "jsdom";
import { DIST, MANIFEST } from "../constants.js";
import { addToManifest } from "../common.js";
import { rollup } from "rollup";
import rollupBabel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";

export function bundleJavascript(scripts) {
    return through2.obj(async function (file, _, cb) {
        if (!file.isBuffer) {
            cb(null, file);
            return;
        }

        const dom = new JSDOM(file.contents.toString());
        const document = dom.window.document;
        await Promise.all([
            Promise.all(
                scripts.map(script =>
                    rollup({
                        input: script,
                        plugins: [
                            rollupBabel({
                                presets: ["@babel/preset-env"],
                                babelHelpers: "bundled",
                                exclude: "node_modules/**",
                                comments: false,
                            }),
                            terser()
                        ]
                    }).then(bundle =>
                        bundle.write({
                            file: upath.resolve(DIST, upath.basename(script)),
                            format: "esm",
                            strict: true
                        })
                    )
                )
            ),
            Promise.all(
                scripts.map(script => {
                    const scriptFilename = upath.basename(script);
                    const htmlScript = document.createElement("script");
                    htmlScript.type = "module";
                    htmlScript.src = scriptFilename;
                    document.body.append(htmlScript);

                    // Modify the file contents
                    file.contents = Buffer.from(dom.serialize());

                    // Add to the manifest
                    return addToManifest(MANIFEST, "/" + scriptFilename);
                })
            )
        ])
        .then(() => cb(null, file))
        .catch(err => cb(err, null));
    });
}