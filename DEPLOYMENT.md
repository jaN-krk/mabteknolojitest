# Deployment status

This repository contains the MAB Teknoloji source and optimized public assets. No production deployment has been performed.

## Current runtime

The application uses React and Next App Router APIs through **Vinext on Cloudflare Workers**, with **D1** for content/enquiries and **R2** for private attachments. `npm run build` currently creates a Worker build, not a standard Vercel Next.js deployment.

**Do not assume importing this repository into Vercel will deploy it successfully.** Vercel support requires adapting the runtime imports, database and file storage integrations, and administrator authentication. Existing `cloudflare:workers` imports and Sites trusted authentication headers cannot be used unchanged as a Vercel backend. A generic `vercel.json` or a different output directory alone does not complete that migration.

## Local setup

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env` and fill in local server-only values. Never commit `.env` or `.dev.vars` files.
3. Run `npm run build`.
4. For a new local database, apply `drizzle/0000_brave_wendigo.sql` and then `drizzle/0001_majestic_roland_deschain.sql` using Wrangler D1 with `--local --config dist/server/wrangler.json --persist-to .wrangler/state`. Existing databases containing the first schema need only the second migration.
5. Run `npm run start -- --port 4173` and open http://127.0.0.1:4173/tr .

Form storage requires DB, BUCKET and FORM_SECRET. Email notification additionally requires MAIL_API_KEY, MAIL_FROM and MAIL_TO. Accepted enquiries remain recorded if email delivery fails. Production administration requires a trusted authenticated gateway and explicitly allowed administrator identities; never accept unverified user-supplied identity headers directly from the internet.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:leads
npm run build
```

Local test reports, database contents, original image-generation work files and credentials are excluded from Git. The website uses the optimized files committed under `public/` and content committed under `content/`. References to `reports/` and `source-archive/` in development notes refer to optional local working files, not production dependencies.
