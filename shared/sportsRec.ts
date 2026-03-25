/* ============================================
   SETTLE CLT — Sports & Recreation Data
   Charlotte Sports Venues, Teams & Rec Info
   ============================================ */

export interface SportsVenue {
  name: string;
  team: string;
  sport: string;
  league: string;
  lat: number;
  lng: number;
  neighborhood: string;
  capacity: string;
  season: string;
  avgTicket: string;
  transitAccess: string;
  website: string;
}

export interface SportsRec {
  nearbyVenues: { venueName: string; distance: string; access: string }[];
  fanCulture: string;
  recHighlights: string[];
  parkTrails: string[];
  fitnessScene: string;
  youthSports: string;
}

export const CHARLOTTE_VENUES: SportsVenue[] = [
  {
    name: 'Bank of America Stadium',
    team: 'Carolina Panthers',
    sport: 'Football',
    league: 'NFL',
    lat: 35.2258,
    lng: -80.8528,
    neighborhood: 'Uptown',
    capacity: '75,523',
    season: 'Sep – Jan',
    avgTicket: '$85–$250',
    transitAccess: 'LYNX Blue Line (Stonewall Station) + CityLYNX Gold Line',
    website: 'https://www.panthers.com',
  },
  {
    name: 'Spectrum Center',
    team: 'Charlotte Hornets',
    sport: 'Basketball',
    league: 'NBA',
    lat: 35.2251,
    lng: -80.8392,
    neighborhood: 'Uptown',
    capacity: '19,077',
    season: 'Oct – Apr',
    avgTicket: '$30–$180',
    transitAccess: 'LYNX Blue Line (3rd St/Convention Center) + CityLYNX Gold Line',
    website: 'https://www.nba.com/hornets',
  },
  {
    name: 'Bank of America Stadium',
    team: 'Charlotte FC',
    sport: 'Soccer',
    league: 'MLS',
    lat: 35.2258,
    lng: -80.8528,
    neighborhood: 'Uptown',
    capacity: '38,000 (soccer config)',
    season: 'Feb – Oct',
    avgTicket: '$25–$120',
    transitAccess: 'LYNX Blue Line (Stonewall Station) + CityLYNX Gold Line',
    website: 'https://www.charlottefc.com',
  },
  {
    name: 'Truist Field',
    team: 'Charlotte Knights',
    sport: 'Baseball',
    league: 'AAA (MiLB)',
    lat: 35.2275,
    lng: -80.8486,
    neighborhood: 'Uptown',
    capacity: '10,200',
    season: 'Apr – Sep',
    avgTicket: '$12–$45',
    transitAccess: 'LYNX Blue Line (Stonewall Station), walkable from Uptown',
    website: 'https://www.milb.com/charlotte',
  },
  {
    name: 'Bojangles Coliseum',
    team: 'Charlotte Checkers',
    sport: 'Hockey',
    league: 'AHL',
    lat: 35.2063,
    lng: -80.8134,
    neighborhood: 'East Charlotte',
    capacity: '9,605',
    season: 'Oct – Apr',
    avgTicket: '$15–$50',
    transitAccess: 'Bus routes, Independence Blvd corridor',
    website: 'https://www.gocheckers.com',
  },
  {
    name: 'Charlotte Motor Speedway',
    team: 'NASCAR',
    sport: 'Auto Racing',
    league: 'NASCAR Cup Series',
    lat: 35.3522,
    lng: -80.6831,
    neighborhood: 'Concord',
    capacity: '89,000',
    season: 'May (Coca-Cola 600) + Oct (Bank of America ROVAL 400)',
    avgTicket: '$50–$300',
    transitAccess: 'Drive only — I-85 corridor, ~25 min from Uptown',
    website: 'https://www.charlottemotorspeedway.com',
  },
  {
    name: 'Atrium Health Amphitheatre',
    team: 'Various (concerts & events)',
    sport: 'Entertainment',
    league: 'N/A',
    lat: 35.2395,
    lng: -80.7456,
    neighborhood: 'University City',
    capacity: '19,500',
    season: 'Year-round',
    avgTicket: '$30–$150',
    transitAccess: 'LYNX Blue Line (University City Blvd Station)',
    website: 'https://www.livenation.com',
  },
];

/** Sports & Recreation data for each neighborhood, keyed by neighborhood ID */
export const NEIGHBORHOOD_SPORTS_REC: Record<string, SportsRec> = {
  'south-end': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '1.2 mi', access: '5 min LYNX or 20 min walk' },
      { venueName: 'Spectrum Center', distance: '1.5 mi', access: '5 min LYNX' },
      { venueName: 'Truist Field', distance: '1.3 mi', access: '5 min LYNX' },
    ],
    fanCulture: 'South End is ground zero for Charlotte\'s sports bar scene. On Panthers game days, Southbound and Pins Mechanical transform into massive watch parties. The Rail Trail fills with fans walking to Bank of America Stadium. Charlotte FC match days bring a European-style energy with supporter groups marching from local breweries.',
    recHighlights: [
      'Rail Trail — 3.5-mile paved path for running, biking, and commuting',
      'Little Sugar Creek Greenway — connects to Uptown and beyond',
      'MAD Fitness, F45, and boutique studios on every block',
      'Topgolf Charlotte — 15 min drive for driving range + entertainment',
    ],
    parkTrails: ['Little Sugar Creek Greenway', 'Rail Trail', 'Latta Park (adjacent in Dilworth)'],
    fitnessScene: 'Boutique fitness capital of Charlotte. F45, Orangetheory, CrossFit South End, yoga studios, and cycling classes are all walkable. The Rail Trail doubles as an outdoor gym for runners and cyclists.',
    youthSports: 'Limited — South End is primarily young professionals. Families head to Dilworth or Sedgefield parks for youth leagues.',
  },

  'noda': {
    nearbyVenues: [
      { venueName: 'Spectrum Center', distance: '2.5 mi', access: '10 min drive or bus' },
      { venueName: 'Bank of America Stadium', distance: '3 mi', access: '12 min drive' },
      { venueName: 'Truist Field', distance: '2.8 mi', access: '10 min drive' },
    ],
    fanCulture: 'NoDa\'s sports culture is more indie than mainstream. You\'ll find dive bars showing games alongside live music, and the neighborhood rallies hard for Charlotte FC. Craft breweries like NoDa Brewing host watch parties with a laid-back, community vibe rather than a corporate sports bar feel.',
    recHighlights: [
      'NoDa Greenway — connects to Little Sugar Creek trail system',
      'Disc golf at Reedy Creek Park',
      'NoDa Brewing Company run club (weekly)',
      'Skateboarding scene at local parks',
    ],
    parkTrails: ['NoDa Greenway', 'Reedy Creek Park', 'Charles Avenue Park'],
    fitnessScene: 'Independent gyms and yoga studios fit the neighborhood\'s creative spirit. Run clubs from local breweries are a social staple. Less corporate fitness, more community-driven.',
    youthSports: 'Reedy Creek Park offers youth soccer and baseball fields. Growing family presence means more youth programs emerging.',
  },

  'plaza-midwood': {
    nearbyVenues: [
      { venueName: 'Bojangles Coliseum', distance: '1.5 mi', access: '5 min drive' },
      { venueName: 'Spectrum Center', distance: '3 mi', access: '10 min drive' },
      { venueName: 'Bank of America Stadium', distance: '3.5 mi', access: '12 min drive' },
    ],
    fanCulture: 'Plaza Midwood is where you watch the game at a neighborhood bar while eating some of the best food in Charlotte. Thomas Street Tavern is legendary for game-day crowds. The neighborhood skews more "foodie who also watches sports" than die-hard fan zone.',
    recHighlights: [
      'Midwood Park — community gathering spot with open fields',
      'Briar Creek Greenway — running and cycling path',
      'Kickball and softball leagues at local parks',
      'Yoga and martial arts studios along Central Ave',
    ],
    parkTrails: ['Midwood Park', 'Briar Creek Greenway', 'Independence Park (nearby)'],
    fitnessScene: 'Eclectic mix of yoga studios, martial arts dojos, and independent gyms. The neighborhood\'s walkability means many residents use walking and cycling as their primary fitness.',
    youthSports: 'Winterfield Elementary area has youth programs. Community leagues for kickball and softball are popular among adults.',
  },

  'dilworth': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '1.5 mi', access: '5 min drive or 25 min walk' },
      { venueName: 'Spectrum Center', distance: '2 mi', access: '8 min drive' },
      { venueName: 'Truist Field', distance: '1.8 mi', access: '7 min drive' },
    ],
    fanCulture: 'Dilworth\'s sports culture revolves around Latta Park and the neighborhood\'s family-friendly energy. Game days see families walking to Bank of America Stadium along tree-lined streets. Local spots like The Dilworth Neighborhood Grille host watch parties with a more refined, neighborhood-pub atmosphere.',
    recHighlights: [
      'Latta Park — tennis courts, playground, open fields, community events',
      'Little Sugar Creek Greenway — major trail access point',
      'Freedom Park (adjacent) — lake, trails, and sports fields',
      'Charlotte Tennis Club nearby',
    ],
    parkTrails: ['Latta Park', 'Little Sugar Creek Greenway', 'Freedom Park'],
    fitnessScene: 'Family-oriented fitness with yoga studios, personal training, and running groups along the greenway. Latta Park tennis courts are popular. Many residents run the Freedom Park loop.',
    youthSports: 'Strong youth sports scene — Dilworth Little League, youth soccer at Latta Park, swim teams at neighborhood pools. One of the best areas for kids in organized sports.',
  },

  'uptown': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '0.3 mi', access: 'Walk' },
      { venueName: 'Spectrum Center', distance: '0.2 mi', access: 'Walk' },
      { venueName: 'Truist Field', distance: '0.1 mi', access: 'Walk' },
    ],
    fanCulture: 'You live at the epicenter. Every major Charlotte sporting event is literally in your backyard. Panthers tailgates spill into your streets, Hornets games are a 5-minute walk, and Knights baseball is perfect for weeknight entertainment. The energy on game days is electric — and loud.',
    recHighlights: [
      'Romare Bearden Park — open green space in the heart of Uptown',
      'First Ward Park — running paths and fitness areas',
      'Marshall Park — trails and open space',
      'Uptown YMCA — full-service fitness center',
    ],
    parkTrails: ['Romare Bearden Park', 'First Ward Park', 'Marshall Park', 'Little Sugar Creek Greenway access'],
    fitnessScene: 'Corporate fitness centers, the Uptown YMCA, and boutique studios cater to the professional crowd. Rooftop yoga and running clubs are popular. The greenway system connects to longer trails.',
    youthSports: 'Limited — Uptown is primarily professionals and empty-nesters. Families in Uptown typically travel to nearby neighborhoods for youth sports.',
  },

  'university-city': {
    nearbyVenues: [
      { venueName: 'Atrium Health Amphitheatre', distance: '1 mi', access: '5 min drive or LYNX' },
      { venueName: 'Spectrum Center', distance: '9 mi', access: '25 min LYNX Blue Line' },
      { venueName: 'Bank of America Stadium', distance: '10 mi', access: '25 min LYNX' },
    ],
    fanCulture: 'UNC Charlotte\'s 49ers bring college sports energy — football at Jerry Richardson Stadium and basketball at Halton Arena. The student population creates a lively game-day atmosphere at bars along University City Blvd. It\'s a different vibe from Uptown\'s pro sports — more tailgating and school spirit.',
    recHighlights: [
      'UNC Charlotte campus trails and recreation center (community memberships available)',
      'Mallard Creek Greenway — 4+ miles of paved trail',
      'David B. Waymer Flying Field Park',
      'University Recreation Center — pools, courts, climbing wall',
    ],
    parkTrails: ['Mallard Creek Greenway', 'UNC Charlotte Botanical Gardens', 'University City Park'],
    fitnessScene: 'Affordable gyms and fitness chains dominate. UNC Charlotte\'s recreation center offers community memberships with excellent facilities. Chain gyms like Planet Fitness and LA Fitness are plentiful.',
    youthSports: 'Strong youth sports infrastructure — soccer leagues, baseball at Mallard Creek, and swim teams. The suburban layout provides plenty of field space.',
  },

  'myers-park': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '3 mi', access: '10 min drive' },
      { venueName: 'Spectrum Center', distance: '3.5 mi', access: '12 min drive' },
      { venueName: 'Truist Field', distance: '3.2 mi', access: '10 min drive' },
    ],
    fanCulture: 'Myers Park\'s sports culture is more country club than sports bar. Residents have Panthers season tickets and attend Hornets games in suites. The neighborhood\'s sports identity is tied to golf, tennis, and private club athletics rather than rowdy game-day energy.',
    recHighlights: [
      'Freedom Park — 98-acre park with lake, trails, tennis, and sports fields',
      'Myers Park Country Club — golf, tennis, swimming (private)',
      'Charlotte Country Club — golf and social (private)',
      'Queens University athletic facilities',
    ],
    parkTrails: ['Freedom Park', 'Little Sugar Creek Greenway', 'Queens Road West walking paths'],
    fitnessScene: 'Private clubs, upscale yoga studios (like Y2 Yoga), personal trainers, and Pilates dominate. Freedom Park is the outdoor fitness hub with running loops and tennis courts.',
    youthSports: 'Elite youth sports — Myers Park swim teams, tennis academies, private school athletics (Myers Park High, Providence Day). Strong lacrosse and soccer programs.',
  },

  'ballantyne': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '14 mi', access: '25 min drive via I-485/I-77' },
      { venueName: 'Spectrum Center', distance: '14 mi', access: '25 min drive' },
    ],
    fanCulture: 'Ballantyne\'s sports culture revolves around family athletics and upscale sports bars. Friday night football at Ardrey Kell High School is a community event. The Ballantyne Hotel golf course hosts PGA-level events. Sports bars at Ballantyne Village and along Johnston Road fill up for Panthers and Hornets games with a well-dressed, family-friendly crowd.',
    recHighlights: [
      'Ballantyne District Park — fields, courts, walking trails, and community events',
      'Ballantyne Hotel Golf Club — championship 18-hole course',
      'Ballantyne YMCA — full-service fitness, pool, and youth programs',
      'Numerous private sports training facilities along Johnston Road',
    ],
    parkTrails: ['Ballantyne District Park', 'McAlpine Creek Greenway', 'Park Road Park'],
    fitnessScene: 'Premium fitness options dominate — Lifetime Fitness, boutique studios, and the Ballantyne YMCA. The Ballantyne Hotel spa and fitness center cater to the upscale crowd. Running and cycling along the greenway system is popular.',
    youthSports: 'Ballantyne is a youth sports powerhouse. Travel baseball, soccer, lacrosse, and competitive swim teams are a way of life. Ardrey Kell and Olympic high school athletics are highly competitive. Families organize their schedules around kids\' sports seasons.',
  },

  'wesley-heights': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '1 mi', access: '5 min drive or 15 min walk' },
      { venueName: 'Spectrum Center', distance: '1.5 mi', access: '8 min drive' },
      { venueName: 'Truist Field', distance: '1.2 mi', access: '5 min drive' },
    ],
    fanCulture: 'Wesley Heights is close enough to Uptown that game-day energy spills into the neighborhood. Local bars and restaurants fill up on Panthers Sundays. The neighborhood\'s growing food scene means more sports-watching options are popping up alongside new breweries and restaurants.',
    recHighlights: [
      'Frazier Park — renovated park with sports fields and playground',
      'Stewart Creek Greenway — connects to larger trail network',
      'Proximity to Uptown venues for pickup basketball and running',
      'Growing cycling community using West Morehead corridor',
    ],
    parkTrails: ['Frazier Park', 'Stewart Creek Greenway', 'Irwin Creek Greenway'],
    fitnessScene: 'Emerging fitness scene with new studios opening alongside the neighborhood\'s development. Many residents use the greenway system for running and cycling. CrossFit and independent gyms are nearby.',
    youthSports: 'Frazier Park hosts youth sports programs. The neighborhood is growing its family infrastructure as more young families move in.',
  },

  // Metro Charlotte areas
  'southpark': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '6 mi', access: '15 min drive' },
      { venueName: 'Spectrum Center', distance: '6.5 mi', access: '18 min drive' },
    ],
    fanCulture: 'SouthPark\'s sports culture mirrors Myers Park — upscale and club-oriented. Sports bars at SouthPark Mall and along Sharon Road draw a well-dressed crowd for big games. Many Panthers and Hornets players live in SouthPark, so celebrity sightings at local restaurants on off-days aren\'t uncommon.',
    recHighlights: [
      'SouthPark Community Park — fields, courts, and walking trails',
      'Symphony Park — green space and community events',
      'SouthPark YMCA — full-service fitness and pool',
      'Lifetime Fitness — premium gym with indoor/outdoor pools',
    ],
    parkTrails: ['SouthPark Community Park', 'Symphony Park', 'McMullen Creek Greenway'],
    fitnessScene: 'Premium fitness options — Lifetime Fitness, Equinox-style boutique studios, private training. The SouthPark YMCA is one of the best in the system. Pilates, barre, and yoga studios line Sharon Road.',
    youthSports: 'Excellent youth sports — SouthPark swim teams, soccer leagues, and access to top private school athletics. Many travel sports teams are based here.',
  },

  'elizabeth': {
    nearbyVenues: [
      { venueName: 'Spectrum Center', distance: '1.5 mi', access: '5 min drive or 20 min walk' },
      { venueName: 'Bank of America Stadium', distance: '2 mi', access: '8 min drive' },
      { venueName: 'Truist Field', distance: '1.8 mi', access: '7 min drive' },
    ],
    fanCulture: 'Elizabeth\'s proximity to Uptown means easy access to all pro sports. The neighborhood\'s bar scene along Elizabeth Ave fills up on game days. It\'s a walkable neighborhood, so many residents stroll to Uptown venues. The medical district workers add a weekday energy that transitions to sports-fan energy on evenings and weekends.',
    recHighlights: [
      'Independence Park — Charlotte\'s oldest park with tennis, trails, and fields',
      'Elizabeth Greenway — connects to Little Sugar Creek system',
      'Novant Health athletic training facilities nearby',
      'Running routes through historic tree-lined streets',
    ],
    parkTrails: ['Independence Park', 'Elizabeth Greenway', 'Little Sugar Creek Greenway'],
    fitnessScene: 'Mix of hospital-affiliated wellness programs and independent studios. Independence Park is the fitness hub with tennis courts and running paths. Walkability means many residents stay active just getting around.',
    youthSports: 'Independence Park youth programs, Elizabeth Traditional Elementary sports, and proximity to Dilworth\'s strong youth sports scene.',
  },

  'loso': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '2.5 mi', access: '8 min drive' },
      { venueName: 'Spectrum Center', distance: '3 mi', access: '10 min drive' },
      { venueName: 'Truist Field', distance: '2.8 mi', access: '9 min drive' },
    ],
    fanCulture: 'LoSo is building its own sports identity as the neighborhood grows. Breweries like Lower Left and Lenny Boy host watch parties with a creative, community-first vibe. Charlotte FC supporter groups are particularly strong here — the neighborhood\'s emerging energy aligns with the club\'s growth.',
    recHighlights: [
      'Stewart Creek Greenway — growing trail network',
      'Brewery run clubs (weekly events at multiple breweries)',
      'Scaleybark Park — fields and recreation',
      'Growing cycling infrastructure along South Blvd corridor',
    ],
    parkTrails: ['Stewart Creek Greenway', 'Scaleybark Park', 'Remount Road trails'],
    fitnessScene: 'Brewery run clubs are the signature fitness activity. Independent gyms and CrossFit boxes fit the neighborhood\'s maker/creative culture. Cycling is growing with new bike lanes along South Blvd.',
    youthSports: 'Still developing — LoSo is primarily young professionals and artists. Youth programs are emerging as more families discover the area.',
  },

  'east-charlotte': {
    nearbyVenues: [
      { venueName: 'Bojangles Coliseum', distance: '0.5 mi', access: 'Walk or 3 min drive' },
      { venueName: 'Spectrum Center', distance: '5 mi', access: '15 min drive' },
      { venueName: 'Bank of America Stadium', distance: '5.5 mi', access: '15 min drive' },
    ],
    fanCulture: 'East Charlotte is home to Bojangles Coliseum and the Charlotte Checkers, giving it a unique hockey-town energy. The international community brings global sports passion — you\'ll find soccer watch parties for Premier League, Liga MX, and African leagues at restaurants along Central Ave. It\'s Charlotte\'s most diverse sports culture.',
    recHighlights: [
      'Eastway Park — large recreation complex with pool, fields, and courts',
      'Bojangles Coliseum events beyond hockey',
      'International soccer leagues at local parks',
      'Reedy Creek Nature Preserve — 927 acres of trails',
    ],
    parkTrails: ['Eastway Park', 'Reedy Creek Nature Preserve', 'Briar Creek Greenway'],
    fitnessScene: 'Affordable and diverse — martial arts dojos, boxing gyms, soccer training facilities, and budget-friendly chains. The international community brings unique fitness traditions.',
    youthSports: 'Robust youth soccer scene driven by the international community. Eastway Park hosts multiple youth leagues. Growing basketball programs.',
  },

  'south-charlotte': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '10 mi', access: '20 min drive' },
      { venueName: 'Spectrum Center', distance: '10 mi', access: '22 min drive' },
    ],
    fanCulture: 'South Charlotte is family sports territory. Friday night high school football at Ardrey Kell, Olympic, and Providence is a community ritual. Travel sports teams dominate weekends — you\'ll spend Saturdays at soccer tournaments and baseball diamonds. Sports bars along Rea Road and Ballantyne fill up for Panthers games.',
    recHighlights: [
      'McAlpine Creek Park — cross-country course, disc golf, greenway',
      'Ballantyne District Park — fields, courts, and community events',
      'Rea Road YMCA — top-rated family fitness',
      'Numerous private sports training facilities',
    ],
    parkTrails: ['McAlpine Creek Greenway', 'Ballantyne District Park', 'Park Road Park'],
    fitnessScene: 'Family-focused fitness chains, YMCAs, and private training. McAlpine Creek Greenway is the outdoor fitness backbone. Numerous dance studios, gymnastics centers, and martial arts for kids.',
    youthSports: 'Youth sports capital of Charlotte. Travel baseball, soccer, lacrosse, and swim teams are a way of life. South Charlotte families organize their schedules around kids\' sports.',
  },

  'west-charlotte': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '4 mi', access: '12 min drive' },
      { venueName: 'Spectrum Center', distance: '4.5 mi', access: '14 min drive' },
    ],
    fanCulture: 'West Charlotte has deep roots in Charlotte\'s sports history — West Charlotte High School has produced NFL and NBA talent. The community rallies around high school athletics with intense local pride. Pickup basketball at neighborhood parks is a daily tradition.',
    recHighlights: [
      'Revolution Park — major recreation center with pool, gym, and fields',
      'Biddleville-Smallwood Park — community sports hub',
      'Johnson C. Smith University athletics (NCAA Division II)',
      'Growing greenway connections to Uptown',
    ],
    parkTrails: ['Revolution Park', 'Biddleville-Smallwood Park', 'Irwin Creek Greenway'],
    fitnessScene: 'Community recreation centers are the fitness backbone. Revolution Park offers affordable access to pools, courts, and weight rooms. Independent boxing and basketball training gyms have deep community ties.',
    youthSports: 'Strong community-based youth programs through recreation centers and churches. Basketball, football, and track & field are particularly popular. Mentorship-driven sports programs.',
  },

  'huntersville': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '16 mi', access: '25 min drive via I-77' },
      { venueName: 'Spectrum Center', distance: '16 mi', access: '25 min drive' },
    ],
    fanCulture: 'Huntersville is a sports-family town. Youth travel sports dominate the culture — if you have kids, you\'ll know every family at the baseball diamond and soccer field. Adults gather at sports bars in Birkdale Village for Panthers and Hornets games. The town has its own identity separate from Charlotte proper.',
    recHighlights: [
      'Birkdale Village — shops, dining, and community events',
      'Huntersville Family Fitness & Aquatics Center',
      'Northcross District Park — fields, courts, and trails',
      'Latta Nature Preserve — 1,460 acres of trails and equestrian paths',
    ],
    parkTrails: ['Latta Nature Preserve', 'Northcross District Park', 'Torrence Creek Greenway'],
    fitnessScene: 'Family-oriented fitness centers, YMCAs, and chain gyms. Latta Nature Preserve offers serious hiking and mountain biking. Lake Norman access adds kayaking and paddleboarding.',
    youthSports: 'Huntersville is a youth sports powerhouse. Travel baseball, soccer, lacrosse, and swim teams compete at regional and national levels. Northcross District Park is the hub.',
  },

  'lake-norman': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '25 mi', access: '35 min drive via I-77' },
      { venueName: 'Charlotte Motor Speedway', distance: '30 mi', access: '40 min drive' },
    ],
    fanCulture: 'Lake Norman\'s sports culture is water-first. Boating, wakeboarding, fishing, and paddleboarding define the lifestyle. Many NASCAR drivers and crew members live here, so racing culture runs deep. For traditional sports, residents make the drive to Uptown or watch at lakeside restaurants and bars.',
    recHighlights: [
      'Lake Norman — 520 miles of shoreline for boating, fishing, and water sports',
      'Jetton Park — lakefront park with trails and beach',
      'Lake Norman State Park — hiking, swimming, mountain biking',
      'Numerous marinas and boat clubs',
    ],
    parkTrails: ['Lake Norman State Park', 'Jetton Park', 'Ramsey Creek Park'],
    fitnessScene: 'Water sports are the primary fitness activity. Kayaking, paddleboarding, and swimming in the lake. On land, hiking at Lake Norman State Park and cycling along lakeside roads. Chain gyms serve the suburban population.',
    youthSports: 'Lake Norman youth sailing programs, swim teams, and water sports camps. Traditional youth sports through Cornelius and Davidson recreation departments.',
  },

  'matthews': {
    nearbyVenues: [
      { venueName: 'Bojangles Coliseum', distance: '8 mi', access: '15 min drive' },
      { venueName: 'Bank of America Stadium', distance: '12 mi', access: '20 min drive' },
    ],
    fanCulture: 'Matthews is small-town sports pride. Friday night football at Butler High School and David W. Butler Stadium is a community event. The downtown Matthews area has sports bars that fill up for Panthers games. The town maintains its own athletic identity while being close enough to Charlotte for pro sports access.',
    recHighlights: [
      'Squirrel Lake Park — fishing, trails, and nature programs',
      'Matthews Community Center — gym, pool, and fitness classes',
      'Stumptown Park — downtown gathering space and events',
      'Four Mile Creek Greenway — paved trail for running and cycling',
    ],
    parkTrails: ['Squirrel Lake Park', 'Four Mile Creek Greenway', 'Stumptown Park'],
    fitnessScene: 'Community center-based fitness with affordable memberships. The greenway system provides excellent running and cycling. Chain gyms along Independence Blvd corridor.',
    youthSports: 'Excellent youth sports through Matthews Parks & Recreation. Baseball, soccer, basketball, and cheerleading programs. Butler High School athletics are a source of community pride.',
  },

  'concord': {
    nearbyVenues: [
      { venueName: 'Charlotte Motor Speedway', distance: '3 mi', access: '5 min drive' },
      { venueName: 'Bank of America Stadium', distance: '20 mi', access: '30 min drive via I-85' },
    ],
    fanCulture: 'Concord IS motorsports. Charlotte Motor Speedway dominates the town\'s identity — race weekends transform the entire area. The zMax Dragway and Dirt Track add year-round racing events. Beyond NASCAR, Concord has strong high school sports traditions and a growing minor league presence.',
    recHighlights: [
      'Frank Liske Park — 238 acres with pool, fields, and equestrian center',
      'Charlotte Motor Speedway events beyond racing (concerts, festivals)',
      'Great Wolf Lodge — indoor water park',
      'Concord Mills area recreation and entertainment',
    ],
    parkTrails: ['Frank Liske Park', 'Camp Spencer Park', 'Irish Buffalo Creek Greenway'],
    fitnessScene: 'Suburban fitness chains and recreation centers. Frank Liske Park is the outdoor recreation hub. Growing cycling community along Cabarrus County greenways.',
    youthSports: 'Strong Cabarrus County youth sports programs. Baseball, football, and soccer leagues. Northwest Cabarrus and Cox Mill high school athletics are competitive.',
  },

  'fort-mill': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '18 mi', access: '25 min drive via I-77' },
      { venueName: 'Spectrum Center', distance: '18 mi', access: '25 min drive' },
    ],
    fanCulture: 'Fort Mill straddles the NC/SC border, so you get fans of both Carolina Panthers and South Carolina Gamecocks. The Kingsley and Baxter communities have their own sports cultures with neighborhood pools, tennis, and organized leagues. Fort Mill High School athletics are a major community rallying point.',
    recHighlights: [
      'Anne Springs Close Greenway — 2,100 acres of trails, lakes, and nature',
      'Fort Mill Community Center — gym, pool, and fitness',
      'Kingsley Town Center — community events and recreation',
      'Carowinds (adjacent) — amusement park and water park',
    ],
    parkTrails: ['Anne Springs Close Greenway', 'Fort Mill Town Park', 'Walter Elisha Park'],
    fitnessScene: 'Anne Springs Close Greenway is the crown jewel — 40+ miles of trails for hiking, mountain biking, and horseback riding. Community fitness centers and chain gyms serve the suburban population.',
    youthSports: 'Fort Mill youth sports are exceptional — the school district is top-rated and athletics match. Travel baseball, soccer, and swim teams compete at high levels. Anne Springs hosts youth outdoor programs.',
  },

  'pineville': {
    nearbyVenues: [
      { venueName: 'Bank of America Stadium', distance: '12 mi', access: '20 min drive' },
      { venueName: 'Spectrum Center', distance: '12 mi', access: '20 min drive' },
    ],
    fanCulture: 'Pineville\'s sports culture is casual and family-oriented. Carolina Place Mall area has sports bars for game watching. The town\'s proximity to Carowinds and the SC border means residents split between Charlotte pro sports and day-trip entertainment. High school sports at South Mecklenburg draw local support.',
    recHighlights: [
      'Pineville Lake Park — fishing, trails, and picnic areas',
      'Jack D. Hughes Memorial Park — fields and playground',
      'Carowinds — amusement and water park (seasonal)',
      'McDowell Nature Preserve — 1,132 acres on Lake Wylie',
    ],
    parkTrails: ['Pineville Lake Park', 'McDowell Nature Preserve', 'McMullen Creek Greenway'],
    fitnessScene: 'Budget-friendly fitness options — chain gyms, community parks, and greenway access. McDowell Nature Preserve offers serious hiking and mountain biking for outdoor enthusiasts.',
    youthSports: 'Pineville Parks & Recreation youth programs. Soccer, baseball, and basketball leagues. Proximity to South Charlotte\'s extensive youth sports network.',
  },
};
