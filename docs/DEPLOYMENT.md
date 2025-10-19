# Vercel Deployment Guide

This repository now ships with a production-ready Vercel configuration. The React application is served as a static build from `client/dist`, while the Express API is deployed as a serverless function at `/api`. Follow the checklist below to launch successfully.

## 1. Prepare the Project

- Ensure the repo root is set as the **Project Directory** in Vercel (the configuration lives at `vercel.json`).
- Build command: `npm run build` (already defined in `package.json`).
- Output directory: `client/dist` (declared in `vercel.json`).
- Serverless entry point: `api/index.mjs`, exporting the Express app.

## 2. Required Environment Variables

Configure these in the Vercel dashboard (Project → Settings → Environment Variables). Use the "Production" scope for live deployments and "Preview" for preview builds.

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Connection string for your MongoDB cluster. |
| `MONGO_DBNAME` (optional) | Overrides the default database name (`builtattic_dev`). |
| `JWT_SECRET` | Secret for signing auth tokens. |
| `CORS_ORIGIN` | Comma-separated origins allowed to call the API. Leave blank to allow all. |
| `FILE_ENCRYPTION_KEY` | 64-character hex key used for encrypting uploaded assets. |
| `ASSET_TOKEN_SECRET` | Secret for temporary download tokens. |
| `REDIS_URL` (optional) | Redis connection used by queue helpers. |
| `SECRET_MANAGER_KEYS` / `SECRET_MANAGER_PROJECT` (optional) | Only required if you continue using Google Secret Manager. |
| `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, etc. | Feature-specific integrations referenced across the codebase. |

> Tip: Create a `.env.vercel` locally (ignored by Git) to mirror the Vercel configuration for local testing via `vercel dev`.

## 3. Storage Considerations

The API encrypts uploaded assets to disk. In serverless environments the filesystem is **ephemeral**. By default the storage path switches to `/tmp/builtattic-storage` on Vercel. Configure `ASSET_STORAGE_ROOT` to point to a durable provider (e.g., mounted S3 bucket via an integration or the Vercel Blob service) before enabling uploads in production.

## 4. Local Development Parity

- Run `npm install` (root) to install both the client and server dependencies via the `postinstall` hook.
- Start the Vite dev server: `npm --prefix client run dev` (or `npm run client`).
- Start the API locally: `npm --prefix server run dev` (requires `MONGO_URI`).
- For a Vercel-like experience, use `vercel dev`; it reads `vercel.json`, builds the client, and proxies `/api` to the serverless entry point.

## 5. Deploying

1. Commit and push to a branch connected to Vercel. Each push triggers a preview deployment.
2. Verify preview build logs show `npm run build` succeeded and the serverless function bundled.
3. Promote to production via the Vercel dashboard once validation passes.

## 6. Post-Deployment Checklist

- [ ] Environment variables configured for Production, Preview, and Development scopes as needed.
- [ ] MongoDB (and Redis, if used) are reachable from Vercel. Atlas works out of the box; self-hosted DBs require IP allow-lists.
- [ ] Email/SMS/webhook integrations validated using production credentials.
- [ ] Background queue workloads assessed—move long-lived workers to dedicated infrastructure if required.
- [ ] Asset storage migrated off the ephemeral filesystem.
- [ ] Optional: add custom domain and enable HTTPS from the Vercel dashboard.

---

# Google Cloud Deployment Guide

This project is now configured to run as a single container on Google Cloud Run, with build automation through Cloud Build and secrets sourced from Secret Manager. Follow the steps below to promote your local `.env` configuration into production-ready infrastructure.

## 1. Prerequisites

- **Google Cloud CLI** authenticated against your project.
- **Artifact Registry** repository ready for container images (default names used below: `$_REPOSITORY`).
- **MongoDB** instance accessible from Cloud Run (Atlas on GCP or self-managed).
- **Redis** (optional, but recommended for queues / rate limits) accessible from Cloud Run.
- **Email provider** (Gmail SMTP, SendGrid, etc.) tested with your sender.
- **Gemini API** access enabled on your chosen Google Cloud project.

## 2. Secrets & Environment Management

1. Convert server configuration into Secret Manager entries. Example:

   ```bash
   gcloud secrets create mongo-uri-secret --data-file=- <<'EOF'
   mongodb+srv://username:password@cluster.example.mongodb.net
   EOF
   ```

2. Add each secret ID to the `SECRET_MANAGER_KEYS` variable (comma-separated) in your Cloud Run deployment:

   ```
   SECRET_MANAGER_KEYS=MONGO_URI=mongo-uri-secret,JWT_SECRET=jwt-secret
   SECRET_MANAGER_PROJECT=my-gcp-project
   ```

   The new bootstrapping code pulls only secrets that are not already present as environment variables, so local overrides still work.

3. Configure non-secret values (e.g., `CORS_ORIGIN`, `LOG_LEVEL`) as standard environment variables on Cloud Run.
4. Set `API_BASE_URL` to the HTTPS origin of your Cloud Run deployment (for example `https://builtattic-xyz-uc.a.run.app`). The server will append `/api` if missing and uses this value when issuing secure download links in fulfilment emails.

## 3. Building & Running Locally

```bash
# From the repo root
docker build -t builtattic-app .
docker run --rm -p 8080:8080 \
  -e MONGO_URI="..." \
  -e JWT_SECRET="..." \
  builtattic-app
```

Static React assets are bundled during the Docker build and served by Express from `/client/dist`.

## 4. Cloud Build Pipeline

The new `cloudbuild.yaml` performs:

1. `docker build` using the multi-stage Dockerfile.
2. Pushes the image to Artifact Registry (`$_ARTIFACT_REGION-docker.pkg.dev/$PROJECT_ID/$_REPOSITORY/$_SERVICE`).
3. Deploys to Cloud Run with configurable substitutions (`_REGION`, `_SERVICE`, `_CPU`, `_MEMORY`, `_SECRET_ENV`, etc.).

Deploy manually:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_ARTIFACT_REGION=us,_SERVICE=builtattic-api
```

Or create a trigger tied to your main branch.

### Optional substitutions

- `_ENV_VARS`: comma-separated standard vars (`NODE_OPTIONS=--max-old-space-size=512,LOG_LEVEL=info`)
- `_SECRET_ENV`: secret bindings (`JWT_SECRET=projects/<project>/secrets/jwt-secret:latest`)
- `_VPC_CONNECTOR` / `_VPC_EGRESS`: connect Cloud Run to a VPC for private Mongo/Redis access.

## 5. Runtime Observability

- **Structured logs** (JSON) are emitted via Winston, automatically ingested by Cloud Logging.
- **Prometheus metrics** remain on `/metrics`; wire this into Cloud Monitoring with a scrape job if needed.
- Include `SERVICE_NAME` env var to tag logs when running multiple services.

## 6. Support Chat & SSE Notes

- SSE heartbeat interval and server keep-alive are tuned for Cloud Run (max 1 hour). Cloud Run will terminate open streams at the one-hour mark—monitor usage to ensure this is acceptable.
- `SUPPORT_WEBHOOK_SECRET` now gates the inbound webhook (`/support/chat/inbound`). Configure your email/webhook provider to send the shared header `x-support-webhook-token`.

## 7. Email & Outbound Integrations

- When deploying from Cloud Run, double-check your email provider allows the service account IP range or switch to an API-based mailer.
- Gemini access uses `GEMINI_API_KEY` from Secret Manager. Assign the Cloud Run runtime service account the `roles/secretmanager.secretAccessor` role.
- For Razorpay or other payment providers, store keys in Secret Manager and reference them via `_SECRET_ENV` in Cloud Build.

## 8. Frontend Hosting Options

By default the Express server serves the built React bundle. The client build now falls back to the same-origin `/api` endpoint when no Vite env vars are provided, so a single Cloud Run service works out of the box. Alternatives:

1. Host the bundle on Cloud Storage + Cloud CDN, set `SERVE_CLIENT_FROM_API=false`, and point your frontend to the API domain.
2. Split deployments: one Cloud Run service for API, one for SSR/client if needed.

Whichever option you choose, update `VITE_API_BASE_URL` and related variables in `client/.env` (or pass them from Cloud Build) before building.

## 9. Custom Domain & SSL

1. Map your domain to Cloud Run through **Serverless Network Endpoint Groups** or the built-in custom domain mapping.
2. Use **Cloud DNS** to host DNS records.
3. Cloud Run provisions SSL certificates automatically once the domain is verified.

## 10. Tools Utilised on Google Cloud

- **Cloud Run** – hosts the containerised API + built frontend.
- **Artifact Registry** – stores versioned container images.
- **Cloud Build** – CI/CD pipeline for building and deploying.
- **Secret Manager** – manages production secrets, consumed at runtime.
- **Cloud Logging** – receives structured JSON logs from the application.
- **Cloud Monitoring** – optional, via `/metrics` endpoint scraping.
- **Cloud DNS / Managed Certificates** – for custom domains and TLS.

## 11. Post-Deployment Checklist

- [ ] Secrets populated and accessible to the Cloud Run service account.
- [ ] MongoDB/Redis networking verified (VPC connector if private).
- [ ] Email delivery tested from Cloud Run.
- [ ] Gemini API quota configured for production usage.
- [ ] SSE/chat flows verified under Cloud Run session limits.
- [ ] Cloud Build trigger wired to your repository.
- [ ] Custom domain mapped and SSL certificate issued.
