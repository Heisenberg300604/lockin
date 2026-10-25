#!/usr/bin/env node
// Checks the raw HTML a crawler receives (no JavaScript is executed) against
// the SEO contract: run it against `next start` or a deployment.
//   npm run seo:check -- http://localhost:3000
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
// Private app screens and unknown URLs that must stay out of the index.
const NOINDEX_PATHS = ["/dashboard", "/history", "/settings", "/commitments/new", "/seo-check-unknown-path"];

const failures = [];
const warnings = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", headers: { "User-Agent": "lockin-seo-check" } });
  return { status: response.status, type: response.headers.get("content-type") ?? "", body: await response.text() };
}

const all = (html, pattern) => [...html.matchAll(pattern)].map((match) => match[1]);
const metaContent = (html, name) => all(html, new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, "g"));

function checkIndexable(path, html) {
  const titles = all(html, /<title>([^<]*)<\/title>/g);
  if (titles.length !== 1 || !titles[0].trim()) fail(path, `expected one non-empty <title>, found ${titles.length}`);
  if (!metaContent(html, "description")[0]?.trim()) fail(path, "missing meta description");
  if (metaContent(html, "robots").some((value) => value.includes("noindex"))) fail(path, "indexable page carries noindex");
  if (!metaContent(html, "og:title").length || !metaContent(html, "og:image").length) fail(path, "missing og:title or og:image");

  const canonicals = all(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g);
  if (canonicals.length !== 1) fail(path, `expected one canonical, found ${canonicals.length}`);
  else {
    const canonical = new URL(canonicals[0]);
    if (canonical.protocol !== "https:") fail(path, `canonical is not absolute https: ${canonicals[0]}`);
    if ((canonical.pathname.replace(/\/$/, "") || "/") !== path) fail(path, `canonical points to ${canonical.pathname}`);
  }

  const h1s = all(html, /<h1[^>]*>/g).length;
  if (h1s > 1) fail(path, `${h1s} <h1> elements`);
  if (h1s === 0) warn(path, "no <h1> in the server HTML (content is client-rendered)");

  const blocks = all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!blocks.length) fail(path, "no JSON-LD");
  for (const block of blocks) {
    try {
      const data = JSON.parse(block);
      if (data["@context"] !== "https://schema.org") fail(path, "JSON-LD without schema.org @context");
      for (const node of data["@graph"] ?? [data]) if (!node["@type"]) fail(path, "JSON-LD node without @type");
    } catch (error) {
      fail(path, `invalid JSON-LD: ${error.message}`);
    }
  }
}

const robots = await get("/robots.txt");
if (robots.status !== 200 || !robots.type.startsWith("text/plain")) fail("/robots.txt", `status ${robots.status}, type ${robots.type}`);
else if (!/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m.test(robots.body)) fail("/robots.txt", "no absolute Sitemap line");
else if (/^Disallow: \/$/m.test(robots.body)) warn("/robots.txt", "disallows the whole site (expected only on preview deployments)");

const sitemap = await get("/sitemap.xml");
const locs = all(sitemap.body, /<loc>([^<]+)<\/loc>/g);
if (sitemap.status !== 200 || !sitemap.type.includes("xml")) fail("/sitemap.xml", `status ${sitemap.status}, type ${sitemap.type}`);
else if (!locs.length) fail("/sitemap.xml", "no <loc> entries");

for (const loc of locs) {
  const path = new URL(loc).pathname.replace(/\/$/, "") || "/";
  const page = await get(path);
  if (page.status !== 200) fail(path, `listed in sitemap but returned ${page.status}`);
  else checkIndexable(path, page.body);
}

for (const path of NOINDEX_PATHS) {
  const page = await get(path);
  if (page.status === 200 && !metaContent(page.body, "robots").some((value) => value.includes("noindex"))) fail(path, "private or unknown URL is indexable");
}

const llms = await get("/llms.txt");
if (llms.status !== 200 || !llms.body.startsWith("# ")) fail("/llms.txt", `status ${llms.status} or missing H1`);

for (const message of warnings) console.warn(`warn  ${message}`);
for (const message of failures) console.error(`FAIL  ${message}`);
console.log(`${failures.length ? "✗" : "✓"} SEO check against ${base}: ${locs.length} indexable page(s), ${failures.length} failure(s), ${warnings.length} warning(s)`);
process.exit(failures.length ? 1 : 0);
