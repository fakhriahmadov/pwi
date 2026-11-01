# Private Wealth Institute — website

Next.js (App Router, TypeScript) site for privatewealth.institute: Insights (articles and the wealth indexes on one page), Future. Summit events with Stripe ticketing, a newsletter with chosen frequency and topics, and an admin area.

## Run locally
```bash
npm install
cp .env.example .env      # fill in at least DATABASE_URL for forms and registration
npm run db:push           # creates the tables
npm run dev               # http://localhost:3000
```
Without `RESEND_API_KEY`, emails are printed to the server log. Without Stripe keys, checkout returns a clear "payment isn't set up yet" message.

## Where to edit content
| What | File |
|---|---|
| Articles | **Admin → Insights** (`/admin/insights`): write, add cover and in-text images, draft / publish, feature. The original articles in `content/articles/*.md` show until you click “Make them editable”. |
| Events, passes, prices, programme, speakers, FAQ | `content/events.ts` |
| Indexes and their data | **Admin → Indexes** (`/admin/research`): upload a CSV of fortunes, then define indexes by tags |
| Reports (PDF) | file in `public/reports/`, entry in `content/reports.ts` |
| Legal pages | `content/legal/*.md` |
| Address, social links, contact email | `content/site.ts` |

## Insights page
`/insights` shows the indexes in the main column (choose an index or compare all, then “Full breakdown” opens `/indexes/[slug]`), the “Explore by theme” table, the methodology (closed until opened), reports and the data request form. The side panel has the five latest articles (“All articles” → `/insights/articles`) and the newsletter sign-up. `/indexes` redirects to `/insights`.

## Ticketing flow
1. Guest picks a pass → details → review (`/events/[slug]/register`).
2. Priced pass → Stripe Checkout → webhook `/api/stripe/webhook` marks it **PAID**, issues a ticket code and emails an e-ticket with QR code.
3. "On request" passes, or events with `registration: "approval"`, are saved for the team; **Approve** in `/admin` emails a payment link (or confirms and issues the ticket when there's no price).
4. At the door: open `/admin`, filter by event, **Check in**, or export the CSV list.

Stripe webhook events to enable: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.

## Admin
All content is edited in the admin; nothing needs a developer:
- **Overview** (`/admin`): every section with what needs attention.
- **Pages** (`/admin/pages`): text and images of Home, Insights, Indexes, Events and Contact pages, the footer, site settings (emails, address, social links) and the four legal pages. **Save draft** keeps changes private, **Preview** opens the real page with your draft (a red “Preview” bar shows), **Publish** makes it live, **Discard draft** and **Reset to original** undo.
- **Events** (`/admin/events`): create and edit summits — details, accent colour, photo, passes and prices, programme, speakers with photos, FAQ, registration mode; drafts stay hidden until published. Events still in `content/events.ts` show until you click “Make editable”.
- **Reports** (`/admin/reports`): upload PDFs (up to 20 MB), require an email before download or not, publish.
Guide for editors: [docs/insights-admin-guide.md](docs/insights-admin-guide.md).

`/admin`: sign in at `/admin/login`. Only addresses in `ADMIN_EMAILS` (default fakhri.ahmadov@gmail.com and fakhri@privatewealth.institute) get in. Three ways to sign in:
  - **Continue with Google**: needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (redirect URI `https://<domain>/api/auth/google/callback`). The Google account's email must be one of the admin addresses.
  - **Email + password**: set or change it at `/admin/account`. Passwords are stored scrypt-hashed.
  - **Emailed sign-in link** ("Forgot your password, or first time?"): a single-use link valid 15 minutes; it lands on the Account page to set a password. Without Resend the link is printed in the server log.

  Sessions are signed cookies (`AUTH_SECRET`) valid for 7 days.
- **Registrations** per event with revenue, approvals, check-in and ticket resend; **Enquiries**; **Subscribers** (with their frequency and topics); CSV exports.
- **Newsletter** (`/admin/newsletter`): one edition per frequency (weekly on Mondays, monthly on the 1st, quarterly, annually on 15 December). Each collects new articles, index updates and upcoming events since the last edition — event news is only ever sent here, never as separate invitations. Edit the subject and opening line, untick items, check the email preview, then **Approve & send** or **Skip**. Nothing is sent without approval. Every reader only gets their chosen topics, with their own “change preferences” (`/newsletter/preferences`) and one-click unsubscribe links.
- **Indexes** (`/admin/research`): upload an Excel (.xlsx) or CSV spreadsheet in your own layout, then match its columns on the next screen (most are guessed; net worth can be in € billions, € millions or euros; Yes/No columns such as “Family business?” can become tags). An Excel template with instructions and dropdowns is at `/admin/research/template.xlsx`. Expected fields: one row per fortune per year (`year`, `country`, `net_worth_eur_bn` (euros, billions); optional `name`, `industry`, `birth_year`, `gender`, `region`, `tags`). Uploading a year replaces that year. Region, country, industry, generation (from birth year) and gender tags are added automatically; custom tags go in `tags`, separated by `;`. Each **index** is a saved tag filter (“must have all of …” + “at least one of …”) with a base year (= 100), colour, published / featured flags. Starter indexes: Global, EuroCapital, Family Business, Gen X, Gen Y, Gen Z. Public pages show totals only — names are never published.
- **Insights** (`/admin/insights`): list of articles with Published / Draft filters; editor with title, summary, topic (or a new one), date, author, web address, cover image, a Markdown text editor with formatting buttons, image upload and Preview; Publish, Save draft / Unpublish, Feature, Delete.
- **About page** (`/admin/about`): introduction text, founder (name, role, biography, quote, portrait), team and advisory board with photos, milestones, and partner / press logos. Changes appear on `/about` immediately after saving.

Uploaded images (JPG, PNG, WebP, AVIF or SVG, up to 5 MB) are stored in the database and served from `/media/[id]` with long-lived caching, so no separate file storage service is needed.

## Deploy (Vercel)
1. Import the repository in Vercel; add the variables from `.env.example`.
2. Create a Postgres database (Supabase or Neon), set `DATABASE_URL`, run `npm run db:push` once.
3. In Stripe, add the webhook endpoint `https://<domain>/api/stripe/webhook` and copy its secret.
4. In Resend, verify the sending domain (SPF/DKIM).
5. Point the domain's DNS from Wix to Vercel. Old Wix URLs (`/post/...`, `/future-summit`, ...) redirect automatically (see `next.config.ts`).

## Before launch
- In Admin → Insights, click “Make them editable”, then paste the full text of each original article.
- Set pass prices in `content/events.ts` (`priceCents`), and remove `externalRegistrationUrl` from Vienna if it should sell here.
- Complete the legal pages, the address in `content/site.ts`, and the team section in `app/about/page.tsx`.
