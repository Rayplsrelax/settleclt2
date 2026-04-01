/* ============================================
   SETTLE CLT — Blog Articles Data (TypeScript)
   ============================================ */

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  gradient: string;
  featured?: boolean;
  url?: string;
  image?: string;
  content?: string;
}

export const articles: Article[] = [
  {
    id: 'cost-of-living-2026',
    title: 'Charlotte NC Cost of Living 2026: Complete Breakdown',
    category: 'Cost of Living',
    excerpt: 'Housing, food, transportation, taxes — everything you need to budget for your move to the Queen City.',
    readTime: '8 min',
    date: 'March 2026',
    gradient: 'linear-gradient(135deg, #00C9A7 0%, #00A88C 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-skyline-cost-of-living_7d791b75.jpg',
    featured: true,
  },
  {
    id: 'utility-setup-guide',
    title: 'Complete Charlotte Utility Setup Guide',
    category: 'Getting Started',
    excerpt: 'Duke Energy, Charlotte Water, internet providers — step-by-step setup for every utility you need.',
    readTime: '6 min',
    date: 'March 2026',
    gradient: 'linear-gradient(135deg, #FFB347 0%, #F09828 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-uptown-street_9a41b259.jpg',
  },
  {
    id: 'breweries-guide',
    title: '50+ Breweries in Charlotte: The Ultimate Beer Guide',
    category: 'Lifestyle',
    excerpt: 'Charlotte\'s craft beer scene is booming. Here\'s your definitive guide to every brewery worth visiting.',
    readTime: '12 min',
    date: 'February 2026',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2A4F7A 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/noda-brewery_806f23ef.jpg',
  },
  {
    id: 'nc-drivers-license',
    title: 'How to Transfer Your Driver\'s License to NC',
    category: 'Getting Started',
    excerpt: 'Everything you need — documents, fees, DMV locations, and tips to avoid the long wait.',
    readTime: '5 min',
    date: 'February 2026',
    gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-uptown-dmv_d44d4b87.jpg',
  },
  {
    id: 'best-schools',
    title: 'Best Schools in Charlotte: CMS, Charter & Private',
    category: 'Schools',
    excerpt: 'A parent\'s guide to Charlotte-Mecklenburg Schools, top charter options, and prestigious private schools.',
    readTime: '10 min',
    date: 'January 2026',
    gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-school-campus_50511254.jpg',
  },
  {
    id: 'getting-around-charlotte',
    title: 'Getting Around Charlotte: CATS, Highways & Greenways',
    category: 'Transportation',
    excerpt: 'Light rail, buses, I-77 tips, the airport shuttle, and Charlotte\'s growing network of bike greenways.',
    readTime: '7 min',
    date: 'January 2026',
    gradient: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-light-rail_38fb43c8.jpg',
  },
  {
    id: 'moving-from-nyc',
    title: 'Moving From NYC to Charlotte: Everything You Need to Know',
    category: 'Relocation',
    excerpt: 'What to expect when trading the Big Apple for the Queen City — cost savings, lifestyle changes, and more.',
    readTime: '9 min',
    date: 'January 2026',
    gradient: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-aerial-moving_ebb2452d.jpg',
  },
  {
    id: 'dog-parks-charlotte',
    title: 'Best Dog Parks & Pet-Friendly Spots in Charlotte',
    category: 'Pets',
    excerpt: 'Off-leash parks, pet-friendly patios, the best vets, and why Charlotte is a dog lover\'s paradise.',
    readTime: '6 min',
    date: 'December 2025',
    gradient: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-dog-greenway_0b5c64ea.jpg',
  }
];

export const blogCategories = [
  'All',
  'Getting Started',
  'Cost of Living',
  'Lifestyle',
  'Schools',
  'Transportation',
  'Relocation',
  'Pets'
];
