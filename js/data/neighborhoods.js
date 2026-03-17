/* ============================================
   SETTLE CLT — Neighborhood Data
   8 Charlotte Neighborhoods — Expanded Model
   ============================================ */

const neighborhoods = [
  {
    id: 'south-end',
    name: 'South End',
    vibe: 'Trendy, walkable, vibrant nightlife',
    description: 'South End is Charlotte\'s hottest neighborhood for young professionals. With the LYNX Blue Line running through it, walkable breweries, and a booming restaurant scene, it\'s the heartbeat of Charlotte\'s social life.',
    gradient: 'linear-gradient(135deg, #1a2a44 0%, #2d4a6f 100%)',
    stats: {
      avgRent: '$1,650',
      walkScore: 82,
      transitScore: 65,
      medianHomePrice: '$450K',
      commuteToUptown: '5 min LYNX',
      schoolTier: 'B',
      crimeLevel: 'low',
      petFriendly: 4,
      nightlifeLevel: 'active',
      newConstruction: true,
      familyScore: 2,
      lgbtqFriendly: true
    },
    tags: ['🚊 Light Rail', '🍺 Breweries', '💼 Young Pros', '🏃 Rail Trail'],
    bestFor: 'Young professionals who want walkability and nightlife',
    nearbyAreas: ['Uptown', 'Dilworth', 'Wilmore'],
    featured: true,
    photoUrls: [
      'https://images.unsplash.com/photo-1578507065211-1c4e99a5fd24?w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=80'
    ],
    dayInTheLife: 'Your Tuesday starts at Undercurrent Coffee on South Tryon, where half the line is in Allbirds and the other half is in scrubs from Atrium Health down the road. You grab a cortado and walk the Rail Trail to your coworking space at Industrious, passing three construction cranes and a mural of a giant hornet. The LYNX rumbles by every twelve minutes — you barely notice it anymore.\n\nLunch is a build-your-own bowl at Yafo Kitchen on Camden Road, eaten on a bench along the greenway. By 5 PM the Rail Trail transforms into a parade of dogs, runners, and couples heading to Sycamore Brewing\'s patio. You meet friends at Superica for Tex-Mex, then walk — actually walk — home past the lit-up apartment towers on South Boulevard. No Uber needed. That\'s the whole point of living here.',
    honestTruth: 'Parking is the number one complaint and it\'s earned. Street parking vanishes by 6 PM on weekends, and most apartment garages charge $75–$150/month on top of rent. If you have two cars, budget accordingly or ditch one — the LYNX really does work for Uptown commutes. Construction noise is constant; there are always two or three new apartment buildings going up within earshot, and weekend mornings can start with jackhammers.\n\nThe other thing nobody tells you: South End floods during heavy summer storms. The section near Bland Street and Remount Road can get standing water fast. Check your specific building\'s flood history before signing. Also, the "walkable brewery scene" means your Saturday morning sidewalk will have broken glass and the occasional mystery puddle. It\'s a party neighborhood — embrace it or pick Dilworth.',
    costReality: 'Your $1,650/month gets you a 650–750 sq ft one-bedroom in a newer building with a gym and rooftop pool. In-unit laundry is standard in buildings built after 2018, but older conversions may have shared laundry rooms. Parking is almost always extra — expect $75–$125/month for a garage spot. Same budget in Dilworth gets you 850–950 sq ft in a garden-style apartment with a private patio, free parking, and mature trees — but no pool and no Rail Trail out your front door.',
    whoLivesHere: 'Mostly 24–34 year olds who moved here for a banking, tech, or healthcare job within the last two years. Remote workers are everywhere — you\'ll see laptops at every brewery by 2 PM on a Wednesday. Dog ownership is almost mandatory; golden retrievers and doodles outnumber children by a wide margin. The social scene skews toward group fitness classes, brewery trivia nights, and dating apps. People here are friendly but transient — your neighbor might be gone in 18 months when they transfer to the Nashville office.',
    firstWeekend: [
      {
        action: 'Walk the entire Rail Trail from Bland Station to New Bern Station',
        why: 'This 3.5-mile greenway is the spine of South End — you\'ll pass every brewery, coffee shop, and restaurant cluster in one walk and instantly understand the neighborhood layout.',
        tip: 'Start at the Bland Street LYNX station and walk north. Stop at Sycamore Brewing halfway for a beer. The trail is busiest Saturday 10 AM–2 PM.'
      },
      {
        action: 'Grab brunch at Tupelo Honey on South Boulevard',
        why: 'It\'s the unofficial South End welcome center. You\'ll overhear five different "we just moved here" conversations and the sweet potato pancakes are a Charlotte institution.',
        tip: 'Go before 10 AM or after 1 PM to avoid the 45-minute wait. The bar seats fill last.'
      },
      {
        action: 'Take the LYNX Blue Line to Uptown and back',
        why: 'Understanding the light rail is the single most useful thing you can do your first week. It connects you to Panthers games, Uptown offices, and NoDa without a car.',
        tip: 'Buy a day pass on the CATS app for $4.40. Ride to 7th Street Station, walk around Uptown, then ride back. The whole trip takes 8 minutes each way.'
      }
    ],
    movingFrom: {
      nyc: 'South End feels like a cleaner, slower Williamsburg with better weather and actual parking (barely). The Rail Trail is your new High Line, but people smile at you here.',
      chicago: 'Think Fulton Market energy but with year-round patio season. The brewery density rivals Wicker Park, and the LYNX is your new L train — except it actually runs on time.',
      atlanta: 'It\'s Midtown Atlanta if Midtown had a functioning light rail and you could walk everywhere. The vibe is similar — young, corporate, social — but more compact.',
      dc: 'Imagine if U Street and Navy Yard had a baby with free parking (almost). Same young professional energy, half the rent, and nobody talks about politics at the bar.',
      houston: 'This is what Montrose would be if Houston had invested in transit. Walkable, brewery-heavy, and you can actually leave your car at home. The culture shock is real — in a good way.'
    },
    communityTopics: [
      'Best rooftop pools and amenity decks in South End',
      'Rail Trail etiquette: bikes, scooters, and dog leashes'
    ],
    directoryCtaLinks: [
      { label: 'Find gyms near the Rail Trail', category: 'fitness', area: 'South End' },
      { label: 'South End breweries & restaurants', category: 'breweries', area: 'South End' },
      { label: 'Apartments in South End', category: 'real-estate', area: 'South End' },
      { label: 'Coworking spaces nearby', category: 'coworking', area: 'South End' }
    ]
  },
  {
    id: 'noda',
    name: 'NoDa',
    vibe: 'Artsy, eclectic, creative energy',
    description: 'North Davidson — Charlotte\'s arts district — is packed with galleries, live music venues, craft breweries, and colorful murals. It has a bohemian spirit that attracts creatives and free thinkers.',
    gradient: 'linear-gradient(135deg, #2d1b4e 0%, #4a2d6f 100%)',
    stats: {
      avgRent: '$1,450',
      walkScore: 71,
      transitScore: 48,
      medianHomePrice: '$380K',
      commuteToUptown: '10 min LYNX',
      schoolTier: 'B',
      crimeLevel: 'medium',
      petFriendly: 4,
      nightlifeLevel: 'active',
      newConstruction: false,
      familyScore: 2,
      lgbtqFriendly: true
    },
    tags: ['🎨 Art Galleries', '🎵 Live Music', '☕ Coffee Shops', '🎭 Murals'],
    bestFor: 'Artists, musicians, and people who love eclectic vibes',
    nearbyAreas: ['Plaza Midwood', 'Villa Heights', 'Optimist Park'],
    featured: true,
    photoUrls: [
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
      'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1200&q=80'
    ],
    dayInTheLife: 'You wake up in a converted mill loft on North Davidson Street and walk to Smelly Cat Coffeehouse, where the barista has a neck tattoo and remembers your order. The morning light hits the murals on 36th Street and everything looks like an album cover. You pass Pura Vida, the neighborhood\'s unofficial living room, where someone is always sketching in a notebook.\n\nWork happens at a shared studio space or from your apartment — NoDa is freelancer territory. By late afternoon, the galleries on North Davidson start opening their doors for browsers. Dinner is a taco plate at Cabo Fish Taco or a wood-fired pizza at Luisa\'s. By 9 PM, the Neighborhood Theatre marquee is lit up and there\'s a line forming at Evening Muse for a local band you\'ve never heard of but will love. You walk home past string lights and the faint sound of someone practicing guitar in their apartment.',
    honestTruth: 'NoDa\'s "artsy" reputation masks a real gentrification tension. Long-time residents and artists who built the neighborhood\'s identity are being priced out by new apartment complexes. The vibe is shifting, and some blocks feel more "luxury brunch" than "underground gallery" now. Be aware of that dynamic — it\'s a live conversation here.\n\nPractically: street parking is a nightmare on weekends and during gallery crawls. The LYNX station is a 10-minute walk from the core of North Davidson, not right in the middle of things. Car break-ins happen — don\'t leave anything visible. And the train tracks that run through the neighborhood are active freight lines; if you\'re a light sleeper, check your apartment\'s proximity to the tracks before signing.',
    costReality: 'Your $1,450/month gets you a 700–800 sq ft one-bedroom, often in a converted warehouse or older apartment complex with character but fewer amenities than South End. In-unit laundry is a coin flip — newer builds have it, older ones don\'t. Parking is usually included but might be an uncovered lot. Same budget in University City gets you a 1,000+ sq ft two-bedroom with a garage, pool, and modern finishes — but you\'ll need a car for everything.',
    whoLivesHere: 'A mix of 25–40 year olds: freelance designers, musicians, bartenders, and the occasional tech worker who wanted "somewhere with soul." Remote work is common but not the laptop-at-brewery type — more like the studio-in-the-spare-bedroom type. Cat ownership edges out dogs here. The social scene revolves around gallery crawls, open mic nights, and knowing the sound guy at your favorite venue. People stay in NoDa longer than South End — it builds loyalty.',
    firstWeekend: [
      {
        action: 'Do the NoDa gallery crawl on the first and third Friday',
        why: 'The gallery crawl is NoDa\'s signature event and the fastest way to meet your neighbors. Every gallery, studio, and shop on North Davidson opens its doors with free wine and live music.',
        tip: 'Start at The Evening Muse end of North Davidson and work south. Arrive by 6 PM before it gets packed. Street parking fills fast — take the LYNX to 36th Street Station.'
      },
      {
        action: 'Get breakfast at Crepe Cellar and explore the murals',
        why: 'Crepe Cellar is the neighborhood\'s brunch anchor, and the surrounding blocks have Charlotte\'s densest concentration of street art. You\'ll learn the neighborhood\'s geography and aesthetic in one walk.',
        tip: 'Go Saturday before 10 AM. After eating, walk the full loop: North Davidson to 36th Street to Charles Avenue and back. Photograph the murals — they change seasonally.'
      },
      {
        action: 'Catch a show at the Neighborhood Theatre',
        why: 'This converted church is Charlotte\'s most beloved live music venue. Seeing a show here is a NoDa rite of passage and tells you instantly whether this neighborhood\'s energy is your speed.',
        tip: 'Check their calendar online. Tickets for local acts are usually $10–$20. The balcony has the best sound. Grab a beer at Heist Brewery next door before the show.'
      }
    ],
    movingFrom: {
      nyc: 'NoDa is Bushwick five years ago — murals, converted warehouses, and a music scene that punches above its weight. Except rent is a third of what you were paying and people actually say hello.',
      chicago: 'Think Logan Square before the chains moved in. Same creative energy, same bar-and-gallery ecosystem, but with Southern hospitality and no winter to survive.',
      atlanta: 'It\'s Little Five Points with better coffee and less sprawl. The "weird Charlotte" vibe lives here, and it\'s walkable in a way L5P never quite managed.',
      dc: 'Imagine Adams Morgan\'s music scene transplanted to a neighborhood where you can actually afford a one-bedroom. Less political, more paint-stained.',
      houston: 'This is Charlotte\'s version of the Heights — artsy, independent, and fiercely protective of its identity. But you can walk to the bars instead of driving.'
    },
    communityTopics: [
      'Gentrification watch: new developments and what\'s changing',
      'Live music calendar and open mic nights'
    ],
    directoryCtaLinks: [
      { label: 'NoDa coffee shops & cafes', category: 'restaurants', area: 'NoDa' },
      { label: 'Breweries in the arts district', category: 'breweries', area: 'NoDa' },
      { label: 'Find a barber in NoDa', category: 'barbers', area: 'NoDa' },
      { label: 'NoDa apartments & lofts', category: 'real-estate', area: 'NoDa' }
    ]
  },
  {
    id: 'dilworth',
    name: 'Dilworth',
    vibe: 'Historic charm, tree-lined streets',
    description: 'Charlotte\'s first streetcar suburb offers stunning early 1900s bungalows, tree-canopied streets, and a tight-knit community feel. Latta Park is the crown jewel, and East Blvd is lined with restaurants.',
    gradient: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%)',
    stats: {
      avgRent: '$1,800',
      walkScore: 78,
      transitScore: 42,
      medianHomePrice: '$685K',
      commuteToUptown: '8 min drive',
      schoolTier: 'B',
      crimeLevel: 'low',
      petFriendly: 5,
      nightlifeLevel: 'moderate',
      newConstruction: false,
      familyScore: 4,
      lgbtqFriendly: true
    },
    tags: ['🏡 Historic Homes', '🌳 Latta Park', '👨‍👩‍👧 Families', '🍽️ East Blvd'],
    bestFor: 'Families and professionals who love historic character',
    nearbyAreas: ['South End', 'Myers Park', 'Sedgefield'],
    featured: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
    ],
    dayInTheLife: 'Tuesday morning starts with a jog through Latta Park, where the old oak trees form a canopy so thick the light filters through like a cathedral. You pass dog walkers, stroller pushers, and the same retired guy who sits on the bench by the fountain every morning. Coffee is at Dilworth Coffee on East Boulevard — a neighborhood institution where the regulars know each other by name.\n\nYou drive to Uptown in eight minutes on Kenilworth Avenue, passing bungalows with wrap-around porches and yards that look like magazine covers. After work, you stop at Reid\'s Fine Foods for groceries — it\'s the kind of place that has a wine bar inside the store. Dinner is on the patio at Mama Ricotta\'s, watching families walk by with kids on scooters. By 9 PM, Dilworth is quiet. Porch lights are on, someone\'s grilling two streets over, and you can hear crickets. That\'s the deal here: charm, calm, and a ten-minute drive to everything.',
    honestTruth: 'The charm comes with a price — literally. Dilworth\'s historic homes look gorgeous but many have 100-year-old plumbing, knob-and-tube wiring, and zero insulation. Your Duke Energy bill in August can hit $400 if you\'re in an unrenovated bungalow. Get a thorough inspection before buying, and budget for HVAC upgrades.\n\nParking is fine at your house but terrible on East Boulevard, especially Friday and Saturday nights. The restaurant strip gets congested and street parking becomes a competitive sport. Also, Dilworth is in a flood zone along Little Sugar Creek — homes south of Park Avenue near the creek have flooded in major storms. Check FEMA maps. The neighborhood association is active (some would say aggressive) about yard maintenance, signage, and renovations — know the rules before you paint your door a bold color.',
    costReality: 'Your $1,800/month gets you a 900–1,100 sq ft one-bedroom or small two-bedroom in a garden-style apartment or converted house. In-unit laundry is uncommon in older rentals but standard in the few newer builds. Parking is usually a free surface lot or driveway spot. Same budget in South End gets you a smaller unit but with a pool, gym, rooftop deck, and the Rail Trail outside your door — it\'s a lifestyle-vs-space tradeoff.',
    whoLivesHere: 'A blend of 30–50 year olds: young families with one or two kids, established professionals who\'ve been here a decade, and couples upgrading from South End apartments to their first house. Remote work is common among the homeowners — lots of home offices in converted sunrooms. Dog ownership is near-universal; Latta Park is basically an unofficial dog park. The social scene is neighborhood-centric: block parties, the Dilworth Jubilee festival, and knowing your neighbors by name. People move to Dilworth and stay.',
    firstWeekend: [
      {
        action: 'Walk the Latta Park loop and explore East Boulevard on foot',
        why: 'Latta Park is Dilworth\'s heart, and East Boulevard is its main street. Walking both gives you the full picture: the tree canopy, the restaurant row, and the neighborhood\'s pace.',
        tip: 'Park at Latta Park (free lot on Park Avenue) and walk the loop, then head east on East Boulevard to Kenilworth. Hit Dilworth Coffee, browse the shops, and end at Reid\'s Fine Foods.'
      },
      {
        action: 'Have dinner at Mama Ricotta\'s or The Fig Tree',
        why: 'These are Dilworth\'s anchor restaurants — one casual Italian, one upscale Southern. Eating at either one puts you in the neighborhood\'s social flow and gives you instant conversation material.',
        tip: 'Mama Ricotta\'s doesn\'t take reservations and the wait can be 45 minutes on weekends. Go at 5:30 PM or sit at the bar. The Fig Tree requires reservations — book a week ahead.'
      },
      {
        action: 'Drive the residential streets between Park Avenue and Tremont',
        why: 'This is where Dilworth\'s famous bungalows and historic homes are concentrated. Driving (or biking) these streets tells you more about the neighborhood\'s character than any listing description.',
        tip: 'Start on Dilworth Road East, turn onto Myrtle, then loop through Tremont and Worthington. The homes on East Kingston have the best porches in Charlotte.'
      }
    ],
    movingFrom: {
      nyc: 'Dilworth is Park Slope energy — tree-lined streets, strollers everywhere, great restaurants — but with actual yards and houses you can afford before age 50.',
      chicago: 'Think Lincoln Park\'s residential blocks: historic homes, walkable dining, and a community feel. Minus the lake, plus year-round porch sitting.',
      atlanta: 'It\'s Virginia-Highland with better trees and less traffic. Same historic bungalow vibe, same neighborhood pride, but quieter and more walkable.',
      dc: 'Imagine Capitol Hill\'s row houses replaced with Craftsman bungalows and the pace dialed down by half. Same community feel, way less hustle.',
      houston: 'This is the Heights if the Heights had been built in 1905 and never torn down. Historic character, walkable restaurants, and neighbors who actually talk to each other.'
    },
    communityTopics: [
      'Historic home renovation tips and contractor recommendations',
      'Latta Park activities and neighborhood events calendar'
    ],
    directoryCtaLinks: [
      { label: 'Dilworth restaurants & dining', category: 'restaurants', area: 'Dilworth' },
      { label: 'Find a plumber for your bungalow', category: 'plumbers', area: 'Charlotte Metro' },
      { label: 'Lawn care in Dilworth', category: 'lawn', area: 'Charlotte Metro' },
      { label: 'Dilworth real estate agents', category: 'real-estate', area: 'Charlotte Metro' }
    ]
  },
  {
    id: 'ballantyne',
    name: 'Ballantyne',
    vibe: 'Suburban luxury, top schools',
    description: 'Located in south Charlotte, Ballantyne is a master-planned community offering top-rated schools, corporate campuses, golf courses, and upscale shopping. Perfect for families seeking suburban comfort without being far from the city.',
    gradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 100%)',
    stats: {
      avgRent: '$1,750',
      walkScore: 35,
      transitScore: 22,
      medianHomePrice: '$550K',
      commuteToUptown: '25 min drive',
      schoolTier: 'A',
      crimeLevel: 'low',
      petFriendly: 3,
      nightlifeLevel: 'quiet',
      newConstruction: true,
      familyScore: 5,
      lgbtqFriendly: true
    },
    tags: ['🏫 A+ Schools', '🛍️ Shopping', '⛳ Golf', '🏢 Corporate'],
    bestFor: 'Families wanting great schools and suburban living',
    nearbyAreas: ['Pineville', 'Waxhaw', 'Providence'],
    featured: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80'
    ],
    dayInTheLife: 'Your Tuesday starts at 6:30 AM in a four-bedroom house with a two-car garage on a cul-de-sac. The kids eat breakfast while you check email — your office at the Ballantyne Corporate Park is a seven-minute drive. You drop the kids at Ardrey Kell High School, rated one of the best in CMS, and pull into the office by 8:15. Lunch is a salad at Stacks Kitchen in the Ballantyne Village shopping center, where every other table is a business meeting.\n\nAfter work, your daughter has soccer practice at the Ballantyne District Park while your son does homework at the Starbucks in the Village. Dinner is grilled chicken on the back deck — you can hear the sprinklers and the distant thwack of someone hitting golf balls at the Ballantyne Country Club. By 9 PM, the neighborhood is dark and quiet. The loudest sound is a garage door closing. This is the suburban contract: space, safety, schools, and silence.',
    honestTruth: 'The commute to Uptown is the elephant in the room. Google Maps says 25 minutes, but during rush hour on I-485 and South Boulevard, it\'s 40–55 minutes each way. If your job is Uptown, do the math on two hours of daily driving before committing. There\'s no light rail to Ballantyne — it\'s been "planned" for years.\n\nBallantyne is also not walkable in any meaningful sense. You will drive to get milk, drive to get coffee, drive to the gym. The "town center" is a shopping center with a parking lot, not a downtown. For some people that\'s fine; for others it\'s suffocating. Also, the HOA situation is intense — many Ballantyne subdivisions have strict rules about trash cans, lawn height, holiday decorations, and exterior paint colors. Read the covenants before buying.',
    costReality: 'Your $1,750/month gets you a spacious 1,100–1,300 sq ft two-bedroom apartment in a newer complex with a pool, fitness center, and attached garage. In-unit laundry is standard. Same budget in South End gets you a 650 sq ft one-bedroom with no garage — but you can walk to 30 restaurants. In Ballantyne, you\'re paying for square footage, school districts, and quiet. The tradeoff is real.',
    whoLivesHere: 'Families with school-age kids dominate. Ages 35–50, dual income, one or both parents in banking, insurance, or corporate roles at the Ballantyne campus. Remote work is common but the home office has a door that closes. Pet ownership leans toward family dogs — labs and golden retrievers in fenced yards. The social scene is kid-centric: school events, sports leagues, and neighborhood cookouts. Single adults under 30 will feel out of place here — this is family territory by design.',
    firstWeekend: [
      {
        action: 'Explore Ballantyne Village and the surrounding shopping centers',
        why: 'This is the commercial heart of Ballantyne. Understanding the Village layout — grocery, restaurants, shops, gym — tells you where you\'ll spend most of your non-home time.',
        tip: 'Start at Stonecrest Shopping Center (Harris Teeter, restaurants), then drive to Ballantyne Village (Stacks Kitchen, boutiques). End at the Ballantyne Hotel lobby bar for a drink with a view.'
      },
      {
        action: 'Drive the school routes and visit Ardrey Kell or Marvin Ridge',
        why: 'Schools are the reason most families choose Ballantyne. Driving the routes during school hours shows you traffic patterns, and visiting the campuses gives you a feel for the community.',
        tip: 'CMS school assignments are based on your specific address — check the CMS school locator tool online before choosing a subdivision. Magnet school applications open in October.'
      },
      {
        action: 'Walk the Ballantyne District Park trails',
        why: 'This 68-acre park is Ballantyne\'s green space anchor with playgrounds, sports fields, and walking trails. It\'s where the neighborhood gathers on weekends.',
        tip: 'The park is busiest Saturday mornings during youth sports seasons. The paved trail loop is about 1.5 miles — good for jogging or stroller walks. Free parking.'
      }
    ],
    movingFrom: {
      nyc: 'Ballantyne is the anti-Manhattan. Everything you gave up in the city — space, quiet, a yard, good public schools — you get back here. Everything you loved — walkability, spontaneity, culture — you trade away.',
      chicago: 'Think Naperville or Hinsdale: excellent schools, big houses, corporate proximity, and a 30-minute commute that feels longer than it should. The suburbs done well, if suburbs are your thing.',
      atlanta: 'It\'s Alpharetta or Johns Creek — same master-planned, school-focused, golf-course-adjacent energy. If you liked north Atlanta suburbs, you\'ll feel right at home.',
      dc: 'Ballantyne is Loudoun County with better weather. Top schools, new construction, corporate campuses, and the same "drive everywhere" reality. But no Dulles Toll Road.',
      houston: 'This is Sugar Land or Katy — master-planned, family-first, HOA-governed. If you thrived in Houston suburbs, Ballantyne is the Charlotte equivalent. Same energy, less humidity.'
    },
    communityTopics: [
      'CMS school assignments and magnet school tips',
      'Best youth sports leagues and kids activities'
    ],
    directoryCtaLinks: [
      { label: 'Ballantyne childcare & schools', category: 'childcare', area: 'South Charlotte' },
      { label: 'Lawn care & landscaping', category: 'lawn', area: 'South Charlotte' },
      { label: 'South Charlotte grocery stores', category: 'grocery', area: 'South Charlotte' },
      { label: 'Find a family doctor', category: 'healthcare', area: 'South Charlotte' }
    ]
  },
  {
    id: 'plaza-midwood',
    name: 'Plaza Midwood',
    vibe: 'Quirky, diverse, foodie haven',
    description: 'Plaza Midwood is Charlotte\'s most diverse and food-obsessed neighborhood. From Thai to BBQ to tacos, Central Avenue is a culinary world tour. It\'s got soul, independent shops, and a dog at every corner.',
    gradient: 'linear-gradient(135deg, #3a1a1a 0%, #5a2d2d 100%)',
    stats: {
      avgRent: '$1,500',
      walkScore: 74,
      transitScore: 38,
      medianHomePrice: '$420K',
      commuteToUptown: '10 min drive',
      schoolTier: 'B',
      crimeLevel: 'medium',
      petFriendly: 5,
      nightlifeLevel: 'active',
      newConstruction: false,
      familyScore: 3,
      lgbtqFriendly: true
    },
    tags: ['🍕 Restaurants', '🎭 Culture', '🐕 Dog-Friendly', '🛒 Local Shops'],
    bestFor: 'Foodies, dog lovers, and people who love character',
    nearbyAreas: ['NoDa', 'Commonwealth', 'Elizabeth'],
    featured: true,
    photoUrls: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80'
    ],
    dayInTheLife: 'Tuesday morning starts at Common Market on Commonwealth Avenue — half convenience store, half coffee shop, entirely Plaza Midwood. You grab a drip coffee and a breakfast sandwich and sit on the patio next to someone reading a zine and a guy with three rescue dogs. The walk to your car takes you past Manifest Records, a vintage shop that\'s never open when you expect it to be, and a Thai restaurant that\'s been here since before Charlotte was cool.\n\nCentral Avenue is the real show. Lunch is pho at Lang Van or a plate from Midwood Smokehouse — the pulled pork is a religion here. After work, you walk your dog past the bungalows on Mecklenburg Avenue, where every yard has a different personality: one has a Little Free Library, another has a hand-painted fence, a third has chickens. Dinner is tacos at Que Onda or a slice at Fuel Pizza. By 10 PM, the Thirsty Beaver — a dive bar in a tiny house — has a line out the door. Plaza Midwood doesn\'t try to be cool. It just is.',
    honestTruth: 'Central Avenue east of Briar Creek has a higher crime rate than the rest of the neighborhood — car break-ins and property crime are real, especially in parking lots at night. Lock your car, don\'t leave bags visible, and be aware of your surroundings after dark. It\'s not dangerous, but it\'s not Ballantyne either.\n\nThe other honest truth: Plaza Midwood is gentrifying fast. The quirky, affordable character that made it special is under pressure from new townhome developments and rising rents. Some beloved businesses have closed or relocated. The neighborhood is in transition — it\'s still great, but the version you see on Instagram may not be the version that exists in three years. Also, Thomas Street and Central Avenue traffic at 5 PM is genuinely terrible for a neighborhood this small.',
    costReality: 'Your $1,500/month gets you a 750–900 sq ft one-bedroom in an older apartment complex or a converted house with hardwood floors and character. In-unit laundry is uncommon in older buildings. Parking is usually free and off-street. Same budget in NoDa gets you similar square footage with a slightly more "curated" feel, but Plaza Midwood wins on restaurant diversity and dog-friendliness by a mile.',
    whoLivesHere: 'The most diverse neighborhood on this list — age, race, income, and lifestyle. You\'ll find 25-year-old bartenders next to 60-year-old retirees who\'ve lived here for decades. Remote workers, service industry folks, teachers, and the occasional banker who wanted "somewhere real." Dog ownership is almost comically high — the neighborhood Facebook group is 40% lost dog posts. The social scene is organic: you meet people at Common Market, at the dog park, at the taco truck. Nobody\'s networking here; they\'re just hanging out.',
    firstWeekend: [
      {
        action: 'Eat your way down Central Avenue from The Plaza to Eastway',
        why: 'Central Avenue is Charlotte\'s most diverse food corridor. Walking it (or driving it, it\'s long) gives you a taste of the neighborhood\'s soul — Thai, Vietnamese, BBQ, Mexican, Ethiopian, all within a mile.',
        tip: 'Start at Midwood Smokehouse for lunch, then walk east. Stop at Lang Van for Vietnamese, peek into Super G Mart (an international grocery), and end at Que Onda for tacos. Bring cash for the smaller spots.'
      },
      {
        action: 'Hang out at Common Market on a Saturday morning',
        why: 'Common Market is Plaza Midwood\'s living room. Spending an hour on the patio tells you everything about who lives here and what the vibe is. If you feel at home, this is your neighborhood.',
        tip: 'Go between 9–11 AM. Grab a coffee and a breakfast sandwich, sit outside, and people-watch. The bulletin board inside has local events, roommate postings, and band flyers.'
      },
      {
        action: 'Walk your dog (or borrow one) through the residential streets',
        why: 'Plaza Midwood\'s bungalow-lined streets between Central and Commonwealth are where the neighborhood\'s character lives. Every block is different, and dog walkers are the unofficial welcome committee.',
        tip: 'Walk Mecklenburg Avenue to Thomas Street to The Plaza. The houses get more eclectic as you go. If you don\'t have a dog, you\'ll meet at least three on the walk anyway.'
      }
    ],
    movingFrom: {
      nyc: 'Plaza Midwood is Astoria meets Bed-Stuy — diverse, food-obsessed, unpretentious, and full of dogs. The dive bars feel real, not manufactured, and your dollar goes five times further.',
      chicago: 'Think Pilsen\'s food diversity meets Humboldt Park\'s neighborhood pride. Same "real neighborhood" energy where people actually live, not just brunch and leave.',
      atlanta: 'It\'s East Atlanta Village with better food and less attitude. Same dive bar culture, same eclectic mix of people, but more walkable and with a stronger restaurant scene.',
      dc: 'Imagine Columbia Heights\' diversity and food scene but in a neighborhood of bungalows instead of condos. Same energy, one-tenth the rent, and people are friendlier.',
      houston: 'This is Montrose\'s scrappy cousin — diverse, dog-friendly, and full of independent restaurants. The "keep it weird" energy is real here, and you can actually walk to dinner.'
    },
    communityTopics: [
      'Best international restaurants on Central Avenue',
      'Dog parks and pet-friendly patios'
    ],
    directoryCtaLinks: [
      { label: 'Plaza Midwood restaurants', category: 'restaurants', area: 'Plaza Midwood' },
      { label: 'Find a vet nearby', category: 'pets', area: 'Charlotte Metro' },
      { label: 'Barbers & salons in the area', category: 'barbers', area: 'Charlotte Metro' },
      { label: 'Plaza Midwood apartments', category: 'real-estate', area: 'Charlotte Metro' }
    ]
  },
  {
    id: 'uptown',
    name: 'Uptown',
    vibe: 'City center, skyline living',
    description: 'Charlotte\'s downtown core — called "Uptown" by locals — offers high-rise living, proximity to Bank of America Stadium, the Spectrum Center, and the Epicentre. Perfect for those who love being in the thick of it.',
    gradient: 'linear-gradient(135deg, #0a1a2e 0%, #1e3a5f 100%)',
    stats: {
      avgRent: '$1,900',
      walkScore: 90,
      transitScore: 72,
      medianHomePrice: '$380K',
      commuteToUptown: '0 min — you\'re here',
      schoolTier: 'C',
      crimeLevel: 'medium',
      petFriendly: 2,
      nightlifeLevel: 'active',
      newConstruction: true,
      familyScore: 1,
      lgbtqFriendly: true
    },
    tags: ['🏙️ High-Rises', '🏟️ Sports', '🚶 Walkable', '🎬 Nightlife'],
    bestFor: 'Urban dwellers who want everything within walking distance',
    nearbyAreas: ['South End', 'Fourth Ward', 'First Ward'],
    featured: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1577084381678-8d4d5fcd5e0e?w=1200&q=80',
      'https://images.unsplash.com/photo-1578507065211-1c4e99a5fd24?w=1200&q=80',
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=80'
    ],
    dayInTheLife: 'Your alarm goes off at 7 AM in a 22nd-floor condo on Tryon Street. The skyline view from your window still hasn\'t gotten old. You walk to the office — Bank of America tower, Wells Fargo, or one of the dozen corporate headquarters within a ten-block radius. Coffee is at Not Just Coffee on North Tryon, where the line moves fast because everyone here has somewhere to be.\n\nLunch is at the 7th Street Public Market — a food hall with local vendors, from poke bowls to BBQ to fresh juice. You eat at a communal table next to someone in a suit and someone in paint-splattered jeans. After work, you walk to Romare Bearden Park and sit by the fountains while the sunset turns the Duke Energy building gold. Dinner is at Sea Level on North College — the rooftop has the best view in Charlotte. On game nights, the streets fill with Panthers or Hornets fans and the energy is electric. By 11 PM, you\'re home without having started a car all day.',
    honestTruth: 'Uptown empties out after 6 PM on weekdays and feels genuinely deserted on weeknights. The "city that never sleeps" this is not. Sunday through Wednesday, you can walk blocks without seeing another person after dark. The nightlife is concentrated on Friday and Saturday — the rest of the week, it\'s a ghost town with good restaurants.\n\nHomelessness is visible and concentrated in Uptown, particularly around the bus station (Charlotte Transportation Center) and Marshall Park. It\'s a reality of living downtown in any American city, but it surprises people who expected a sanitized corporate district. Car break-ins in parking decks are common. And if you\'re near Bank of America Stadium, game days mean road closures, noise, and drunk fans — fun if you\'re into it, miserable if you\'re not. Also: there\'s no real grocery store in Uptown. You\'ll drive or delivery-app everything.',
    costReality: 'Your $1,900/month gets you a 600–750 sq ft one-bedroom in a high-rise with skyline views, a gym, and a concierge. In-unit laundry is standard in newer towers. Parking is almost always extra — $100–$200/month for a garage spot in your building. Same budget in Plaza Midwood gets you a 900 sq ft one-bedroom with free parking and a yard, but you\'ll need a car. Uptown\'s premium is for the address and the walk-to-work lifestyle.',
    whoLivesHere: 'Two groups: young professionals (23–32) working in banking and finance who want to walk to work, and empty nesters (55+) who sold the suburban house and want condo living with restaurants downstairs. Remote workers are rare here — if you\'re not going to an Uptown office, there\'s little reason to pay the premium. Pet ownership is low because most buildings have weight limits and no yards. The social scene is event-driven: Panthers games, Hornets games, concerts at PNC Music Pavilion, and the occasional food festival.',
    firstWeekend: [
      {
        action: 'Walk the Uptown loop: Tryon Street to Trade Street to the stadium',
        why: 'Uptown is compact enough to walk in an afternoon. This loop hits the financial district, the restaurant corridor, the sports venues, and the parks — giving you a complete mental map.',
        tip: 'Start at the Overstreet Mall (indoor skyway system connecting buildings), walk south on Tryon to Romare Bearden Park, then loop back via Trade Street past the stadium. Total: about 2 miles.'
      },
      {
        action: 'Eat at 7th Street Public Market and explore First Ward',
        why: 'The market is Uptown\'s best food destination, and First Ward (east of Tryon) is the emerging residential area with new apartments and the Mint Museum. It\'s where Uptown is growing.',
        tip: 'Go Saturday morning when the market is liveliest. After eating, walk to the Mint Museum Uptown (free on Wednesdays) and through First Ward Park.'
      },
      {
        action: 'Attend a Panthers or Hornets game (or just tailgate)',
        why: 'Sports are Uptown\'s social glue. Even if you\'re not a fan, the game-day atmosphere — tailgating on Mint Street, the walk from bars to the stadium — is the most alive Uptown gets.',
        tip: 'Panthers games are Sundays in fall; Hornets games are throughout the week. Buy the cheapest ticket just for the experience. Pre-game at Craft Tasting Room on Brevard Court.'
      }
    ],
    movingFrom: {
      nyc: 'Uptown is a very small Midtown Manhattan — corporate towers, walkability, and high-rise living. But it closes early, there\'s no subway, and the energy drops dramatically after dark. Adjust expectations.',
      chicago: 'Think the Loop\'s work-life convenience but without the lakefront or the L. Charlotte\'s downtown is more compact and quieter. If you loved living in River North, Uptown is the closest equivalent.',
      atlanta: 'It\'s Midtown Atlanta condensed into a smaller grid. Same corporate energy, same high-rise living, but more walkable and without MARTA\'s limitations. Also cheaper.',
      dc: 'Imagine Penn Quarter or downtown DC but with less foot traffic and more parking. Same "walk to the office" appeal, but Charlotte\'s downtown is quieter and less tourist-heavy.',
      houston: 'Uptown Charlotte is what downtown Houston wishes it could be — actually walkable. You can live without a car here, which is something Houston can\'t offer. The tradeoff is less diversity in dining.'
    },
    communityTopics: [
      'Best rooftop bars and skyline views',
      'Game day survival guide: parking, closures, and tips'
    ],
    directoryCtaLinks: [
      { label: 'Uptown restaurants & dining', category: 'restaurants', area: 'Uptown' },
      { label: 'Coworking spaces in Uptown', category: 'coworking', area: 'Uptown' },
      { label: 'Gyms & fitness in Uptown', category: 'fitness', area: 'Uptown' },
      { label: 'Things to do in Uptown', category: 'attractions', area: 'Uptown' }
    ]
  },
  {
    id: 'myers-park',
    name: 'Myers Park',
    vibe: 'Elegant, established, prestigious',
    description: 'One of Charlotte\'s most prestigious neighborhoods, Myers Park features grand estates along Queens Road, mature oak trees, and proximity to some of the city\'s top private schools. SouthPark Mall is nearby for premier shopping.',
    gradient: 'linear-gradient(135deg, #1a2e1a 0%, #2e4a2e 100%)',
    stats: {
      avgRent: '$2,200',
      walkScore: 55,
      transitScore: 30,
      medianHomePrice: '$950K',
      commuteToUptown: '10 min drive',
      schoolTier: 'A',
      crimeLevel: 'low',
      petFriendly: 4,
      nightlifeLevel: 'quiet',
      newConstruction: false,
      familyScore: 5,
      lgbtqFriendly: true
    },
    tags: ['🏛️ Estates', '🌳 Oak Trees', '🎓 Private Schools', '🛍️ SouthPark'],
    bestFor: 'Affluent professionals and families seeking prestige',
    nearbyAreas: ['Eastover', 'Dilworth', 'SouthPark'],
    featured: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
    ],
    dayInTheLife: 'Tuesday starts quietly in a brick colonial on Queens Road West. The oak canopy is so thick that even in summer, the morning light is dappled and cool. You drive the kids to Charlotte Latin School or Providence Day — the carpool line is a parade of SUVs and the occasional Tesla. Coffee is at Foxcroft Wine Co. in the SouthPark area, where the parking lot has more luxury cars than a dealership.\n\nThe drive to Uptown takes ten minutes on Queens Road, which curves through the neighborhood like a country lane that accidentally ended up in a city. After work, you stop at Harris Teeter on Providence Road — the "nice" one — and pick up dinner ingredients. The kids have lacrosse practice at Freedom Park, which borders Myers Park and Dilworth. Dinner is at home, on a patio overlooking a yard that\'s bigger than most South End apartments. By 8 PM, you\'re walking the dog past estates that look like they belong in a magazine. Myers Park doesn\'t shout. It doesn\'t need to.',
    honestTruth: 'Myers Park is expensive — not just the housing, but the lifestyle. Private school tuition runs $20K–$35K per kid per year. The country club memberships, the landscaping services, the property taxes on a $1.2M house — it adds up fast. Make sure your budget accounts for the full cost of living here, not just the mortgage.\n\nThe other thing: Myers Park\'s streets are beautiful but narrow, and the oak tree roots destroy sidewalks and driveways. Expect to spend money on driveway repair and root barriers. Providence Road traffic at rush hour is legitimately bad — the intersection at Queens and Providence can back up for 15 minutes. And while the neighborhood is safe, package theft from porches is surprisingly common. Get a lockbox or use the Harris Teeter for Amazon pickups.',
    costReality: 'Your $2,200/month gets you a 900–1,100 sq ft one-bedroom or small two-bedroom in one of the few apartment complexes in the area — options are limited because Myers Park is primarily single-family homes. In-unit laundry is standard. Parking is included. Same budget in South End gets you a luxury one-bedroom with a pool, gym, and rooftop, but in 650 sq ft. Myers Park\'s rental market is tight — most people here own, and the rentals that exist go fast.',
    whoLivesHere: 'Established families (40–60) with household incomes well above $200K. Bankers, lawyers, doctors, and executives. The kids go to Charlotte Latin, Providence Day, or Charlotte Country Day. Remote work exists but the home office is a dedicated room, not a kitchen table. Dog ownership is high — well-groomed labs and spaniels on leashes, not rescue pit bulls. The social scene is country club dinners, school fundraisers, and neighborhood cocktail parties. Myers Park is old Charlotte money and the new money that wants to be near it.',
    firstWeekend: [
      {
        action: 'Drive Queens Road West from Uptown to SouthPark',
        why: 'Queens Road is one of the most beautiful streets in the Southeast. Driving it gives you the full Myers Park experience: the oak canopy, the estates, the curves, and the quiet grandeur.',
        tip: 'Start where Queens Road meets 4th Street near Uptown and drive south. Go slow — the road curves and the speed limit is 25. Stop at Freedom Park (on the border with Dilworth) for a walk around the lake.'
      },
      {
        action: 'Browse SouthPark Mall and the surrounding shops',
        why: 'SouthPark is Myers Park\'s commercial center — Nordstrom, specialty shops, and high-end dining. Understanding SouthPark tells you where Myers Park residents spend their discretionary income.',
        tip: 'Park at SouthPark Mall and walk to the surrounding shops on Fairview and Sharon Roads. Lunch at Foxcroft Wine Co. or Stagioni. The mall is busiest Saturday afternoon.'
      },
      {
        action: 'Walk through Freedom Park and grab dinner on East Boulevard',
        why: 'Freedom Park connects Myers Park to Dilworth and is the neighborhood\'s primary green space. The lake, the trails, and the bandshell give you a feel for the community\'s outdoor life.',
        tip: 'Enter from East Drive. The loop around the lake is about 1 mile. After the walk, cross into Dilworth for dinner on East Boulevard — Mama Ricotta\'s or The Fig Tree are both walkable.'
      }
    ],
    movingFrom: {
      nyc: 'Myers Park is the Upper East Side transplanted to the Carolinas — old money, private schools, and a quiet elegance. But with actual yards, actual parking, and a fraction of the cost.',
      chicago: 'Think Lincoln Park\'s nicest blocks or the North Shore suburbs. Same established-family energy, same emphasis on schools and community, but with Southern charm and no winter.',
      atlanta: 'It\'s Buckhead\'s residential streets — the nice parts of Peachtree Battle and Tuxedo Park. Same prestige, same oak trees, same country club culture, but more intimate.',
      dc: 'Imagine Georgetown\'s residential streets with bigger lots and less traffic. Same old-money feel, same emphasis on schools and social standing, but more relaxed.',
      houston: 'This is River Oaks — Charlotte\'s most prestigious address with the estates, the trees, and the private schools to match. Same energy, similar price point, better walkability.'
    },
    communityTopics: [
      'Private school comparisons: Latin vs. Providence Day vs. Country Day',
      'Queens Road tree preservation and neighborhood beautification'
    ],
    directoryCtaLinks: [
      { label: 'Myers Park real estate agents', category: 'real-estate', area: 'South Charlotte' },
      { label: 'Private schools & childcare', category: 'childcare', area: 'South Charlotte' },
      { label: 'Lawn care & landscaping', category: 'lawn', area: 'South Charlotte' },
      { label: 'SouthPark restaurants', category: 'restaurants', area: 'South Charlotte' }
    ]
  },
  {
    id: 'university-city',
    name: 'University City',
    vibe: 'Student-friendly, affordable, growing',
    description: 'Home to UNC Charlotte, this rapidly developing area offers affordable living, a LYNX Blue Line Extension station, and quick access to research parks. It\'s ideal for students and young professionals on a budget.',
    gradient: 'linear-gradient(135deg, #0a2a1a 0%, #1a4a2a 100%)',
    stats: {
      avgRent: '$1,250',
      walkScore: 30,
      transitScore: 40,
      medianHomePrice: '$320K',
      commuteToUptown: '20 min LYNX',
      schoolTier: 'B',
      crimeLevel: 'medium',
      petFriendly: 3,
      nightlifeLevel: 'moderate',
      newConstruction: true,
      familyScore: 3,
      lgbtqFriendly: true
    },
    tags: ['🎓 UNCC', '💰 Affordable', '🚊 Light Rail', '🏗️ Growing'],
    bestFor: 'Students and budget-conscious newcomers',
    nearbyAreas: ['Harrisburg', 'Concord', 'Highland Creek'],
    featured: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80'
    ],
    dayInTheLife: 'Your Tuesday starts in a two-bedroom apartment that costs less than a studio in South End. You drive five minutes to the LYNX Blue Line Extension station at JW Clay Boulevard and ride the train to your Uptown office — 20 minutes with Wi-Fi and a seat, because the train isn\'t packed this far out. Coffee is from the Starbucks in University Place, the shopping center that anchors the neighborhood.\n\nThe area around UNCC campus buzzes with student energy — food trucks on Fridays, pickup basketball at the rec center, and a steady rotation of cheap eats on University City Boulevard. After work, you hit the gym at the YMCA on Harris Boulevard or jog the trails at University Research Park. Dinner is at Pho Real or the surprisingly good taco truck behind the AutoZone. By 9 PM, the students are heading to bars on University City Blvd while you\'re on your couch in a quiet apartment complex, watching the construction cranes that promise this area will look completely different in five years.',
    honestTruth: 'University City is not walkable. Period. Outside of the immediate UNCC campus, you need a car for groceries, restaurants, and daily life. The LYNX station is great for commuting to Uptown, but it\'s a drive-to-the-station situation, not a walk-to-the-station one. The "transit-oriented development" around the stations is still mostly parking lots and construction sites.\n\nThe area also has a higher property crime rate than south Charlotte neighborhoods — car break-ins in apartment complex parking lots are common, especially near campus. The student population means some apartment complexes are loud and party-heavy; if you\'re not a student, ask specifically about the tenant mix before signing. On the positive side, the growth here is real — new restaurants, new apartments, and new retail are opening constantly. You\'re buying into potential, not polish.',
    costReality: 'Your $1,250/month gets you a spacious 1,000–1,200 sq ft two-bedroom apartment with in-unit laundry, a garage or covered parking, a pool, and a fitness center. This is the best square-footage-per-dollar in the Charlotte metro. Same budget in South End gets you a 550 sq ft studio with no parking. The tradeoff is clear: space and savings vs. walkability and social scene. If you work from home and don\'t need to be in the middle of things, University City is the smart financial play.',
    whoLivesHere: 'Three groups: UNCC students (18–24) in the apartment complexes near campus, young professionals (25–35) who want affordable rent and don\'t mind the commute, and immigrant families who\'ve built communities along University City Boulevard. Remote work is increasingly common among the non-student residents — the affordable rent means more disposable income. Pet ownership is moderate. The social scene depends on your age: students have the campus and bars, professionals have the gym and a few restaurants, and families have the parks and cultural centers.',
    firstWeekend: [
      {
        action: 'Ride the LYNX Blue Line Extension from JW Clay to Uptown and back',
        why: 'The light rail is University City\'s lifeline to the rest of Charlotte. Understanding the route, the timing, and the stations tells you how connected (or disconnected) you\'ll be.',
        tip: 'Board at JW Clay Boulevard station. The ride to Uptown takes about 20 minutes. Get off at 7th Street Station, explore, then ride back. Buy a day pass on the CATS app for $4.40.'
      },
      {
        action: 'Explore University Place and the UNCC campus',
        why: 'University Place is the neighborhood\'s commercial hub, and the UNCC campus has trails, a botanical garden, and public events. Together they show you what daily life looks like here.',
        tip: 'Start at University Place (shops, restaurants, movie theater), then drive to UNCC\'s main campus. The Botanical Gardens at UNCC are free and open daily — worth a visit.'
      },
      {
        action: 'Drive University City Boulevard from I-85 to Concord Mills',
        why: 'This corridor is where University City\'s growth is happening. New apartments, new restaurants, and Concord Mills (one of NC\'s largest malls) are all along this stretch.',
        tip: 'Start at the I-85 interchange and drive northeast. Stop at Pho Real for lunch. Continue to Concord Mills if you want outlet shopping. The drive takes 15 minutes without traffic.'
      }
    ],
    movingFrom: {
      nyc: 'University City is nothing like New York — and that\'s the point. Your rent drops by 75%, your apartment triples in size, and you trade the subway for a light rail that actually has seats. The culture shock is real but your savings account will thank you.',
      chicago: 'Think of the far north side — Rogers Park or Edgewater — but with newer apartments and better weather. Affordable, diverse, transit-connected (sort of), and full of potential.',
      atlanta: 'It\'s like living near Kennesaw State or Georgia State\'s Perimeter campus — affordable, student-adjacent, and growing fast. Same "up and coming" energy with lower rent.',
      dc: 'Imagine College Park or Greenbelt — near a university, on a transit line, affordable, and developing. Same "buy into the future" proposition, but Charlotte\'s growth trajectory is steeper.',
      houston: 'This is the Energy Corridor or Westchase — affordable, corporate-adjacent, and car-dependent. But with a light rail option that Houston can only dream about.'
    },
    communityTopics: [
      'Best apartment complexes for non-students',
      'New development tracker: what\'s opening near UNCC'
    ],
    directoryCtaLinks: [
      { label: 'University City apartments', category: 'real-estate', area: 'University Area' },
      { label: 'Gyms & fitness centers', category: 'fitness', area: 'University Area' },
      { label: 'Grocery stores nearby', category: 'grocery', area: 'University Area' },
      { label: 'Auto repair & car wash', category: 'auto', area: 'University Area' }
    ]
  }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = neighborhoods;
}
