# Leo Coffe

A responsive coffee shop ordering website using Next.js, TypeScript, React, and Tailwind CSS.

## Run locally

Node.js 20.9 or newer is required. In Windows PowerShell use npm.cmd if script execution is disabled.

    npm.cmd install
    npm.cmd run dev

Open http://localhost:3000. The shop dashboard is http://localhost:3000/admin.
The local shop password is in .env.local under ADMIN_PASSWORD. This file is ignored by Git. If missing, copy .env.example to .env.local and set a long unique password. Restart the server after changing it. Sessions last eight hours.

## Checks

    npm.cmd run lint
    npm.cmd run build
    npm.cmd run start

With the local server running, `npm.cmd run test:e2e` uses installed Google Chrome to check price validation, admin protection and status changes, customer checkout, cart persistence, and mobile layout. Test-created orders are removed after the run.

## Features

- Eight products with search and category filters.
- Size, milk, and sugar customization with visible extra charges.
- Browser-persistent cart with quantity controls and removal.
- Delivery or pickup, customer details, and notes.
- Delivery costs ₹40 and is free for orders ₹499+; pickup is free.
- Server validates items and calculates prices. Payment is cash on delivery/pickup.
- Orders survive restarts in data/orders.json with serialized atomic writes in one Node.js process.
- UUID tracking links refresh every ten seconds and omit customer contact details.
- Password-protected dashboard with order details and status updates. Pickup labels use Ready for pickup and Collected.

## Before public launch

This is a local working first version. It does not process online payments or dispatch real deliveries. Brand, prices, and delivery estimates are sample content. Set your real shop address, hours, service area, menu, and delivery rules before accepting real orders.

Local JSON storage requires one server process on persistent disk. Set DATABASE_URL to use PostgreSQL on Vercel or multiple instances; see DEPLOYMENT.md. Add backups, production order rate limits, robust staff account management, and a payment provider with your own credentials. The login attempt limiter is in memory for local use.

Edit products in src/lib/menu.ts. Menu editing and driver assignment are not included yet. Sample photographs from Unsplash are stored locally in public/images; use your own photos for launch. The optional scripts/download-photos.mjs script records the original photo IDs and can redownload them. No emails, SMS, or live driver maps are sent. Status changes come from the shop dashboard. Save the tracking link to revisit an order.

The Leo lion logo and browser icons come from https://github.com/AJAY2617/leo/tree/main/leo/logo. The original assets are saved locally in public/brand and src/app.

