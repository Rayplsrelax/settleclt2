/* ============================================
   SETTLE CLT — Neighborhood Future Developments
   What's Coming data for each neighborhood
   ============================================ */

export interface Development {
  title: string;
  type: 'new-business' | 'residential' | 'mixed-use' | 'infrastructure' | 'park' | 'entertainment' | 'commercial';
  status: 'announced' | 'under-construction' | 'opening-soon';
  timeline: string;
  description: string;
  impact: string;
  source?: string;
}

export const neighborhoodDevelopments: Record<string, Development[]> = {
  'south-end': [
    {
      title: 'Avery Hall',
      type: 'mixed-use',
      status: 'under-construction',
      timeline: 'Late 2026',
      description: '8-story development with 263 apartments and ground-floor retail on South Tryon Street.',
      impact: 'More housing options and walkable retail along the Blue Line corridor.',
    },
    {
      title: 'Linea Development — Half Shell',
      type: 'new-business',
      status: 'opening-soon',
      timeline: 'Early 2026',
      description: 'Seafood restaurant Half Shell is coming to the Linea mixed-use development at 2161 Hawkins St.',
      impact: 'Adds a new dining category to South End\'s restaurant scene.',
    },
    {
      title: 'South End Station Area Plan',
      type: 'infrastructure',
      status: 'announced',
      timeline: '2026–2028',
      description: 'City-led plan to improve pedestrian connections, add protected bike lanes, and expand the Rail Trail network.',
      impact: 'Better walkability and safer cycling infrastructure for residents.',
    },
  ],
  'noda': [
    {
      title: 'NoDa Brewing Expansion',
      type: 'commercial',
      status: 'under-construction',
      timeline: 'Mid 2026',
      description: 'NoDa Brewing Company expanding their taproom and adding an outdoor event space.',
      impact: 'More community gathering space in the heart of the arts district.',
    },
    {
      title: '36th Street Streetscape',
      type: 'infrastructure',
      status: 'announced',
      timeline: '2026–2027',
      description: 'Pedestrian improvements along 36th Street including wider sidewalks, street trees, and better crosswalks.',
      impact: 'Safer walking experience in NoDa\'s main commercial corridor.',
    },
  ],
  'plaza-midwood': [
    {
      title: 'Central Avenue Corridor Plan',
      type: 'infrastructure',
      status: 'announced',
      timeline: '2026–2028',
      description: 'Multi-phase streetscape improvements along Central Avenue with bike lanes, transit improvements, and pedestrian safety upgrades.',
      impact: 'Better connectivity and safety for the neighborhood\'s main street.',
    },
    {
      title: 'New Retail at Commonwealth',
      type: 'new-business',
      status: 'opening-soon',
      timeline: 'Spring 2026',
      description: 'Several new restaurants and boutiques opening in the Commonwealth corridor near Thomas Street.',
      impact: 'Expanding the walkable retail and dining options beyond Central Avenue.',
    },
  ],
  'dilworth': [
    {
      title: 'Dilworth Greenway Extension',
      type: 'park',
      status: 'under-construction',
      timeline: 'Fall 2026',
      description: 'Extension of the Little Sugar Creek Greenway through Dilworth connecting to Freedom Park.',
      impact: 'Continuous greenway access from South End through Dilworth to Freedom Park.',
    },
    {
      title: 'East Boulevard Revitalization',
      type: 'mixed-use',
      status: 'announced',
      timeline: '2027',
      description: 'Mixed-use redevelopment along East Boulevard with new retail, restaurants, and apartments.',
      impact: 'Modernizing the neighborhood\'s main commercial street while preserving historic character.',
    },
  ],
  'uptown': [
    {
      title: 'Brooklyn & Church',
      type: 'residential',
      status: 'under-construction',
      timeline: '2027',
      description: 'Conversion of a former Duke Energy office tower into residential apartments, adding hundreds of new units to Uptown.',
      impact: 'Part of a broader office-to-residential trend that will bring more full-time residents to Uptown.',
    },
    {
      title: 'Iron District',
      type: 'mixed-use',
      status: 'under-construction',
      timeline: '2026–2030',
      description: '55-acre mixed-use development between Uptown and South End featuring offices, apartments, retail, and entertainment venues.',
      impact: 'Will bridge the gap between Uptown and South End, creating a new live-work-play district.',
    },
  ],
  'university-city': [
    {
      title: 'UNCC Innovation District',
      type: 'commercial',
      status: 'announced',
      timeline: '2027–2029',
      description: 'Tech-focused development near UNC Charlotte campus with office space, labs, and startup incubators.',
      impact: 'Creating a tech hub that could rival South End for young professionals in STEM.',
    },
    {
      title: 'Silver Line Light Rail Extension',
      type: 'infrastructure',
      status: 'announced',
      timeline: '2028+',
      description: 'Planned east-west light rail line that would connect University City to the airport via Uptown.',
      impact: 'Game-changing transit access that would dramatically increase connectivity and property values.',
    },
  ],
  'ballantyne': [
    {
      title: 'Ballantyne Reimagined',
      type: 'mixed-use',
      status: 'under-construction',
      timeline: '2026–2028',
      description: 'Major redevelopment of the Ballantyne corporate campus into a walkable mixed-use town center with apartments, retail, restaurants, and green space.',
      impact: 'Transforming a suburban office park into a vibrant walkable destination.',
    },
  ],
  'camp-north-end': [
    {
      title: 'Jamestown LP Master Plan',
      type: 'mixed-use',
      status: 'announced',
      timeline: '2026–2030',
      description: 'New lead developer Jamestown LP (owners of Ponce City Market in Atlanta) plans to accelerate multifamily, hotel, retail, and office construction across the campus.',
      impact: 'Expect Camp North End to grow significantly with Atlanta\'s Ponce City Market as the model.',
    },
    {
      title: 'New Road Infrastructure',
      type: 'infrastructure',
      status: 'announced',
      timeline: '2027',
      description: 'Complete realignment of Nazarene Camp Road with a new road and full intersection to improve access.',
      impact: 'Better traffic flow and access to the growing Camp North End district.',
    },
  ],
  'eastland': [
    {
      title: 'Eastland Yards — Solstice Retail',
      type: 'new-business',
      status: 'opening-soon',
      timeline: 'Fall 2026',
      description: 'Four new businesses opening at Solstice at Eastland Yards: Rumbao Latin Dance Company, Suites by Alvaranga Collection, Higher Grounds by Manolo\'s, and Artisen Gelato.',
      impact: 'First wave of retail bringing dining, dance, and culture to East Charlotte\'s biggest development.',
    },
    {
      title: 'Eastland Park',
      type: 'park',
      status: 'under-construction',
      timeline: 'Spring 2027',
      description: '4.5-acre park with playground, splashpad, and walking trails paying homage to the former Eastland Mall.',
      impact: 'A much-needed green space for East Charlotte families.',
    },
    {
      title: 'Eastland Sports Complex',
      type: 'entertainment',
      status: 'under-construction',
      timeline: 'Late 2028',
      description: '$67 million sports hub with 6 outdoor soccer fields and 10 basketball courts, managed by Charlotte Soccer Academy.',
      impact: 'Expected to generate $169M for the city, create 500+ jobs, and fill 130K hotel rooms annually.',
    },
  ],
  'river-district': [
    {
      title: 'River District Corporate Campus',
      type: 'commercial',
      status: 'announced',
      timeline: '2027–2028',
      description: 'Corporate campus development as the next major phase of the River District master plan.',
      impact: 'Bringing major employers to west Charlotte, reducing commute times for River District residents.',
    },
    {
      title: 'River District Hotel & Retail',
      type: 'mixed-use',
      status: 'announced',
      timeline: '2027',
      description: 'Hotel and retail development planned as part of the River District\'s next phase, following the first residential move-ins.',
      impact: 'Adding hospitality and shopping to Charlotte\'s newest master-planned community.',
    },
  ],
  'elizabeth': [
    {
      title: 'Elizabeth Greenway Connector',
      type: 'park',
      status: 'announced',
      timeline: '2027',
      description: 'New greenway segment connecting Elizabeth to the Little Sugar Creek Greenway and Independence Park.',
      impact: 'Better pedestrian and cycling connectivity to Uptown and surrounding neighborhoods.',
    },
  ],
  'myers-park': [
    {
      title: 'SouthPark Mall Redevelopment',
      type: 'mixed-use',
      status: 'announced',
      timeline: '2027–2030',
      description: 'Plans to add residential, office, and green space to the SouthPark Mall area, transforming it from a suburban shopping center into a mixed-use destination.',
      impact: 'Could make the Myers Park / SouthPark area more walkable and vibrant.',
    },
  ],
  'optimist-park': [
    {
      title: 'Optimist Hall Phase 2',
      type: 'mixed-use',
      status: 'under-construction',
      timeline: 'Late 2026',
      description: 'Expansion of the popular Optimist Hall food hall with additional restaurant stalls and coworking space.',
      impact: 'More dining variety and workspace in one of Charlotte\'s most popular food destinations.',
    },
  ],
  'wilmore': [
    {
      title: 'Wilmore Drive Townhomes',
      type: 'residential',
      status: 'under-construction',
      timeline: 'Mid 2026',
      description: 'New townhome development bringing modern housing to this historic neighborhood adjacent to South End.',
      impact: 'More housing options in a walkable, transit-accessible neighborhood.',
    },
  ],
};

// Status badge colors
export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'announced': { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Announced' },
  'under-construction': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Under Construction' },
  'opening-soon': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Opening Soon' },
};

// Type icons
export const TYPE_ICONS: Record<string, string> = {
  'new-business': '🏪',
  'residential': '🏠',
  'mixed-use': '🏗️',
  'infrastructure': '🛤️',
  'park': '🌳',
  'entertainment': '🎭',
  'commercial': '💼',
};
