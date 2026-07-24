# Search Console Recrawl Checklist

After deploying SEO changes, use this checklist to request Google re-index the updated pages.

---

## Post-Deploy Steps

### 1. Verify deployment is live

```bash
curl -s https://settleclt.com/events | grep -o '<title>[^<]*</title>'
curl -s https://settleclt.com/things-to-do | grep -o '<title>[^<]*</title>'
curl -s https://settleclt.com/sitemap.xml | head -20
```

### 2. Request indexing in Google Search Console

Go to: https://search.google.com/search-console/inspect

For each updated URL, paste it into the URL Inspection tool and click "Request Indexing":

**Priority URLs (request immediately after deploy):**

```
https://settleclt.com/events
https://settleclt.com/things-to-do
https://settleclt.com/blog/charlotte-job-market-top-employers-2026
https://settleclt.com/neighborhood/south-charlotte
https://settleclt.com/neighborhood/dilworth
https://settleclt.com/sitemap.xml
```

**Secondary URLs (request within 24 hours):**

```
https://settleclt.com/neighborhoods
https://settleclt.com/directory
https://settleclt.com/
https://settleclt.com/blog
```

### 3. Submit updated sitemap

1. Go to: https://search.google.com/search-console/sitemaps
2. Enter: `sitemap.xml`
3. Click "Submit"
4. Verify status shows "Success" after processing

### 4. Check for crawl errors

1. Go to: https://search.google.com/search-console/index
2. Check "Why pages aren't indexed" section
3. Look for new errors introduced by the deploy
4. Common issues:
   - Soft 404 (page loads but content is empty/error)
   - Redirect loops
   - Server errors (5xx)

---

## Timing Expectations

| Action | Expected Timeline |
|--------|-------------------|
| Request indexing | Processed within 1-2 days |
| Title/description update in SERP | 3-7 days |
| New page appearing in search | 1-2 weeks |
| Ranking improvement from content | 2-4 weeks |
| Full impact of SEO changes | 4-8 weeks |

---

## Verification Commands

Check if Google has re-crawled (use `site:` operator):

```
site:settleclt.com/events
site:settleclt.com/things-to-do
site:settleclt.com/neighborhood/south-charlotte
site:settleclt.com/blog/charlotte-job-market-top-employers-2026
```

---

## Daily Quota Limits

- Google allows ~10 URL inspection requests per day per property
- Sitemap submissions are unlimited
- Prioritize highest-impression pages first

---

## Troubleshooting

### Page shows "Discovered - currently not indexed"
- Content is too thin (< 300 words unique content)
- Page is duplicate of another page
- Page has noindex tag (check robots.txt and meta tags)
- Fix: Add unique content, ensure page is in sitemap, request indexing

### Page shows "Crawled - currently not indexed"
- Google crawled it but decided not to index it
- Usually means content quality is insufficient
- Fix: Add 500+ words of unique, valuable content with internal links

### Title/description not updating in SERP
- Google may choose its own title/description
- Ensure title is < 60 chars and description < 160 chars
- Make sure title accurately describes page content
- Wait 1-2 weeks; Google may take time to update
