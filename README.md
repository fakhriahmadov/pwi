# Private Wealth Institute — website

Next.js (App Router, TypeScript) site for privatewealth.institute: insights, the EuroCapital Index, Future. Summit events with Stripe ticketing, contact/newsletter, and an admin area.

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
| EuroCapital Index data | `content/index/series.csv`, `content/index/ranking.csv` (see README there) |
| Reports (PDF) | file in `public/reports/`, entry in `content/reports.ts` |
| Legal pages | `content/legal/*.md` |
| Address, social links, contact email | `content/site.ts` |

## Ticketing flow
1. Guest picks a pass → details → review (`/events/[slug]/register`).
2. Priced pass → Stripe Checkout → webhook `/api/stripe/webhook` marks it **PAID**, issues a ticket code and emails an e-ticket with QR code.
3. "On request" passes, or events with `registration: "approval"`, are saved for the team; **Approve** in `/admin` emails a payment link (or confirms and issues the ticket when there's no price).
4. At the door: open `/admin`, filter by event, **Check in**, or export the CSV list.

Stripe webhook events to enable: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.

## Admin
`/admin`: sign in at `/admin/login`. Only addresses in `ADMIN_EMAILS` (default fakhri.ahmadov@gmail.com and fakhri@privatewealth.institute) get in. Three ways to sign in:
  - **Continue with Google**: needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (redirect URI `https://<domain>/api/auth/google/callback`). The Google account's email must be one of the admin addresses.
  - **Email + password**: set or change it at `/admin/account`. Passwords are stored scrypt-hashed.
  - **Emailed sign-in link** ("Forgot your password, or first time?"): a single-use link valid 15 minutes; it lands on the Account page to set a password. Without Resend the link is printed in the server log.

  Sessions are signed cookies (`AUTH_SECRET`) valid for 7 days.
- **Registrations** per event with revenue, approvals, check-in and ticket resend; **Enquiries**; **Subscribers**; CSV exports.
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
