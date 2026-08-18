export const en = {
  // Navigation
  "nav.home": "Home",
  "nav.neighborhoods": "Neighborhoods",
  "nav.directory": "Directory",
  "nav.events": "Events",
  "nav.blog": "Blog",
  "nav.listYourBusiness": "List Your Business",
  "nav.signIn": "Sign In",
  "nav.signOut": "Sign Out",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",

  // User menu
  "user.myProfile": "My Profile",
  "user.myBusiness": "My Business",
  "user.cltPassport": "CLT Passport",
  "user.findYourHome": "Find Your Home",
  "user.businessPricing": "Business Pricing",
  "user.myWishlist": "My Wishlist",
  "user.cltBingo": "CLT Bingo",
  "user.leaderboard": "Leaderboard",
  "user.notificationSettings": "Notification Settings",
  "user.adminDashboard": "Admin Dashboard",

  // Footer
  "footer.tagline":
    "Your complete guide to living in Charlotte, NC. Discover neighborhoods, local businesses, events, and everything that makes the Queen City home.",
  "footer.follow": "Follow Settle CLT",
  "footer.explore": "Explore",
  "footer.servicesDirectory": "Services Directory",
  "footer.events": "Events",
  "footer.blogGuides": "Blog & Guides",
  "footer.community": "Community",
  "footer.cltPassport": "CLT Passport",
  "footer.cltBingoCards": "CLT Bingo Cards",
  "footer.leaderboard": "Leaderboard",
  "footer.listYourBusiness": "List Your Business",
  "footer.businessPricing": "Business Pricing",
  "footer.requestReferral": "Request a Referral",
  "footer.getStarted": "Get Started",
  "footer.neighborhoodQuiz": "Neighborhood Quiz",
  "footer.findYourNeighborhood": "Find Your Neighborhood",
  "footer.findYourHome": "Find Your Home",
  "footer.movingGuides": "Moving Guides",
  "footer.contactUs": "Contact Us",
  "footer.rightsReserved": "All rights reserved.",
  "footer.privacyPolicy": "Privacy Policy",
  "footer.termsOfService": "Terms of Service",
  "footer.contact": "Contact",
  "footer.neighborhoods": "Neighborhoods",

  // Home page
  "home.heroTitle1": "Your complete guide to",
  "home.heroTitle2": "settling in Charlotte",
  "home.heroTagline":
    "Explore 20 neighborhoods, discover 700+ local services, and get honest advice from people who actually live here.",
  "home.browseDirectory": "Browse Directory",
  "home.viewEvents": "View Events",

  // Events page
  "events.title1": "What's Happening in",
  "events.title2": "Charlotte",
  "events.subtitle":
    "Concerts, food festivals, art shows, sports, and more. Discover what makes the Queen City come alive.",
  "events.charlotteBadge": "Charlotte Events",
  "events.filterAll": "All",
  "events.noResults": "No events found",
  "events.tryAdjusting": "Try adjusting your search or filters",

  // Directory page
  "directory.title": "Services Directory",
  "directory.subtitle": "Discover 700+ local businesses in Charlotte",
  "directory.newThisWeek": "New This Week",
  "directory.noResults": "No results found",
  "directory.tryAdjusting": "Try adjusting your search or filters",
  "directory.mostReviewed": "Most Reviewed",
  "directory.topRated": "Top Rated",
  "directory.newestFirst": "Newest First",
  "directory.allAreas": "All Areas",
  "directory.nearYou": "Near you",
  "directory.addYours": "Add yours",
  "directory.legendByCategoryGroup": "Legend by category group",
  "directory.category": "Category",
  "directory.categoryGroup": "Category Group",


  // Events page extras
  "events.directions": "Directions",
  "events.submit": "Submit an Event",
  "events.searchPlaceholder": "Search events, venues, neighborhoods...",
  "events.clearAll": "Clear all",
  "events.clearAllFilters": "Clear all filters",
  "events.upcoming": "Upcoming Events",
  "events.past": "Past Events",
  "events.recurring": "Recurring event",
  "events.dateTba": "Date TBA",
  "events.timeTba": "Time TBA",

  // Directory page extras
  "directory.getDirections": "Get Directions",
  "directory.loadMore": "Load More",
  "directory.clearAllFilters": "Clear all filters",
  "directory.recentlyAdded": "Recently added to the directory",

  // Home page extras
  "home.exploreNeighborhoods": "Explore Neighborhoods",
  "home.findYourHome": "Find Your Home",
  "home.takeTheQuiz": "Take the Quiz",
  "home.buildMyPlan": "Build My Plan",
  "home.emailAddress": "Email address",
  "home.charlotteBlog": "Charlotte Blog",
  "home.latestFromSettle": "Latest from Settle CLT",
  "home.blogSubtitle":
    "Weekly guides, neighborhood deep-dives, and local intel for Charlotte newcomers",
  "home.viewAllPosts": "View all posts",
  "home.liveUpdates": "Live Updates",
  "home.thisWeekInCharlotte": "This Week in Charlotte",
  "home.eventsSubtitle": "Don't miss what's happening around the Queen City",
  "home.viewAllEvents": "View all events",

  // Shared customer-facing UI
  "common.loading": "Loading...",
  "cookies.ariaLabel": "Cookie consent",
  "cookies.title": "We use cookies",
  "cookies.description":
    "We use cookies and analytics tools to understand how you use Settle CLT so we can improve your experience. Read our",
  "cookies.privacyPolicy": "Privacy Policy",
  "cookies.details": "for details.",
  "cookies.accept": "Accept All",
  "cookies.decline": "Decline",
  "cookies.dismiss": "Dismiss cookie banner and decide later",
  "cookies.dismissTitle": "Dismiss — we'll ask again next visit",
  "map.loading": "Loading map...",
  "map.unavailable": "Map unavailable",
  "map.openAddressInstead":
    "Please use the address link on this page to open the address in Google Maps.",
  "notFound.title": "Page Not Found",
  "notFound.description":
    "Sorry, the page you are looking for doesn't exist. It may have been moved or deleted.",
  "notFound.goHome": "Go Home",

  // Language setting
  "language.choose": "Choose language",
  "language.current": "Current language: {language}",
  "language.english": "English",
  "language.spanish": "Español",
  "language.toggle": "Español",
  "language.toggleEn": "English",
  "language.switchToSpanish": "Switch to Spanish",
  "language.switchToEnglish": "Cambiar a inglés",
} as const;

export type TranslationKey = keyof typeof en;
