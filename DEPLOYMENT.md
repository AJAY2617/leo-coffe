# Deploy Leo Coffe to Vercel

The website uses PostgreSQL when DATABASE_URL (or POSTGRES_URL) is configured. Local development can still use data/orders.json. On Vercel, the API refuses to accept orders without persistent storage rather than trying to write to the deployment filesystem.

1. Sign in with `npx.cmd vercel login`.
2. Link the project: `npx.cmd vercel link --project leo-coffe --yes`.
3. Add a PostgreSQL database using the Vercel Marketplace (Neon or another PostgreSQL provider). Connect its pooled DATABASE_URL to this project in production. Do not commit or share the connection string.
4. Add ADMIN_PASSWORD as a sensitive production environment variable, using the existing shop password from .env.local. Never use a NEXT_PUBLIC_ prefix for either secret.
5. Deploy with `npx.cmd vercel deploy --prod --yes`.

The leo_coffe_orders table is created on first database use. Individual inserts and status updates are atomic and work across Vercel instances. Existing local JSON orders are not uploaded or automatically migrated.

The source upload excludes environment files, local orders, screenshots, node_modules, and build output through .vercelignore.

The site remains an ordering preview with sample menu prices and cash payment. Set the actual shop address, service area, and shop hours before real customer deliveries. Online card payments and delivery dispatch are not connected.
