# SEO Loop Agent Prompt

Use this prompt weekly to review Google Search Console data and iterate on Settle CLT's SEO performance.

---

## Prompt Template

```
You are an SEO optimization agent for Settle CLT (settleclt.com), a Charlotte NC relocation guide.

Review the following Google Search Console data and recommend specific improvements:

### Current Performance Data
[Paste GSC data here — impressions, clicks, CTR, average position by page]

### Instructions

1. **Identify low-hanging fruit**: Pages with high impressions but low clicks (CTR < 2%) — these need better titles and meta descriptions.

2. **Identify position opportunities**: Pages ranking 5-20 that could reach page 1 with content improvements.

3. **Identify thin content**: Pages discovered but not indexed — these need more unique content (300+ words minimum).

4. **For each recommendation, provide**:
   - The specific page/URL
   - Current title and description
   - Recommended new title (under 60 chars) and description (under 160 chars)
   - Content additions needed (word count, topics to cover)
   - Internal linking opportunities

5. **Priority scoring**: Rate each fix as High/Medium/Low based on:
   - Impression volume (more impressions = higher priority)
   - Position gap (closer to page 1 = higher priority)
   - Effort required (quick title fix vs. new content)

### Output Format

For each recommendation:
- Page: [URL]
- Priority: [High/Medium/Low]
- Current: title / description / position / impressions / clicks
- Recommended: new title / new description
- Content changes: [specific additions]
- Internal links to add: [list]
- Expected impact: [estimate]
```

---

## How to Use

1. Export data from Google Search Console → Performance → Pages tab
2. Filter to last 28 days
3. Sort by impressions (descending)
4. Copy the top 50 pages into the prompt
5. Run the prompt in Manus or your preferred AI tool
6. Implement the top 5 recommendations each week
7. Re-check GSC data after 2-4 weeks for impact

---

## Key Metrics to Track

| Metric | Target | Current Baseline |
|--------|--------|-----------------|
| Overall CTR | > 3% | ~0.5% |
| Pages indexed | > 200 | ~150 |
| Average position (priority pages) | < 15 | ~30 |
| /events CTR | > 2% | 0% |
| /neighborhood/* CTR | > 3% | ~1% |
| Blog post CTR | > 5% | ~2% |

---

## Weekly Cadence

- **Monday**: Pull GSC data, run agent prompt
- **Tuesday-Wednesday**: Implement top 3-5 fixes
- **Thursday**: Deploy changes, request re-indexing
- **Friday**: Verify pages are re-crawled, check for errors

---

## Common Fix Patterns

### Title too generic
- Before: "Neighborhoods - Settle CLT"
- After: "20 Charlotte NC Neighborhoods Ranked (2026): Honest Guides & Costs"

### Description missing keywords
- Before: "Explore Charlotte neighborhoods"
- After: "Compare 20 Charlotte NC neighborhoods by cost, vibe, schools, and walkability. Real costs, honest pros/cons, and local tips from residents."

### Thin content (not indexed)
- Add 300+ words of unique, locally-relevant content
- Include the business/service name + area + "Charlotte NC" naturally
- Add internal links to related pages (neighborhood, category, blog)

### Missing structured data
- Ensure JSON-LD is present on all key pages
- LocalBusiness schema for directory listings
- BreadcrumbList for navigation hierarchy
- Event schema for events pages
