# Insights: how the admin works

A guide for anyone who writes or edits articles on privatewealth.institute.

## 1. Sign in
- Click the **person icon** in the site header (or go to `/admin/login`).
- Sign in with **Google**, or with **email and password**. First time, or forgot your password? Choose “Forgot your password, or signing in for the first time?” — you'll get a one-time link and can set a password on the **Account** page.
- Only these addresses have access: fakhri.ahmadov@gmail.com and fakhri@privatewealth.institute.
- You stay signed in for 7 days. **Sign out** is at the top of every admin page.

## 2. The Insights list (Admin → Insights)
- Shows every article with its topic, date and status (**Published** or **Draft**). Filter with **All / Published / Drafts**.
- **First time only:** the four original articles are still read from the old files. Click **Make them editable** once to bring them into the editor, then paste in their full text.
- **New article** starts a blank article; click a title to edit it.

## 3. Writing an article
**Main column**
- **Title** — also fills in the web address automatically.
- **Summary** — one or two sentences shown on the Insights page, in search results and when the link is shared.
- **Text** — use the buttons: section heading (H2), sub-heading (H3), bold, italic, quote, bulleted list, numbered list, link, **Image** (uploads a picture and places it in the text).
  - The **first paragraph** is shown larger, as the article's introduction.
  - Text pasted from Word or Google Docs keeps the words but not their formatting — re-apply headings and bold with the buttons.
  - Pasted HTML is removed (only its text is kept), so nothing pasted can change the site's look.
  - The word count and reading time update as you type; the reading time shown on the site is calculated the same way.
- **Preview** shows exactly how the article will look on the site.

**Side panel**
- **Cover image** — wide images work best (about 2400 × 1000 px). Without one, the topic name is shown in its place.
- **Topic** — choose one, or **+ New topic** to create it. Each topic gets its own page automatically (`/insights/topic/…`) and a filter button on the Insights page.
- **Publication date** — sets the order of articles (newest first). It does **not** schedule publishing: a future date still goes live as soon as you publish.
- **Author** — shown under the title.
- **Web address** — filled in from the title. Change it before publishing; changing it later breaks links people already shared.

**Images:** JPG, PNG, WebP, AVIF, GIF or SVG, up to 5 MB each. Images are stored with the site's data, not resized — export photos at a sensible size (around 2400 px wide at most).

## 4. Saving and publishing
| Button | When | What it does |
|---|---|---|
| **Save draft** | New or draft article | Saves; nothing shows on the site |
| **Publish** | Draft | Puts it live immediately |
| **Update** | Published article | Saves your changes to the live article |
| **Unpublish** | Published article | Takes it off the site (its page shows “not found”) but keeps it as a draft |
| **Feature at the top of the Insights page** | Any | Pins it as the large featured article. Only one article can be featured — featuring a new one un-features the old. If none is featured, the newest article is shown there. |
| **Remove** | Any saved article | Deletes it and its cover image, after you confirm. This can't be undone. |

## 5. What happens when you publish
The article appears at once in all of these places:
- the **Insights page** (and the featured slot, if ticked)
- the **home page** “Latest research & commentary” (the three newest articles)
- its **topic page**
- **“Keep reading”** at the end of other articles
- the **RSS feed** (`/insights/rss.xml`) and the **sitemap** for search engines

## 6. Things to know
- There is no revision history: saving replaces the previous text. Keep a copy of long pieces while you work on them.
- There is no scheduled publishing; publish when the article should go live.
- Old links from the previous site (`/post/…`) redirect to the new article pages automatically.

## Where the data lives (for developers)
- Articles: the `Article` table (Markdown text, topic, date, status, featured flag, cover image id).
- Images: the `Media` table, served from `/media/<id>` with long-term caching.
- The original articles in `content/articles/*.md` are shown only until they are imported; after that the admin version is used.
- Code: `app/admin/insights/` (screens and save actions), `lib/articles.ts` (what the public pages read), `lib/markdown.ts` (formatting rules, shared by the site and the Preview).

---

# Other sections of the admin

- **Overview** (`/admin`) — the first screen after signing in. Red cards need attention (unpublished page changes, drafts, registrations to review, open enquiries).
- **Pages** — edit the words and pictures on every page, the footer, contact details and legal texts. *Save draft* → *Preview* (opens the real page with a red “Preview” bar; click *Exit preview* when done) → *Publish*. *Discard draft* drops unpublished edits; *Reset to original* returns to the launch text.
- **Events** — *New event*, fill in the sections (Basics, Venue, Registration with passes and prices, Programme, Speakers, Questions), *Save draft*, check with *Preview*, then *Publish*. An event with registrations can't be deleted — unpublish it instead.
- **Reports** — upload a PDF with its title and date; tick *Ask for an email* to collect contacts before download; *Publish* shows it on the Indexes page.
