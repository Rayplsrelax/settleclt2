/* ============================================
   SETTLE CLT — Find Your Neighborhood Quiz
   Scoring engine & question definitions
   ============================================ */

import { allNeighborhoods, type Neighborhood } from './neighborhoods';

// ─── Question Types ───────────────────────────────────────────────
export interface QuizOption {
  id: string;
  label: string;
  emoji: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'single' | 'multi';
  maxSelections?: number;
  options: QuizOption[];
}

// ─── Answer Map ───────────────────────────────────────────────────
export type QuizAnswers = Record<string, string | string[]>;

// ─── Questions ────────────────────────────────────────────────────
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'budget',
    title: 'What\'s your monthly rent budget?',
    subtitle: 'This is the single biggest factor in narrowing down neighborhoods.',
    type: 'single',
    options: [
      { id: 'under1300', label: 'Under $1,300', emoji: '💰', description: 'Keep it lean' },
      { id: '1300to1600', label: '$1,300 – $1,600', emoji: '🏠', description: 'Solid middle ground' },
      { id: '1600to1900', label: '$1,600 – $1,900', emoji: '🏡', description: 'Room to breathe' },
      { id: 'over1900', label: '$1,900+', emoji: '✨', description: 'Go big' },
    ],
  },
  {
    id: 'housing_type',
    title: 'Are you looking to rent or buy?',
    subtitle: 'This helps us tailor your neighborhood recommendations and connect you with the right resources.',
    type: 'single',
    options: [
      { id: 'renting', label: 'Renting an apartment', emoji: '🏢', description: 'Flexibility to explore' },
      { id: 'buying', label: 'Buying a home', emoji: '🏡', description: 'Ready to put down roots' },
      { id: 'not_sure', label: 'Not sure yet', emoji: '🤔', description: 'Still deciding' },
    ],
  },
  {
    id: 'commute',
    title: 'How do you want to get to work?',
    subtitle: 'Charlotte is car-friendly, but some areas have real transit options.',
    type: 'single',
    options: [
      { id: 'walk_transit', label: 'Walk or take the train', emoji: '🚊', description: 'No car needed' },
      { id: 'short_drive', label: 'Short drive (under 20 min)', emoji: '🚗', description: 'Quick commute' },
      { id: 'remote', label: 'I work from home', emoji: '💻', description: 'Location flexible' },
      { id: 'dont_care', label: 'I\'ll drive whatever it takes', emoji: '🛣️', description: 'Distance doesn\'t matter' },
    ],
  },
  {
    id: 'vibe',
    title: 'What vibe are you looking for?',
    subtitle: 'Pick the one that feels most like home.',
    type: 'single',
    options: [
      { id: 'urban_buzz', label: 'Urban buzz & nightlife', emoji: '🌃', description: 'Bars, restaurants, energy' },
      { id: 'artsy_eclectic', label: 'Artsy & eclectic', emoji: '🎨', description: 'Murals, music, local shops' },
      { id: 'quiet_charm', label: 'Quiet charm & tree-lined streets', emoji: '🌳', description: 'Historic, peaceful' },
      { id: 'suburban_comfort', label: 'Suburban comfort & space', emoji: '🏘️', description: 'Yards, pools, good schools' },
      { id: 'lakefront_nature', label: 'Lakefront or nature access', emoji: '🚤', description: 'Water, trails, outdoors' },
    ],
  },
  {
    id: 'household',
    title: 'Who\'s moving with you?',
    subtitle: 'This helps us match school quality, family amenities, and social scene.',
    type: 'single',
    options: [
      { id: 'solo', label: 'Just me', emoji: '🙋', description: 'Flying solo' },
      { id: 'couple', label: 'Me + partner', emoji: '👫', description: 'No kids' },
      { id: 'young_family', label: 'Family with young kids', emoji: '👶', description: 'Under 10' },
      { id: 'school_family', label: 'Family with school-age kids', emoji: '🎒', description: 'Schools matter most' },
      { id: 'pet_parent', label: 'Me + my dog(s)', emoji: '🐕', description: 'Pet-friendly is non-negotiable' },
    ],
  },
  {
    id: 'priorities',
    title: 'Pick your top 2 priorities',
    subtitle: 'What matters most beyond budget and commute?',
    type: 'multi',
    maxSelections: 2,
    options: [
      { id: 'walkability', label: 'Walkability', emoji: '🚶' },
      { id: 'schools', label: 'Great schools', emoji: '🎓' },
      { id: 'nightlife', label: 'Nightlife & dining', emoji: '🍷' },
      { id: 'safety', label: 'Low crime / safety', emoji: '🛡️' },
      { id: 'diversity', label: 'Cultural diversity', emoji: '🌍' },
      { id: 'outdoor', label: 'Parks & outdoor access', emoji: '🌲' },
      { id: 'value', label: 'Best bang for buck', emoji: '💵' },
      { id: 'trendy', label: 'Hip & up-and-coming', emoji: '🔥' },
    ],
  },
  {
    id: 'dealbreaker',
    title: 'Any dealbreakers?',
    subtitle: 'We\'ll deprioritize neighborhoods that match these.',
    type: 'multi',
    maxSelections: 2,
    options: [
      { id: 'no_car_dependent', label: 'Can\'t be car-dependent', emoji: '🚫🚗' },
      { id: 'no_noisy', label: 'No construction noise / party scene', emoji: '🔇' },
      { id: 'no_far_uptown', label: 'Must be close to Uptown', emoji: '🏙️' },
      { id: 'no_boring', label: 'Can\'t be boring / suburban', emoji: '😴' },
      { id: 'no_expensive', label: 'Nothing over $1,600/mo', emoji: '💸' },
      { id: 'none', label: 'No dealbreakers — I\'m open!', emoji: '✅' },
    ],
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────

function parseRent(rentStr: string): number {
  return parseInt(rentStr.replace(/[^0-9]/g, ''), 10) || 0;
}

function parseCommuteMinutes(commute: string): number {
  const match = commute.match(/(\d+)/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export interface NeighborhoodScore {
  neighborhood: Neighborhood;
  score: number;
  maxScore: number;
  percentage: number;
  matchReasons: string[];
  warnings: string[];
}

export function scoreNeighborhoods(answers: QuizAnswers): NeighborhoodScore[] {
  const results = allNeighborhoods.map(n => {
    let score = 0;
    let maxScore = 0;
    const matchReasons: string[] = [];
    const warnings: string[] = [];
    const rent = n.monthlyCosts.rent1br;

    // ── Budget (30 points max) ──────────────────────────────
    maxScore += 30;
    const budget = answers.budget as string;
    if (budget === 'under1300') {
      if (rent <= 1300) { score += 30; matchReasons.push('Within your budget'); }
      else if (rent <= 1450) { score += 15; matchReasons.push('Slightly above budget'); }
      else { warnings.push(`Rent is $${rent}/mo — above your budget`); }
    } else if (budget === '1300to1600') {
      if (rent >= 1300 && rent <= 1600) { score += 30; matchReasons.push('Right in your budget sweet spot'); }
      else if (rent < 1300) { score += 25; matchReasons.push('Under budget — more money for fun'); }
      else if (rent <= 1750) { score += 15; matchReasons.push('Slightly above budget'); }
      else { warnings.push(`Rent is $${rent}/mo — above your budget`); }
    } else if (budget === '1600to1900') {
      if (rent >= 1500 && rent <= 1900) { score += 30; matchReasons.push('Right in your budget range'); }
      else if (rent < 1500) { score += 25; matchReasons.push('Under budget — save or upgrade'); }
      else if (rent <= 2100) { score += 15; matchReasons.push('Slightly above budget'); }
      else { warnings.push(`Rent is $${rent}/mo — above your budget`); }
    } else if (budget === 'over1900') {
      if (rent >= 1700) { score += 30; matchReasons.push('Premium neighborhood in your range'); }
      else { score += 20; matchReasons.push('Under budget — great value'); }
    }

    // ── Commute (20 points max) ─────────────────────────────
    maxScore += 20;
    const commute = answers.commute as string;
    const commuteMin = parseCommuteMinutes(n.stats.commuteToUptown);
    const hasTransit = n.stats.transitScore >= 40 || n.stats.commuteToUptown.toLowerCase().includes('lynx');
    const walkable = n.stats.walkScore >= 65;

    if (commute === 'walk_transit') {
      if (hasTransit && walkable) { score += 20; matchReasons.push('Walkable with great transit'); }
      else if (hasTransit || walkable) { score += 12; matchReasons.push(walkable ? 'Very walkable area' : 'Has transit access'); }
      else { score += 3; warnings.push('Car-dependent — limited transit'); }
    } else if (commute === 'short_drive') {
      if (commuteMin <= 15) { score += 20; matchReasons.push(`Only ${n.stats.commuteToUptown} to Uptown`); }
      else if (commuteMin <= 25) { score += 15; matchReasons.push(`${n.stats.commuteToUptown} to Uptown`); }
      else { score += 8; warnings.push(`${n.stats.commuteToUptown} to Uptown — longer drive`); }
    } else if (commute === 'remote') {
      // Remote workers value walkability and local amenities
      if (walkable) { score += 20; matchReasons.push('Walkable — great for WFH breaks'); }
      else if (n.stats.walkScore >= 40) { score += 15; matchReasons.push('Decent walkability for errands'); }
      else { score += 10; }
    } else {
      // Don't care — give everyone decent points
      score += 15;
    }

    // ── Vibe (20 points max) ────────────────────────────────
    maxScore += 20;
    const vibe = answers.vibe as string;
    const nightlife = n.stats.nightlifeLevel;
    const isUrban = n.stats.walkScore >= 70 && (nightlife === 'active' || nightlife === 'moderate');
    const isArtsy = n.tags.some(t => t.includes('Art') || t.includes('Creative') || t.includes('Music') || t.includes('Eclectic') || t.includes('Murals'));
    const isQuietCharm = (n.stats.crimeLevel === 'low' || n.stats.crimeLevel === 'very low') && nightlife === 'quiet' && n.stats.walkScore >= 50;
    const isSuburban = n.metroType === 'suburb' || n.metroType === 'exurb' || n.stats.familyScore >= 4;
    const isNature = n.tags.some(t => t.includes('Lake') || t.includes('Nature') || t.includes('Greenway') || t.includes('Waterfront') || t.includes('Trail'));

    if (vibe === 'urban_buzz') {
      if (isUrban && nightlife === 'active') { score += 20; matchReasons.push('Vibrant nightlife and urban energy'); }
      else if (isUrban) { score += 15; matchReasons.push('Good urban vibe'); }
      else if (nightlife === 'moderate') { score += 8; }
      else { score += 2; }
    } else if (vibe === 'artsy_eclectic') {
      if (isArtsy) { score += 20; matchReasons.push('Creative, eclectic community'); }
      else if (n.tags.some(t => t.includes('Culture') || t.includes('Diverse'))) { score += 12; matchReasons.push('Culturally rich area'); }
      else { score += 3; }
    } else if (vibe === 'quiet_charm') {
      if (isQuietCharm) { score += 20; matchReasons.push('Quiet, charming, tree-lined streets'); }
      else if (nightlife === 'quiet' || nightlife === 'moderate') { score += 12; }
      else { score += 3; }
    } else if (vibe === 'suburban_comfort') {
      if (isSuburban) { score += 20; matchReasons.push('Suburban comfort with space'); }
      else if (n.stats.familyScore >= 3) { score += 12; }
      else { score += 3; }
    } else if (vibe === 'lakefront_nature') {
      if (isNature) { score += 20; matchReasons.push('Great outdoor and nature access'); }
      else if (n.tags.some(t => t.includes('Park') || t.includes('Green'))) { score += 10; }
      else { score += 3; }
    }

    // ── Household (15 points max) ───────────────────────────
    maxScore += 15;
    const household = answers.household as string;
    if (household === 'solo') {
      if (nightlife === 'active' && walkable) { score += 15; matchReasons.push('Great social scene for singles'); }
      else if (nightlife === 'active' || nightlife === 'moderate') { score += 10; }
      else { score += 5; }
    } else if (household === 'couple') {
      if (n.stats.walkScore >= 50 && (nightlife === 'active' || nightlife === 'moderate')) { score += 15; matchReasons.push('Great date-night options'); }
      else if (n.stats.walkScore >= 40) { score += 10; }
      else { score += 5; }
    } else if (household === 'young_family') {
      if (n.stats.familyScore >= 4 && n.stats.crimeLevel !== 'moderate') { score += 15; matchReasons.push('Family-friendly with good amenities'); }
      else if (n.stats.familyScore >= 3) { score += 10; }
      else { score += 3; }
    } else if (household === 'school_family') {
      const schoolGrade = n.stats.schoolTier;
      if ((schoolGrade === 'A+' || schoolGrade === 'A') && n.stats.familyScore >= 4) { score += 15; matchReasons.push(`${schoolGrade} schools — top-rated district`); }
      else if (schoolGrade === 'A-' || schoolGrade === 'A') { score += 12; matchReasons.push(`${schoolGrade} schools`); }
      else if (schoolGrade.startsWith('B')) { score += 6; }
      else { score += 2; warnings.push(`Schools rated ${schoolGrade}`); }
    } else if (household === 'pet_parent') {
      if (n.stats.petFriendly >= 4) { score += 15; matchReasons.push('Very pet-friendly — parks and trails'); }
      else if (n.stats.petFriendly >= 3) { score += 10; matchReasons.push('Pet-friendly area'); }
      else { score += 4; }
    }

    // ── Priorities (10 points each, max 20) ─────────────────
    const priorities = (answers.priorities || []) as string[];
    maxScore += priorities.length * 10;

    for (const p of priorities) {
      if (p === 'walkability') {
        if (n.stats.walkScore >= 70) { score += 10; matchReasons.push(`Walk Score: ${n.stats.walkScore}`); }
        else if (n.stats.walkScore >= 50) { score += 6; }
        else { score += 2; }
      } else if (p === 'schools') {
        const tier = n.stats.schoolTier;
        if (tier === 'A+' || tier === 'A') { score += 10; matchReasons.push(`${tier} rated schools`); }
        else if (tier === 'A-' || tier.startsWith('B')) { score += 6; }
        else { score += 2; }
      } else if (p === 'nightlife') {
        if (nightlife === 'active') { score += 10; matchReasons.push('Active nightlife & dining scene'); }
        else if (nightlife === 'moderate') { score += 6; }
        else { score += 1; }
      } else if (p === 'safety') {
        if (n.stats.crimeLevel === 'very low') { score += 10; matchReasons.push('Very low crime area'); }
        else if (n.stats.crimeLevel === 'low') { score += 8; matchReasons.push('Low crime area'); }
        else if (n.stats.crimeLevel === 'moderate') { score += 3; }
        else { score += 1; }
      } else if (p === 'diversity') {
        if (n.tags.some(t => t.includes('Diverse') || t.includes('International') || t.includes('Culture'))) {
          score += 10; matchReasons.push('Culturally diverse community');
        } else if (n.stats.lgbtqFriendly) { score += 6; }
        else { score += 2; }
      } else if (p === 'outdoor') {
        if (isNature || n.tags.some(t => t.includes('Park') || t.includes('Trail') || t.includes('Green'))) {
          score += 10; matchReasons.push('Great parks and outdoor access');
        } else { score += 3; }
      } else if (p === 'value') {
        if (rent <= 1300) { score += 10; matchReasons.push('Excellent value — low rent'); }
        else if (rent <= 1500) { score += 7; matchReasons.push('Good value for the area'); }
        else { score += 3; }
      } else if (p === 'trendy') {
        if (n.stats.newConstruction && (nightlife === 'active' || nightlife === 'moderate')) {
          score += 10; matchReasons.push('Trendy, up-and-coming area');
        } else if (n.stats.newConstruction) { score += 6; }
        else { score += 2; }
      }
    }

    // ── Dealbreakers (negative scoring) ─────────────────────
    const dealbreakers = (answers.dealbreaker || []) as string[];
    for (const d of dealbreakers) {
      if (d === 'none') continue;
      if (d === 'no_car_dependent' && n.stats.walkScore < 50 && !hasTransit) {
        score -= 15; warnings.push('Car-dependent area');
      }
      if (d === 'no_noisy' && (nightlife === 'active' || n.stats.newConstruction)) {
        score -= 10; warnings.push(nightlife === 'active' ? 'Active nightlife scene' : 'New construction nearby');
      }
      if (d === 'no_far_uptown' && commuteMin > 20) {
        score -= 12; warnings.push(`${n.stats.commuteToUptown} from Uptown`);
      }
      if (d === 'no_boring' && nightlife === 'quiet' && n.stats.walkScore < 40) {
        score -= 10; warnings.push('Quiet suburban area');
      }
      if (d === 'no_expensive' && rent > 1600) {
        score -= 15; warnings.push(`Rent is $${rent}/mo`);
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Deduplicate reasons
    const uniqueReasons = Array.from(new Set(matchReasons)).slice(0, 4);
    const uniqueWarnings = Array.from(new Set(warnings)).slice(0, 2);

    return {
      neighborhood: n,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      matchReasons: uniqueReasons,
      warnings: uniqueWarnings,
    };
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

// ─── Match Label ──────────────────────────────────────────────────
export function getMatchLabel(percentage: number): { label: string; color: string } {
  if (percentage >= 85) return { label: 'Perfect Match', color: 'text-emerald-500' };
  if (percentage >= 70) return { label: 'Strong Match', color: 'text-clt-teal' };
  if (percentage >= 55) return { label: 'Good Match', color: 'text-clt-gold' };
  if (percentage >= 40) return { label: 'Decent Match', color: 'text-orange-400' };
  return { label: 'Weak Match', color: 'text-muted-foreground' };
}
