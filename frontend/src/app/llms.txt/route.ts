import { PRODUCT, SITE_NAME, TAGLINE, absoluteUrl } from "@/lib/seo/site";

// llms.txt (https://llmstxt.org): an H1, a blockquote summary, then link lists.
// No major engine documents using it; it is cheap and built from the same facts
// as the pages, so it cannot drift from them.
export function GET() {
  const body = `# ${SITE_NAME}

> ${PRODUCT.summary}

${SITE_NAME} — "${TAGLINE}". ${PRODUCT.audience}

Key facts:
${PRODUCT.features.map((feature) => `- ${feature}`).join("\n")}

## Docs

- [What is ${SITE_NAME}?](${absoluteUrl("/about")}): how it works, who it is for, and answers to common questions
- [${SITE_NAME} web app](${absoluteUrl("/")}): sign in or create an account to start a commitment
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
