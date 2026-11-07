# Leaps of Laughter: private demo site

Static Astro site (vanilla JS, no UI framework) built as a sales demo for
**Leaps of Laughter LLC**, Plant City, FL. It is `noindex` and disallowed in
`robots.txt` (both driven by one flag, see below).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

## Where things live

| What | File |
| --- | --- |
| Every business fact, price, size, service area, contact | `src/data/site.ts` |
| Page markup | `src/pages/index.astro` |
| "My request" builder, filters, demo submit (vanilla JS) | `src/scripts/request.js` |
| Styles and brand tokens | `src/styles/global.css` |
| Card illustrations (placeholders for photos), defined once as an SVG sprite | `src/components/ArtSprite.astro` |
| Sample photos (Unsplash, optimized WebP) | `src/assets/`, fetched by `scripts/fetch-photos.mjs` |

## Demo behavior

* The form never sends anything. Submit shows: "Demo: in the live version this
  request goes straight to Leaps of Laughter."
* No availability, "booked" dates, totals, deposits, delivery fees or policies are shown.
* Prices are shown as supplied, with no unit (per day, etc.) because none was supplied.

## Still unknown (left out on purpose)

* The exact Facebook page URL. The link currently opens a Facebook search for the
  business name (`business.facebook` in `src/data/site.ts`). Replace with the real URL.
* Rental details not in the catalogue: sizes for Twinkle Unicorn Combo, Santa's Jump
  House, and the add-ons; any capacities, delivery or power rules, deposits, cancellation.
* Operating days (only hours, 9:00 am to 5:00 pm, were supplied).
* Real photos of each rental. Cards use original illustrations until supplied;
  add a photo per item and swap it into the card.
* Photographer names for the two Unsplash sample photos (footer credits Unsplash only).

## Features added in round 3

* **Sample availability calendar.** One "Pick your date" calendar above the grid plus a month calendar in each rental's
  "Dates" detail view. Data is deterministic pseudo-bookings from a fixed seed
  (`src/scripts/sample-availability.js`), clearly labelled on every calendar:
  "Sample availability. In the live version this shows your real bookings." Picking a date greys out
  rentals that are booked that day (sample) and syncs the form's event date. Past dates are disabled.
  Keyboard: arrows, Home/End, PageUp/PageDown, Enter/Space. `src/scripts/calendar.js` is about 5 KB, no library.
* **Estimated total** in the My request bar and the form: sum of catalogue prices only, with the note
  "Estimate for rentals only, final details confirmed by Leaps of Laughter." No fees, tax or deposits.
* **"Often added"** row (Generator, 50 ft Water Hose, Cotton Candy Machine) when one of Purple Plunge, Twinkle Unicorn
  Combo, Toxic Splash or Tropical Plunge is in the request. Configure in `oftenAdded` in `src/data/site.ts`.
* **Gallery strip + lightbox** (native `<dialog>`: Esc closes, arrows browse).
* **FAQ** with three generic questions that point to the owners. No policies.
* **Mobile quick-contact bar** (Call opens both numbers, WhatsApp). Hidden on desktop, while the form is in view,
  and while the My request bar is open.
* **LocalBusiness JSON-LD** from real facts only (no days of week for hours, because none were supplied).

## Launch flag (SEO)

`seo.indexable` in `src/data/site.ts` is the single switch. `false` (demo): `<meta name="robots" content="noindex,nofollow">`
and a `Disallow: /` robots.txt. `true` (launch): the meta tag is removed and robots.txt allows crawling.
There is no separate header or file to edit. Also replace the Facebook search link with the real page URL.

## Design notes

"Sticker pop": thick navy outlines, hard offset shadows, saturated colour blocks, scalloped
"inflatable" section edges, a photo collage hero, a marquee of the real inventory and prices,
bouncing headline, floating pill header with scroll-spy and mobile menu. Interactions: pictures fly
into the sticky "My request" bar with a confetti burst, card tilt, animated filters, scroll reveal.
All motion is disabled for `prefers-reduced-motion`; the page works without JS.

## Quality checks (mobile Lighthouse, local build)

Performance 99 to 100, Accessibility 100, Best Practices 100, CLS 0, LCP about 1.5 to 1.7 s, whole page about 185 KB with every lazy image loaded.
SEO shows 66 **only** because of the required `noindex` (Lighthouse "page is blocked
from indexing"). The same build without `noindex`/`robots.txt` scores SEO 100.

## Deploy (Vercel)

Import the repo as its own Vercel project. Framework preset is detected as Astro;
no environment variables are needed. `vercel.json` adds the noindex header and
long-lived caching for hashed assets.
