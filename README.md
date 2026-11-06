# Leaps of Laughter: private demo site

Static Astro site (vanilla JS, no UI framework) built as a sales demo for
**Leaps of Laughter LLC**, Plant City, FL. It is `noindex`, disallowed in
`robots.txt`, and sends `X-Robots-Tag: noindex, nofollow` on Vercel.

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
| Card illustrations (placeholders for photos) | `src/components/ItemArt.astro` |
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

## Quality checks (mobile Lighthouse, local build)

Performance 100, Accessibility 100, Best Practices 100, CLS 0, LCP about 1.2 s.
SEO shows 66 **only** because of the required `noindex` (Lighthouse "page is blocked
from indexing"). The same build without `noindex`/`robots.txt` scores SEO 100.

## Deploy (Vercel)

Import the repo as its own Vercel project. Framework preset is detected as Astro;
no environment variables are needed. `vercel.json` adds the noindex header and
long-lived caching for hashed assets.
