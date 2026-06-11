# Source Import Access

Asset Studio can generate infographic images from a public article URL, pasted article text, chart data, or image notes.

## Protected PMM Space pages

Vercel-protected pages cannot be imported from a plain URL because the server fetch receives the login wall instead of the article.

Use one of these paths:

1. Paste the article body into **Create from source**.
2. Save the page body as text/HTML and paste the readable content.
3. Ask the workspace owner for an AI-accessible share link.

## AI-accessible share links

For Vercel-hosted PMM Space pages, an owner can create a **Protection Bypass for Automation** secret and append it to the URL:

```text
https://example.vercel.app/article.html?x-vercel-protection-bypass=SECRET
```

Treat this secret like a password. Do not post it in broad channels, docs, tickets, screenshots, or exported assets. Rotate it if it is shared too widely.
