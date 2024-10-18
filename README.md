# accio

## Best practices
Below a list of some of the best practices I've learned so far from analyzing Lighthouse and striving for the highest performance and SEO possible. These are broken down by Document Section.

### HTML
HTML static pages (and any text based document) highly benefit from compression mechanisms. Servers can opt-in to serve compressed files when available, minimizing download times without any loss of data. Multiple compression algorithms can be used, arguably `brotli` is one of the highest performing ones, and the support from Google ensures it'll remain so.

References:
- Gulpfile.js/compressDocument.js;
- dev/server.ts (Hono server serving compressed files when available and the client accepts them);

### Head
The head is a critical part of the document, anything here is the first portion streamed by the server. This means that critical resources that are render-blocking will prevent the page to load until the browser pipeline has processed them. There are many strategies to improve on this, from simplest to most complex:
- inline critical scripts and styles. Any critical scripts/styles can and should be inlined so the client does not have to perform an additional fetch to retrieve them before render.
- any external connections benefit from a `<link rel="preconnect" href="example.com" />` to ensure that a preconnection is established and therefore minimizing the impact of potential multiple network calls during the rendering pipeline (such as CORS options);

- from an SEO standpoint, three main meta tags matter:
    -> `<meta name="description" content="a meaningful description" />`
    -> `<title>Website title</title>`
    -> `<meta name="viewport" content="width=device-width, initial-scale=1">` - to ensure that mobile devices render the page to the width of the device; not more, not less.

### Body - HTML
The body should use semantically apropriate HTML. This means using `<nav>`, `<aside>`, `<section>`, `<article>`, `<header>`, `<main>`... instead of the usual `<div>`. Text should use text tags such as `<p>`, `<h1>`, `<h2>`... emphasis and text-style should be done in CSS rather than relying on HTML tags. This means you should use `<b>` for important text, `<i>` for italic emphasis, but rely on CSS styling for the actual text-style.
Avoid using `<div>` or `<span>` for anything that has a semantically more appropriate option in HTML (such as a `<button>`). If you need custom styling, consider applying `appearance: none` an using pseudo elements such as `::after` and `::before`.

### Body - JS
Pay particular attention to the `<script>` tag. Ideally move script tags to the bottom of the body section, although this is not necessary in deferred tags it still enforces the idea that the script is non-critical and non-blocking. Mark the script as `defer` or `type='module'` for non-critical rendering JS. If your Javascript is critical and needed before rendering, consider whether its purpose can be replaced with CSS, maybe `@keyframe` animations or other mechanisms. Leverage as many of the available browser processes as you possibly can.

#### Additional
- Use web workers where appropriate. In specific Service Workers for resource caching and offline functionality. Web workers can perform computations outside of the main thread, keeping it unblocked.
- If you can use dynamic imports and speculative loading of resources you `SHOULD`. There's no need to have all libraries imported at the top when you can just import them on specific user interactions. This is especially true on desktop where `hover` is an indication of intent. Mobile is trickier but you can make some assumptions. A very simple one to make is `not loading JS for the logout button until a first page interaction after the user has logged in`. It's highly unlikely a user will logout just after logging in.
- For both CSS and JS make sure you pay attention to browser compatibility. Use tools like `autoprefixer` for CSS and `babel`, `swc` for JS compilation. `browserslist` will be your best friend in having a simple way to state which browser vendors you want to be compatible with.
- The modularity you apply to JS, apply it to CSS. It's a rich language and it should be a first thought. By becoming proficient in CSS (especially modern CSS) you will realise that you likely don't need a javascript framework. Look into tools like `postcss` and preprocessors like `Sass` or `Stylus` or `Less`. 

- Minify your JS and CSS, and opt to use CDN for external script loading, including images/svgs/fonts... There are amazing CDNs for JS such as `unpkg`, `skypack`, `esm.sh`... all these have very efficient caching strategies too, especially with version pinning and it will speed up your app's loading times. Add a type declaration with `--save-dev` type modules added so you can still benefit from types.

- think about whether you need a Bundler. Maybe you just need a build scripter. Look into tools like `gulp` or `grunt`, try and automate your process and you'll get a much deeper understanding of web development. Likely a more performing website too.

- I prefer typescript, mostly because it gives an extra layer of strictness in code, correctness, readability (code as documentation) and maintainability. But `Javascript` with `jsdocs` or `flow` can go a long way. You can still have type modules in typescript and use them with `jsdocs`.