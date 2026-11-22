# Sumit Portfolio (Vercel-ready)

A fast static portfolio: deep forest-green and cream design, smooth animations, certificate viewer.
No framework and no dependencies. A tiny build script fills in your site address so SEO tags are always correct.

## 1. Deploy to Vercel

### Option A: GitHub + Vercel dashboard (easiest)

1. Unzip this folder.
2. Create a new empty repository on GitHub and upload the folder contents
   (or run `git init`, `git add .`, `git commit -m "Portfolio"`, then push).
3. Go to <https://vercel.com/new>, choose **Import** for that repository.
4. Leave every setting as it is. `vercel.json` already sets the build command (`node build.mjs`) and output folder (`public`).
   Framework preset can stay **Other**.
5. Press **Deploy**. Every later `git push` redeploys automatically.

### Option B: Vercel CLI

```bash
npm i -g vercel      # once
vercel               # preview deployment
vercel --prod        # production deployment
```

### Your site address (important for SEO)

The build reads your production domain from Vercel (`VERCEL_PROJECT_PRODUCTION_URL`) and writes it into the
canonical link, Open Graph tags, JSON-LD, `sitemap.xml` and `robots.txt`. You do not need to edit anything.

* If you connect a custom domain later, redeploy once. Vercel then picks the shortest production domain.
* If you have more than one domain and want to choose, add an environment variable in
  **Vercel > Project > Settings > Environment Variables**: `SITE_URL` = `https://your-domain.com` (no slash at the end).
* In Settings > Environment Variables, keep **Automatically expose System Environment Variables** ticked.

## 2. After the first deploy (10 minutes)

1. Open your site, press `Ctrl+U` and check that the canonical link shows your real domain.
2. **Google Search Console** (<https://search.google.com/search-console>): add your site, verify it
   (paste the verification meta tag into the commented spot near the top of `src/index.html`), then submit `/sitemap.xml`.
3. Check security headers: <https://securityheaders.com> and <https://developer.mozilla.org/en-US/observatory>.
4. Check speed and SEO: <https://pagespeed.web.dev>. Check structured data: <https://search.google.com/test/rich-results>.
5. Test the share preview by sending your link to yourself on WhatsApp.
6. Put the link in your Instagram bio and LinkedIn profile. Links from your own profiles are the quickest way for Google to find the site.
7. Turn on **two-factor authentication** on your GitHub and Vercel accounts. This protects the site more than any header.

## 3. Security that is already in place

| What | Where | Why |
| --- | --- | --- |
| Strict Content Security Policy | `vercel.json` | Only your own scripts and styles run (plus Google Fonts). Injected code is blocked. |
| No inline scripts or styles | `src/` | Needed for the CSP above. Keep it that way when you edit. |
| HSTS | `vercel.json` | Browsers only use HTTPS for your domain. |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | `vercel.json` | Nobody can put your site in a hidden frame (clickjacking). |
| `X-Content-Type-Options: nosniff` | `vercel.json` | Stops files being treated as another type. |
| Referrer-Policy, Permissions-Policy | `vercel.json` | Shares less data; camera, microphone and location are switched off. |
| Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy | `vercel.json` | Isolates your pages from other sites. |
| `base-uri 'none'`, `form-action 'none'`, `object-src 'none'` | CSP | Closes common injection routes. |
| `rel="noopener noreferrer"` on external links | `src/index.html` | Outside sites cannot control your tab. |
| Email address is not in the HTML | `src/assets/js/main.js` | Spam bots reading the page source do not find it. |
| `.well-known/security.txt` | `src/.well-known/` | Tells researchers how to report a problem (uses your Instagram, not your email). |
| No forms, no database, no server code | whole site | Very little to attack. |
| Long cache only for fingerprinted files | `vercel.json`, `build.mjs` | Changed CSS/JS is always picked up. |

Honest limits: Google Fonts is the only outside service (allowed in the CSP). Email hiding stops simple bots, not every scraper.
Your village name and Instagram are shown publicly, as on your old site. Delete those lines in `src/index.html` if you want less public.

## 4. SEO that is already in place

* One `h1`, clean heading order, landmarks, descriptive alt text on every image, width and height set (no layout jump).
* Title and meta description with your role and city, canonical URL, `robots` meta, `robots.txt`, `sitemap.xml` (with image).
* Open Graph and Twitter cards with a 1200x630 preview image.
* JSON-LD: `Person`, `ProfilePage`, `WebSite` and your 8 certificates as credentials (city only, no street address).
* Favicons, Apple touch icon, web manifest, theme colour, custom 404 page (`noindex`).
* WebP images, lazy loading, fingerprinted CSS/JS, and the site works with JavaScript off.

## 5. Editing the site

Everything you edit is inside `src/`. Never edit `public/`; it is rebuilt on every deploy.

* **Text**: `src/index.html`
* **Colours and layout**: `src/assets/css/style.css` (colours are the variables at the top)
* **Behaviour**: `src/assets/js/main.js`
* **Add the Google "Foundations of Project Management" certificate image** (not included in the zip because the file was not provided):
  1. Save it as WebP: `src/assets/img/certs/google-project-management.webp` (about 1400 px wide) and a 640 px wide copy named `google-project-management-thumb.webp`.
  2. In `src/index.html`, find the card with `data-title="Foundations of Project Management"`, add class `has-img` to its `<li>`, and replace the `<div class="thumb thumb-text">...</div>` line with the same anchor and image markup used by the other cards.
* **Add another certificate**: copy any `<li class="cert ...">` block, change its text, `data-cat`, image names and `datetime`. Also add it to the `hasCredential` list in the JSON-LD.
* **Preview with the real security headers**: `npm start`, then open <http://localhost:4173>. If something is blocked by the CSP you will see it in the browser console.

## 6. Optional: host the fonts yourself

For slightly better privacy and speed, download Space Grotesk and Inter as `.woff2` (for example from <https://fontsource.org>), put them in `src/assets/fonts/`,
add `@font-face` rules to `style.css`, remove the two Google Fonts `<link>` lines in `src/index.html` and `src/404.html`,
and change the CSP in `vercel.json` to `font-src 'self'` and `style-src 'self'`.
