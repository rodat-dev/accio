import gulp from "gulp";
import { JSDOM } from "jsdom";
import through2 from "through2";
import { DIST } from "../constants.js";
import { addToManifest } from "../common.js";

/** 
 * @class Font
 * @classdesc Base class for Fonts
 */
class Font {
    /** @type {string} manifest - the name of the `manifest` file. Likely manifest.json, if undefined the fonts are not added to manifest */
    manifest;
    /** @type { { url: string, crossOrigin: boolean } | string} #preconnectLinks - links to preconnect, where appropriate */
    preconnectLinks;
    /** @type {string} [fontLink] - the font preconnect link, derived from base URLs and `font` */
    fontLink;
    
    constructor(manifest,preconnectLinks,fontLink) {
        this.manifest = manifest;
        this.preconnectLinks = preconnectLinks;
        this.fontLink = fontLink;
    }

    /** 
     * @method addFont adds a font url
     * @param {Document} document 
     */
    addPreconnectLinks(document) {
        if(!this.preconnectLinks || this.preconnectLinks.length === 0) {
            console.warn("no preconnect link added...");
            return;
        }

        let preconLink;
        this.preconnectLinks.forEach(link => {
            if(!document.querySelector(`link[href='${link}']`)) {
                preconLink = document.createElement("link");
                preconLink.rel = "preconnect";
                if(typeof link === "object" && "crossOrigin" in link) {
                    preconLink.crossOrigin = "";
                    preconLink.href = link.url;
                } else {
                    preconLink.href = link;
                }
                document.head.append(preconLink);
            }
        });
    }

     /** 
     * @method addPreconnectLink adds a preconnect link if available     
     * @param {Document} document 
     */
    addFont(document) {
        if(!document.querySelector(`link[href='${this.fontLink}']`)) {
            const fontLink = document.createElement("link");
            fontLink.rel = "stylesheet";
            fontLink.href = this.fontLink;
            document.head.append(fontLink);
        }
    }
}

/** 
 * @class FontsBunny
 * @classdesc implementation of Font for 'fonts.bunny.net'
 * */
export class FontsBunny extends Font {
    static FONTBUNNY_BASEURL = "https://fonts.bunny.net";
    static FONTBUNNY_FONTFAMILY_PATH = "/css?";

    constructor(font, manifest) {
        super(
            manifest, 
            [FontsBunny.FONTBUNNY_BASEURL], 
            FontsBunny.FONTBUNNY_BASEURL + FontsBunny.FONTBUNNY_FONTFAMILY_PATH + font
        );
    }
}

export class GoogleFont extends Font {
    static GOOGLEAPIS_URL = "https://fonts.googleapis.com";
    static GSTATIC_URL = "https://fonts.gstatic.com";
    static GFONT_BASE_URL = "https://fonts.googleapis.com/css2?"

    constructor(font, manifest) {
        super(
            manifest, 
            [GoogleFont.GOOGLEAPIS_URL, { url: GoogleFont.GSTATIC_URL, crossOrigin: true }], 
            GoogleFont.GFONT_BASE_URL + font
        );
    }
}

/**
 * @param {Font[]} fonts
 * @param {string} manifest - the manifest name
 * if undefined the fonts are not added to the manifest
 */
function addFontsToHead(fonts, manifest) {
    return through2.obj(async function(file, _, cb) {
        if(file.isBuffer) {
            let manifestStream;
            const dom = new JSDOM(file.contents.toString());    
            const document = dom.window.document;
            
            for(const f of fonts) {
                f.addPreconnectLinks(document);
                f.addFont(document);
                await addToManifest(manifest, f.fontLink);
            }

            if(manifestStream) manifestStream.pipe(gulp.dest(DIST));
            file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
    });
}

export default addFontsToHead;