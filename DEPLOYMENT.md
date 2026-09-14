# Deployment

This repository contains the MAB Teknoloji source and optimized public assets. README is intentionally empty.

## Current runtime

The default runtime is **standard Next.js on Node.js 24**, compatible with Vercel. `vercel.json` specifies the Next.js preset, `npm ci`, `npm run build` and the `.next` output directory. Public pages, translations, blog, project brief and sitemap work without server credentials.

Optional persistent data uses D1's HTTPS query API and signed S3-compatible requests to private R2 storage. Configure `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `FORM_SECRET` as server-only Vercel environment variables. Scope credentials to the intended database and bucket.

Without storage configuration, contact and quote forms prepare an email draft in the visitor's email application. They do not claim a message was sent or stored. Once configured, accepted enquiries are stored independently of notification delivery. Attachments are limited to 3 MB to fit Vercel's multipart request limit.

## Local setup

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env` and fill in local server-only values. Never commit `.env` or `.dev.vars` files.
3. Run `npm run build`.
4. If using persistent storage, apply both SQL migrations in `drizzle/` to a new D1 database. Existing databases containing the first schema need only the second migration. Local database files are not production storage and are never uploaded.
5. Run `npm run start -- --port 4173` and open http://127.0.0.1:4173/tr .

Email notification additionally requires `MAIL_API_KEY`, `MAIL_FROM` and `MAIL_TO`. Node administration uses HTTPS Basic authentication with `ADMIN_USERNAME` and `ADMIN_PASSWORD` (at least 24 characters). Incoming identity headers are not trusted. Without configured credentials administration is denied.

The legacy native Worker setup remains available through `dev:cloudflare`, `build:cloudflare` and `start:cloudflare`, using `hosting.config.json` and native D1/R2 bindings.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:leads
node scripts/test-node-adapters.mjs
npm run build
```

Local test reports, database contents, original image-generation work files and credentials are excluded from Git. The website uses the optimized files committed under `public/` and content committed under `content/`. References to `reports/` and `source-archive/` in development notes refer to optional local working files, not production dependencies.

Implementation references: [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [D1 HTTPS API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/), [R2 signed requests](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/), [Vercel function limits](https://vercel.com/docs/functions/limitations).
