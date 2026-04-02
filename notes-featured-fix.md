# FEATURED Badge Analysis

## Directory Page (Directory.tsx)
- Line 504: Badge shows only when `s.featured && s.affiliate` — this is CORRECT
- Lines 171-178: Sorting still uses `featured` field to sort featured items to top — this causes featured items to appear at top even without badge
- The issue is that many services have `featured: true` in the data but NOT `affiliate: true`, so they get sorted to the top without a badge. This is confusing but not a badge issue.

## Events Page (Events.tsx)
- Line 109: `isFeatured = event.isFeatured === "yes"` — shows Featured badge for ALL events marked as featured
- Line 137-141: Shows "Featured" badge on event cards
- Line 217-219: Filters featured events for a dedicated "Featured Events" section
- Line 326-334: Renders a "Featured Events" section at the top
- Line 409-412: Shows Featured badge in event detail modal
- The events data comes from a tRPC query, need to check how isFeatured is set

## NeighborhoodDetail.tsx
- Line 738: Badge shows only when `s.featured && s.affiliate` — this is CORRECT

## Root Issue
For Directory: The badge condition `s.featured && s.affiliate` is correct. But the SORTING still prioritizes `featured: true` items, making them appear at top. Many services have `featured: true` but `affiliate: false`, so they appear at top without a badge — this is the user's complaint.

For Events: The Featured badge shows for ALL events where isFeatured === "yes". Need to check the events data to see if all events are marked featured.
