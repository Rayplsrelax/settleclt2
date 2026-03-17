// =============================================
// SETTLE CLT — Complete Services Directory Data
// 40 Categories · 400+ Listings
// =============================================

const SERVICE_SUPER_GROUPS = [
  { id: 'moving', label: '📦 Moving & Settling', icon: '📦' },
  { id: 'official', label: '🪪 Official Business', icon: '🪪' },
  { id: 'home', label: '🏡 Home & Property', icon: '🏡' },
  { id: 'personal', label: '💇 Personal Services', icon: '💇' },
  { id: 'daily', label: '🛒 Daily Essentials', icon: '🛒' },
  { id: 'lifestyle', label: '🎉 Lifestyle & Entertainment', icon: '🎉' }
];

const SERVICE_CATEGORIES = [
  // MOVING & SETTLING
  { id: 'moving-companies', name: 'Moving Companies', icon: '🚛', group: 'moving' },
  { id: 'real-estate', name: 'Real Estate & Apartments', icon: '🏠', group: 'moving' },
  { id: 'storage', name: 'Storage & Moving Pods', icon: '🗃️', group: 'moving' },
  { id: 'utilities', name: 'Utilities', icon: '⚡', group: 'moving' },
  { id: 'internet', name: 'Internet & TV', icon: '📡', group: 'moving' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', group: 'moving' },
  // OFFICIAL BUSINESS
  { id: 'dmv', name: 'DMV & Vehicle Services', icon: '🪪', group: 'official' },
  { id: 'government', name: 'Government & Civic', icon: '🏛️', group: 'official' },
  { id: 'banking', name: 'Banking & Credit Unions', icon: '🏦', group: 'official' },
  { id: 'tax', name: 'Tax Prep & Accounting', icon: '📊', group: 'official' },
  { id: 'legal', name: 'Legal Services', icon: '⚖️', group: 'official' },
  // HOME & PROPERTY
  { id: 'plumbers', name: 'Plumbers', icon: '🔧', group: 'home' },
  { id: 'electricians', name: 'Electricians', icon: '⚡', group: 'home' },
  { id: 'hvac', name: 'HVAC & AC Repair', icon: '❄️', group: 'home' },
  { id: 'roofing', name: 'Roofing & Gutters', icon: '🏠', group: 'home' },
  { id: 'handyman', name: 'Handyman & General Repair', icon: '🛠️', group: 'home' },
  { id: 'pressure-washing', name: 'Pressure Washing', icon: '🧼', group: 'home' },
  { id: 'lawn', name: 'Lawn Care & Landscaping', icon: '🌿', group: 'home' },
  { id: 'tree', name: 'Tree Removal & Trimming', icon: '🌳', group: 'home' },
  { id: 'fencing', name: 'Fencing', icon: '🏗️', group: 'home' },
  { id: 'tv-mounting', name: 'TV Mounting & Smart Home', icon: '📺', group: 'home' },
  { id: 'pest', name: 'Pest Control', icon: '🐛', group: 'home' },
  { id: 'cleaning', name: 'Cleaning Services', icon: '🧹', group: 'home' },
  { id: 'dumpster', name: 'Dumpster Rental', icon: '🗑️', group: 'home' },
  // PERSONAL SERVICES
  { id: 'barbers', name: 'Barbers & Men\'s Grooming', icon: '💈', group: 'personal' },
  { id: 'salons', name: 'Hair Salons & Stylists', icon: '💇', group: 'personal' },
  { id: 'makeup', name: 'Makeup Artists & Beauty', icon: '💄', group: 'personal' },
  { id: 'photographers', name: 'Photographers', icon: '📸', group: 'personal' },
  { id: 'chefs', name: 'Personal Chefs & Catering', icon: '👨‍🍳', group: 'personal' },
  // DAILY ESSENTIALS
  { id: 'grocery', name: 'Grocery & Food Shopping', icon: '🛒', group: 'daily' },
  { id: 'healthcare', name: 'Healthcare & Urgent Care', icon: '🏥', group: 'daily' },
  { id: 'fitness', name: 'Fitness & Gyms', icon: '💪', group: 'daily' },
  { id: 'auto', name: 'Auto Repair & Car Wash', icon: '🚗', group: 'daily' },
  { id: 'childcare', name: 'Childcare & Schools', icon: '👶', group: 'daily' },
  { id: 'pets', name: 'Pets', icon: '🐾', group: 'daily' },
  // LIFESTYLE & ENTERTAINMENT
  { id: 'restaurants', name: 'Restaurants & Dining', icon: '🍽️', group: 'lifestyle' },
  { id: 'breweries', name: 'Breweries & Bars', icon: '🍺', group: 'lifestyle' },
  { id: 'attractions', name: 'Things To Do & Attractions', icon: '🎭', group: 'lifestyle' },
  { id: 'coworking', name: 'Coworking Spaces', icon: '💻', group: 'lifestyle' },
  { id: 'community', name: 'Churches & Community', icon: '⛪', group: 'lifestyle' }
];

const SERVICES = [
  // ========================================
  // 📦 MOVING & SETTLING
  // ========================================

  // --- Moving Companies (10) ---
  { name: 'Hornet Moving', category: 'moving-companies', description: '5,200+ reviews, A+ BBB rating. Full-service local and long-distance.', phone: '(704) 228-0217', website: 'https://hornetmoving.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Gentle Giant Moving', category: 'moving-companies', description: 'Charlotte since 2007. Charlotte Magazine recommended movers.', phone: '(704) 527-9498', website: 'https://gentlegiant.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Easy Movers Inc.', category: 'moving-companies', description: 'Family-owned since 1987. Local CLT institution for residential moves.', phone: '(704) 525-8898', website: 'https://easymovers.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Two Men and a Truck', category: 'moving-companies', description: 'National franchise with expert local Charlotte crews. Packing and moving.', phone: '(704) 357-0945', website: 'https://twomenandatruck.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Bellhop Moving', category: 'moving-companies', description: 'Tech-forward, flat-rate pricing. Book online in minutes.', phone: '(855) 227-3542', website: 'https://getbellhops.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Two Strong Dudes Moving', category: 'moving-companies', description: 'Local favorite — affordable and reliable residential moving.', phone: '(704) 800-6696', website: 'https://twostronggdudesmoving.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Miracle Movers', category: 'moving-companies', description: 'Family-owned, stress-free moves with packing and unpacking services.', phone: '(704) 665-7222', website: 'https://miraclemovers.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'College Hunks Hauling Junk', category: 'moving-companies', description: 'Moving + junk removal combo. Full-service residential and commercial.', phone: '(704) 741-1325', website: 'https://collegehunkshaulingjunk.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'All My Sons Moving', category: 'moving-companies', description: 'National brand with strong local presence. Same-day services.', phone: '(704) 373-0498', website: 'https://allmysons.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Van & Storage', category: 'moving-companies', description: 'Allied Van Lines agent. Long-distance and international moves.', phone: '(704) 523-1155', website: 'https://charlottevan.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Real Estate & Apartments (10) ---
  { name: 'Charlotte Apartment Finders', category: 'real-estate', description: 'Free apartment locator service with virtual tours and expert guidance.', phone: '(704) 817-0827', website: 'https://charlotteaptfinders.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Allen Tate Realtors', category: 'real-estate', description: 'Largest regional real estate firm. Buying, selling, and relocation.', phone: '(704) 365-6900', website: 'https://allentate.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Keller Williams SouthPark', category: 'real-estate', description: 'Large agent network specializing in Charlotte neighborhoods.', phone: '(704) 366-0010', website: 'https://kwsouthpark.com', featured: false, affiliate: false, area: 'South Charlotte' },
  { name: 'Zillow Charlotte', category: 'real-estate', description: 'Browse thousands of Charlotte listings. Rent estimates and market data.', phone: '', website: 'https://zillow.com/charlotte-nc', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Apartments.com Charlotte', category: 'real-estate', description: 'Largest apartment listing platform. Virtual tours and floor plans.', phone: '', website: 'https://apartments.com/charlotte-nc', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Greystar Real Estate', category: 'real-estate', description: 'Manages 11,500+ apartment units across the Charlotte metro.', phone: '(704) 501-7060', website: 'https://greystar.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Cottingham Chalk Hayes', category: 'real-estate', description: 'Boutique Charlotte firm. Expertise in SouthPark, Myers Park, Dilworth.', phone: '(704) 366-5566', website: 'https://cottinghamchalk.com', featured: false, affiliate: false, area: 'South Charlotte' },
  { name: 'RE/MAX Executive Charlotte', category: 'real-estate', description: 'Full-service real estate brokerage with 25+ years in Charlotte.', phone: '(704) 442-1520', website: 'https://remax.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'HotPads Charlotte', category: 'real-estate', description: 'Apartment and rental search with map-based browsing.', phone: '', website: 'https://hotpads.com/charlotte-nc', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Rentfy Charlotte', category: 'real-estate', description: 'Property management and highly-rated rental listings.', phone: '(704) 626-7930', website: 'https://rentfy.co', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Storage & Moving Pods (10) ---
  { name: 'CubeSmart Self Storage', category: 'storage', description: 'Climate-controlled units at multiple Charlotte locations. First month free.', phone: '(704) 525-6685', website: 'https://cubesmart.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Public Storage Charlotte', category: 'storage', description: 'Largest storage provider — over 15 locations in the metro area.', phone: '(704) 522-4666', website: 'https://publicstorage.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Extra Space Storage', category: 'storage', description: 'Indoor, outdoor, and climate-controlled storage. Drive-up access.', phone: '(704) 504-1840', website: 'https://extraspace.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Life Storage Charlotte', category: 'storage', description: 'Indoor climate-controlled units. Vehicle and RV parking available.', phone: '(704) 598-2222', website: 'https://lifestorage.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'PODS Moving & Storage', category: 'storage', description: 'Portable storage containers delivered to your door. Load at your pace.', phone: '(877) 770-7637', website: 'https://pods.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: '1-800-PACK-RAT', category: 'storage', description: 'Portable storage and moving containers. Flexible scheduling.', phone: '(800) 722-5728', website: 'https://1800packrat.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'U-Haul Charlotte', category: 'storage', description: 'Truck rentals, trailers, and self-storage. Multiple locations.', phone: '(704) 596-0610', website: 'https://uhaul.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Uncle Bob\'s Self Storage', category: 'storage', description: 'Convenient locations with online reservations and competitive rates.', phone: '(704) 504-2110', website: 'https://unclebobs.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'StorQuest Self Storage', category: 'storage', description: 'Premium storage with 24/7 access and security cameras.', phone: '(704) 944-5220', website: 'https://storquest.com', featured: false, affiliate: false, area: 'South Charlotte' },
  { name: 'Zippy Shell Charlotte', category: 'storage', description: 'Hybrid moving and storage solution. Container-based service.', phone: '(888) 947-7974', website: 'https://zippyshell.com', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Utilities (6) ---
  { name: 'Duke Energy', category: 'utilities', description: 'Primary electric provider for Charlotte and the Carolinas.', phone: '(800) 777-9898', website: 'https://duke-energy.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Water', category: 'utilities', description: 'City water and sewer service. Setup required for all new residents.', phone: '(704) 336-2205', website: 'https://charlottenc.gov/water', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Piedmont Natural Gas', category: 'utilities', description: 'Natural gas service for heating, cooking, and water heaters.', phone: '(800) 752-7504', website: 'https://piedmontng.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Republic Services', category: 'utilities', description: 'Residential trash and recycling pickup in Charlotte.', phone: '(704) 336-2673', website: 'https://republicservices.com', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Waste Management Charlotte', category: 'utilities', description: 'Waste collection and recycling services in surrounding areas.', phone: '(866) 909-4458', website: 'https://wm.com', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'CharMeck 311', category: 'utilities', description: 'City service requests — streetlight outages, potholes, trash issues.', phone: '311', website: 'https://charlottenc.gov/311', featured: false, affiliate: false, area: 'Charlotte' },

  // --- Internet & TV (10) ---
  { name: 'Spectrum', category: 'internet', description: 'Widest coverage (93.8%), speeds up to 2 Gbps. Cable + internet bundles.', phone: '(855) 243-8892', website: 'https://spectrum.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'AT&T Fiber', category: 'internet', description: 'Fiber internet up to 5 Gbps. Available in select Charlotte neighborhoods.', phone: '(800) 288-2020', website: 'https://att.com/internet', featured: true, affiliate: true, area: 'Select Areas' },
  { name: 'Google Fiber', category: 'internet', description: 'Fiber internet up to 8 Gbps. Expanding coverage across Charlotte.', phone: '(866) 777-7550', website: 'https://fiber.google.com/charlotte', featured: true, affiliate: true, area: 'Expanding' },
  { name: 'T-Mobile 5G Home Internet', category: 'internet', description: 'No contracts, no hidden fees. Plug-and-play 5G home internet.', phone: '(844) 839-5057', website: 'https://t-mobile.com/home-internet', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Verizon 5G Home', category: 'internet', description: 'Fixed wireless 5G internet for eligible Charlotte addresses.', phone: '(800) 837-4966', website: 'https://verizon.com/5g/home', featured: false, affiliate: true, area: 'Select Areas' },
  { name: 'Kinetic by Windstream', category: 'internet', description: 'DSL and fiber internet in surrounding Charlotte suburbs.', phone: '(800) 347-1991', website: 'https://windstream.com', featured: false, affiliate: false, area: 'Suburbs' },
  { name: 'Starlink', category: 'internet', description: 'Satellite internet for rural Charlotte-area residents. Low latency.', phone: '', website: 'https://starlink.com', featured: false, affiliate: true, area: 'Rural Areas' },
  { name: 'YouTube TV', category: 'internet', description: 'Live TV streaming — 100+ channels including local Charlotte stations.', phone: '', website: 'https://tv.youtube.com', featured: false, affiliate: true, area: 'Anywhere' },
  { name: 'Hulu + Live TV', category: 'internet', description: 'Live TV and on-demand streaming combo for cord-cutters.', phone: '', website: 'https://hulu.com/live-tv', featured: false, affiliate: true, area: 'Anywhere' },
  { name: 'DirecTV Stream', category: 'internet', description: 'Streaming cable alternative with sports and local channels.', phone: '(800) 531-5000', website: 'https://directv.com/stream', featured: false, affiliate: true, area: 'Anywhere' },

  // --- Insurance (10) ---
  { name: 'Craig & Preston Insurance', category: 'insurance', description: 'Independent agency — auto, home, renters. Multiple carriers for best rates.', phone: '(704) 544-3220', website: 'https://craigandpreston.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'State Farm Charlotte', category: 'insurance', description: 'Auto, home, renters, life insurance. Multiple Charlotte agents.', phone: '(704) 366-9976', website: 'https://statefarm.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'GEICO Charlotte', category: 'insurance', description: 'Competitive online quotes for auto, renters, and homeowners.', phone: '(800) 207-7847', website: 'https://geico.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Allstate Charlotte', category: 'insurance', description: 'Bundled auto and home insurance. Local agents across Charlotte.', phone: '(704) 541-7410', website: 'https://allstate.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Brightway Insurance Charlotte', category: 'insurance', description: 'Renters insurance specialist. Covers belongings, liability, and relocation.', phone: '(704) 808-4404', website: 'https://brightway.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Lemonade Insurance', category: 'insurance', description: 'Digital-first renters and homeowners insurance. Instant online quotes.', phone: '', website: 'https://lemonade.com', featured: false, affiliate: true, area: 'Anywhere' },
  { name: 'Progressive Charlotte', category: 'insurance', description: 'Auto insurance with Name Your Price tool. Renters available too.', phone: '(800) 776-4737', website: 'https://progressive.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Hausmann Insurance', category: 'insurance', description: 'Personalized auto, home, renters. Annual policy reviews included.', phone: '(704) 366-6445', website: 'https://hausmanninsagency.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Jim Boyce Insurance', category: 'insurance', description: 'Independent broker for renters and landlords. Compares multiple quotes.', phone: '(704) 334-2222', website: 'https://jimboyceinsurance.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'A1 Insurance Agency', category: 'insurance', description: 'Auto, home, renters. Known for professional service and great rates.', phone: '(704) 504-6090', website: 'https://a1insurancepros.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // ========================================
  // 🪪 OFFICIAL BUSINESS
  // ========================================

  // --- DMV & Vehicle Services (10) ---
  { name: 'NC DMV — Charlotte', category: 'dmv', description: 'License transfer, vehicle registration. 60-day deadline for new residents.', phone: '(704) 547-5067', website: 'https://ncdot.gov/dmv', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'DMV — Arrowood Road', category: 'dmv', description: 'Full-service DMV office. Vehicle titles, plates, and ID renewals.', phone: '(704) 547-5067', website: 'https://ncdot.gov/dmv', featured: false, affiliate: false, area: 'South Charlotte' },
  { name: 'License Plate Agency — Eastway', category: 'dmv', description: 'Faster for plates and registration. No license services.', phone: '(704) 568-1971', website: 'https://ncdot.gov/dmv', featured: false, affiliate: false, area: 'East Charlotte' },
  { name: 'License Plate Agency — Pineville', category: 'dmv', description: 'Tag renewals and registration. Shorter wait times than full DMV.', phone: '(704) 889-7444', website: 'https://ncdot.gov/dmv', featured: false, affiliate: false, area: 'Pineville' },
  { name: 'Midas — Vehicle Inspection', category: 'dmv', description: 'NC safety and emissions inspections. Required annually in Mecklenburg.', phone: '(704) 535-2213', website: 'https://midas.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Firestone — Vehicle Inspection', category: 'dmv', description: 'State-licensed inspection station. Safety + emissions combo.', phone: '(704) 554-8473', website: 'https://firestonecompleteautocare.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Jiffy Lube — Emissions Testing', category: 'dmv', description: 'Quick emissions inspections while you wait. Multiple locations.', phone: '(704) 541-1088', website: 'https://jiffylube.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'AAA Carolinas', category: 'dmv', description: 'Roadside assistance, DMV services, travel, and insurance.', phone: '(704) 569-7730', website: 'https://aaa.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Compton\'s Automotive', category: 'dmv', description: 'Trusted local shop for NC inspections and emissions testing.', phone: '(704) 544-7656', website: 'https://comptonsautomotive.com', featured: false, affiliate: false, area: 'South Charlotte' },
  { name: 'Take 5 — Emissions & Inspection', category: 'dmv', description: 'Quick drive-through emissions and state inspection service.', phone: '(704) 847-4200', website: 'https://take5.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Government & Civic (10) ---
  { name: 'Charlotte City Hall', category: 'government', description: 'City permits, zoning, code enforcement, and general services.', phone: '(704) 336-2241', website: 'https://charlottenc.gov', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Mecklenburg County Tax Office', category: 'government', description: 'Property tax, vehicle tax, and personal property listings.', phone: '(704) 336-2475', website: 'https://mecknc.gov/tax', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'Voter Registration — Mecklenburg', category: 'government', description: 'Register to vote online or in person. 25-day deadline before elections.', phone: '(704) 336-2133', website: 'https://mecknc.gov/boe', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'US Post Office — Charlotte Main', category: 'government', description: 'Mail forwarding, PO boxes, passport services.', phone: '(704) 393-4410', website: 'https://usps.com', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'CharMeck 311', category: 'government', description: 'Call 311 for city services — streetlights, potholes, trash, noise.', phone: '311', website: 'https://charlottenc.gov/311', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Charlotte Mecklenburg Library', category: 'government', description: '20 branches. Free library card for Meck County residents.', phone: '(704) 416-0100', website: 'https://cmlibrary.org', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'Mecklenburg County Clerk of Court', category: 'government', description: 'Marriage licenses, name changes, civil records.', phone: '(704) 686-0400', website: 'https://mecknc.gov/courts', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'NC Secretary of State', category: 'government', description: 'Business registration, notary, and corporate filings for NC.', phone: '(919) 814-5400', website: 'https://sosnc.gov', featured: false, affiliate: false, area: 'North Carolina' },
  { name: 'Social Security Office — Charlotte', category: 'government', description: 'SSN applications, replacement cards, and benefits.', phone: '(866) 331-7081', website: 'https://ssa.gov', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'CharMeck Alerts', category: 'government', description: 'Sign up for emergency, weather, and road closure notifications.', phone: '', website: 'https://charlottenc.gov/alerts', featured: false, affiliate: false, area: 'Charlotte' },

  // --- Banking & Credit Unions (10) ---
  { name: 'Bank of America', category: 'banking', description: 'Headquartered in Charlotte! Largest employer. Full banking services.', phone: '(704) 386-5681', website: 'https://bankofamerica.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Truist (formerly BB&T)', category: 'banking', description: 'Major regional bank with deep Carolina roots. Full services.', phone: '(844) 487-8478', website: 'https://truist.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Wells Fargo', category: 'banking', description: 'East Coast technology hub in Charlotte. Consumer and commercial.', phone: '(704) 383-4000', website: 'https://wellsfargo.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Chase Bank', category: 'banking', description: 'Expanding presence in Charlotte. Checking, savings, credit cards.', phone: '(800) 935-9935', website: 'https://chase.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Truliant Federal Credit Union', category: 'banking', description: 'Community credit union — higher savings rates, lower loan rates.', phone: '(800) 822-0382', website: 'https://truliant.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Skyla Credit Union', category: 'banking', description: 'Charlotte-based credit union since 1954. 20 branches across CLT.', phone: '(704) 375-0183', website: 'https://skylacu.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'First Bank (NC)', category: 'banking', description: 'Local NC bank with personal touch. Business and personal banking.', phone: '(704) 233-6260', website: 'https://localfirstbank.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'PNC Bank', category: 'banking', description: 'National bank with multiple Charlotte branches and ATMs.', phone: '(888) 762-2265', website: 'https://pnc.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Ally Bank', category: 'banking', description: 'Online-only bank — high-yield savings, no monthly fees.', phone: '(877) 247-2559', website: 'https://ally.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'Alliant Credit Union', category: 'banking', description: 'Online credit union — competitive rates on savings and loans.', phone: '(800) 328-1935', website: 'https://alliantcreditunion.org', featured: false, affiliate: true, area: 'Online' },

  // --- Tax Prep & Accounting (10) ---
  { name: 'H&R Block Charlotte', category: 'tax', description: 'Tax preparation with multiple Charlotte locations. In-person and virtual.', phone: '(704) 523-2414', website: 'https://hrblock.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Jackson Hewitt Charlotte', category: 'tax', description: 'Tax filing inside Walmart locations. Affordable preparation.', phone: '(800) 234-1040', website: 'https://jacksonhewitt.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'TurboTax', category: 'tax', description: 'DIY online tax filing. Free, basic, and premium tiers.', phone: '', website: 'https://turbotax.intuit.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'Liberty Tax Charlotte', category: 'tax', description: 'Walk-in tax preparation with bilingual staff at many locations.', phone: '(704) 504-9555', website: 'https://libertytax.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Volunteer Income Tax Assistance (VITA)', category: 'tax', description: 'IRS-sponsored free tax help for income under $60k.', phone: '(800) 906-9887', website: 'https://irs.gov/vita', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Brantley & Associates CPA', category: 'tax', description: 'Charlotte CPA firm for individuals and small businesses.', phone: '(704) 849-4501', website: 'https://brantleycpa.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Smith Leonard CPA', category: 'tax', description: 'Accounting, tax planning, audit, and consulting for CLT businesses.', phone: '(704) 527-2225', website: 'https://smithleonard.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'QuickBooks', category: 'tax', description: 'Small business accounting software. Track income, expenses, payroll.', phone: '', website: 'https://quickbooks.intuit.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'AARP Tax-Aide', category: 'tax', description: 'Free tax assistance for seniors 50+ at Charlotte locations.', phone: '(888) 687-2277', website: 'https://aarp.org/taxaide', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'CPA on Fire', category: 'tax', description: 'Modern virtual CPA firm serving Charlotte entrepreneurs and freelancers.', phone: '(704) 800-5692', website: 'https://cpaonfire.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Legal Services (10) ---
  { name: 'Legal Aid of NC — Charlotte', category: 'legal', description: 'Free legal help for low-income Charlotte residents. Housing, family, benefits.', phone: '(704) 971-2621', website: 'https://legalaidnc.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Parker Poe Adams & Bernstein', category: 'legal', description: 'Major Charlotte law firm — real estate, corporate, litigation.', phone: '(704) 372-9000', website: 'https://parkerpoe.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'LegalZoom', category: 'legal', description: 'Online legal services — LLC formation, wills, trademarks.', phone: '(800) 773-0888', website: 'https://legalzoom.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'Charlotte Center for Legal Advocacy', category: 'legal', description: 'Free legal services for underserved communities. Housing rights focus.', phone: '(704) 376-1600', website: 'https://charlottelegaladvocacy.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Tin Fulton Walker & Owen', category: 'legal', description: 'Real estate, estate planning, family law — longstanding CLT firm.', phone: '(704) 338-1220', website: 'https://tinfulton.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'NC Bar Association Lawyer Referral', category: 'legal', description: 'Find a licensed NC attorney. Free 30-minute consultation.', phone: '(919) 677-8574', website: 'https://ncbar.org', featured: false, affiliate: false, area: 'North Carolina' },
  { name: 'Rocket Lawyer', category: 'legal', description: 'Online legal documents, attorney consultations, business formation.', phone: '', website: 'https://rocketlawyer.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'Arnold & Smith PLLC', category: 'legal', description: 'Criminal defense, family law, personal injury in Charlotte.', phone: '(704) 370-2828', website: 'https://arnoldsmithlaw.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Immigration Law Group Charlotte', category: 'legal', description: 'Visa, green card, citizenship, and work permit services.', phone: '(704) 625-0691', website: 'https://immigrationlawgroupcharlotte.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Powers Law Firm', category: 'legal', description: 'Personal injury, car accidents, workers comp in Charlotte.', phone: '(704) 342-4357', website: 'https://charlotteinjurylaw.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // ========================================
  // 🏡 HOME & PROPERTY
  // ========================================

  // --- Plumbers (10) ---
  { name: 'Morris-Jenkins', category: 'plumbers', description: 'CLT\'s most trusted. Plumbing, HVAC, electrical. 24/7 emergency service.', phone: '(704) 357-8484', website: 'https://morrisjenkins.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'E.R. Services', category: 'plumbers', description: 'Emergency plumbing and drain cleaning. Same-day service available.', phone: '(704) 846-5371', website: 'https://erservices.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Roto-Rooter Charlotte', category: 'plumbers', description: 'Drain cleaning, plumbing repair, water restoration. 24/7.', phone: '(704) 541-5025', website: 'https://rotorooter.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Casteel Heating & Cooling', category: 'plumbers', description: 'Full-service plumbing, HVAC, and electrical for Charlotte homes.', phone: '(704) 276-0187', website: 'https://casteelair.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Plumbing Masters', category: 'plumbers', description: 'Licensed local plumbers. Water heaters, sewer lines, fixture installs.', phone: '(704) 461-1200', website: 'https://charlotteplumbingmasters.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Benjamin Franklin Plumbing', category: 'plumbers', description: 'Punctual plumbing — on time or you don\'t pay. Multiple CLT locations.', phone: '(704) 461-3050', website: 'https://benjaminfranklinplumbing.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Mr. Rooter Plumbing Charlotte', category: 'plumbers', description: 'Neighborly brand. Drain cleaning, pipe repair, water treatment.', phone: '(704) 288-4664', website: 'https://mrrooter.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'A&E Plumbing Charlotte', category: 'plumbers', description: 'Residential plumbing specialists — faucets, toilets, water lines.', phone: '(704) 733-7071', website: 'https://aeplumbing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Anytime Plumbing Charlotte', category: 'plumbers', description: 'Affordable residential plumbing. Free estimates on major work.', phone: '(704) 990-2540', website: 'https://anytimeplumbing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Flow Pros Plumbing', category: 'plumbers', description: 'Locally owned — sewer camera inspection, leak detection, repiping.', phone: '(704) 850-5461', website: 'https://flowprosplumbing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Electricians (10) ---
  { name: 'Mister Sparky Charlotte', category: 'electricians', description: 'On-time electricians. Panel upgrades, wiring, outlet installs.', phone: '(704) 444-0082', website: 'https://mistersparky.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Morris-Jenkins Electrical', category: 'electricians', description: 'Full electrical services from CLT\'s most trusted home service brand.', phone: '(704) 357-8484', website: 'https://morrisjenkins.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Douthit Electrical', category: 'electricians', description: 'Family-owned since 1986. Residential and commercial electrical.', phone: '(704) 399-6391', website: 'https://douthitelectrical.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Integra Electrical', category: 'electricians', description: 'Licensed electricians — EV charger installs, generator hookups, panels.', phone: '(704) 751-1818', website: 'https://integraelectrical.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'JM Electrical Charlotte', category: 'electricians', description: 'Residential rewiring, code corrections, lighting upgrades.', phone: '(704) 504-2272', website: 'https://jmelectrical.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Weeks Service Co.', category: 'electricians', description: 'Electrical, plumbing, HVAC — one company for all home systems.', phone: '(704) 266-3866', website: 'https://weeksservice.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Dilling Heating & Cooling + Electric', category: 'electricians', description: 'Full-service electrical with heating and cooling. CLT since 1955.', phone: '(704) 900-3808', website: 'https://dilling.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Electric LLC', category: 'electricians', description: 'Licensed master electrician. Small jobs to full rewires.', phone: '(704) 850-3937', website: 'https://charlotteelectricllc.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Quick Connect Electrical', category: 'electricians', description: 'Smart home wiring, ceiling fan installs, circuit breaker replacement.', phone: '(704) 966-8488', website: 'https://quickconnectelectrical.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'All Star Electrical Services', category: 'electricians', description: 'Emergency electrical repair and new construction wiring.', phone: '(704) 981-4422', website: 'https://allstarelectricalnc.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- HVAC & AC Repair (10) ---
  { name: 'Morris-Jenkins HVAC', category: 'hvac', description: 'Charlotte\'s #1 HVAC company. AC repair, heating, duct cleaning.', phone: '(704) 357-8484', website: 'https://morrisjenkins.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Aire Serv Charlotte', category: 'hvac', description: 'Neighborly brand — AC repair, furnace install, air quality testing.', phone: '(704) 626-9648', website: 'https://aireserv.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'One Hour Heating & Air', category: 'hvac', description: 'Always on time AC and heating. Emergency service 24/7.', phone: '(704) 251-7869', website: 'https://onehourheatandair.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Dilling HVAC', category: 'hvac', description: 'Charlotte since 1955. AC, heating, indoor air quality experts.', phone: '(704) 900-3808', website: 'https://dilling.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Acosta Heating & Cooling', category: 'hvac', description: 'Family-owned. HVAC installs, repairs, maintenance plans.', phone: '(704) 542-8090', website: 'https://acostaheating.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Ross & Witmer', category: 'hvac', description: '75+ years in Charlotte. HVAC, plumbing, and electrical.', phone: '(704) 392-6188', website: 'https://rossandwitmer.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Comfort Systems CLT', category: 'hvac', description: 'Ductless mini-split specialists. New system installs and repair.', phone: '(704) 629-9111', website: 'https://comfortsystemsclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Carolina Comfort Air', category: 'hvac', description: 'Affordable AC repair and maintenance. Free estimates on installs.', phone: '(704) 326-5539', website: 'https://carolinacomfortair.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Environment Masters', category: 'hvac', description: 'Commercial and residential HVAC. Charlotte contractor since 1988.', phone: '(704) 525-1918', website: 'https://environmentmasters.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Cool Breeze HVAC', category: 'hvac', description: 'Honest pricing, fast service. AC tune-ups and emergency repairs.', phone: '(704) 870-4022', website: 'https://coolbreezehvac.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Roofing & Gutters (10) ---
  { name: 'Mighty Dog Roofing Charlotte', category: 'roofing', description: 'Drone inspections, roof repair, replacement, gutters. Free estimates.', phone: '(704) 519-4278', website: 'https://mightydogroofing.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Premiere Roofing & Gutters', category: 'roofing', description: 'Locally owned. Shingle, metal, and flat roof specialists.', phone: '(704) 817-7117', website: 'https://premiereroofing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Southern Star Roofing', category: 'roofing', description: 'GAF Master Elite certified. Insurance claim experts for storm damage.', phone: '(704) 937-7663', website: 'https://southernstarroofing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Roofing Specialists', category: 'roofing', description: 'Residential roof replacement and repairs. 25-year workmanship warranty.', phone: '(704) 625-2220', website: 'https://charlotteroofingspecialists.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'LeafFilter Gutter Protection', category: 'roofing', description: 'Gutter guard installation. No more cleaning. Lifetime warranty.', phone: '(800) 290-6106', website: 'https://leaffilter.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Gutter Helmet Charlotte', category: 'roofing', description: 'Gutter protection system. Never clean gutters again.', phone: '(704) 966-2596', website: 'https://gutterhelmet.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Baker Roofing Company', category: 'roofing', description: 'Commercial and residential roofing since 1915. Charlotte office.', phone: '(704) 522-3863', website: 'https://bakerroofing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Crown Roofing CLT', category: 'roofing', description: 'Affordable residential roofing. Emergency tarps and leak repair.', phone: '(704) 908-1213', website: 'https://crownroofingclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Bone Dry Roofing Charlotte', category: 'roofing', description: 'Roof repair, replacement, and inspections. Financing available.', phone: '(704) 879-8233', website: 'https://bonedryroofing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'All About Gutters CLT', category: 'roofing', description: 'Seamless gutter installation, repair, and downspout extensions.', phone: '(704) 960-7906', website: 'https://allaboutguttersclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Handyman (10) ---
  { name: 'Mr. Handyman — South Charlotte', category: 'handyman', description: 'Neighborly brand. Full-service repairs, maintenance, remodeling.', phone: '(704) 343-8194', website: 'https://mrhandyman.com', featured: true, affiliate: true, area: 'South Charlotte' },
  { name: 'Handyman Connection Matthews', category: 'handyman', description: 'Carpentry, electrical, plumbing, drywall. Licensed craftsmen.', phone: '(704) 321-0818', website: 'https://handymanconnection.com', featured: false, affiliate: true, area: 'Matthews' },
  { name: 'Carolina Premier Handyman', category: 'handyman', description: 'Locally owned. Plumbing, painting, cabinets, flooring, drywall.', phone: '(704) 990-4530', website: 'https://carolinapremierhandyman.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Service Doctor LLC', category: 'handyman', description: '5-star rated. Painting, carpentry, flooring, drywall repair.', phone: '(704) 839-0200', website: 'https://servicedoctor.us', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Joyce Cline Handyman Services', category: 'handyman', description: 'Plumbing, electrical, carpentry, tile, painting. Complex projects.', phone: '(704) 495-4434', website: 'https://joyce-cline.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Ace Handyman Services Charlotte', category: 'handyman', description: 'National brand. Home repairs, improvements, and maintenance.', phone: '(704) 489-5500', website: 'https://acehandymanservices.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'CLT Home Repair Pros', category: 'handyman', description: 'Affordable handyman services — doors, shelving, fixtures, odd jobs.', phone: '(704) 412-3070', website: 'https://clthomerepairpros.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'TaskRabbit Charlotte', category: 'handyman', description: 'On-demand taskers for furniture assembly, mounting, odd jobs.', phone: '', website: 'https://taskrabbit.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Thumbtack Charlotte', category: 'handyman', description: 'Find local handymen. Compare quotes and reviews.', phone: '', website: 'https://thumbtack.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Angi Charlotte', category: 'handyman', description: 'Browse rated handyman pros. Book online for home services.', phone: '', website: 'https://angi.com', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Pressure Washing (10) ---
  { name: 'CLT Pressure Washing', category: 'pressure-washing', description: 'Driveways, siding, decks, patios. Residential and commercial.', phone: '(704) 850-7946', website: 'https://cltpressurewashing.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Window Gang Charlotte', category: 'pressure-washing', description: 'Power washing, window cleaning, gutter cleaning. Multi-service.', phone: '(704) 644-6946', website: 'https://windowgangcharlotte.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Shark Clean CLT', category: 'pressure-washing', description: 'Soft wash and pressure wash for roofs, siding, and concrete.', phone: '(704) 720-2444', website: 'https://sharkclean.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'ProClean Power Washing', category: 'pressure-washing', description: 'Eco-friendly pressure washing. Houses, driveways, fences, patios.', phone: '(704) 625-3100', website: 'https://procleanpowerwashing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Pristine Clean CLT', category: 'pressure-washing', description: 'Premium exterior cleaning — stucco, brick, vinyl safe wash.', phone: '(704) 910-5250', website: 'https://pristinecleanclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'GoTrueClean', category: 'pressure-washing', description: 'Power washing partner with Handyman Connection. Full exterior clean.', phone: '(704) 321-0818', website: 'https://gotrueclean.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Queen City Power Wash', category: 'pressure-washing', description: 'Residential pressure washing — driveways, walkways, pool decks.', phone: '(704) 496-2870', website: 'https://queencitypowerwash.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Hydro Clean Environmental', category: 'pressure-washing', description: 'Industrial and residential pressure washing. Graffiti removal.', phone: '(704) 972-4622', website: 'https://hydrocleannc.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Sparkle Wash CLT', category: 'pressure-washing', description: 'Fleet, building, and residential pressure washing franchise.', phone: '(704) 544-8733', website: 'https://sparklewash.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Clearview Washing Charlotte', category: 'pressure-washing', description: 'Soft wash specialists. Roof cleaning, house washing, gutter brightening.', phone: '(704) 701-5050', website: 'https://clearviewwashing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Lawn Care & Landscaping (10) ---
  { name: 'TruGreen Charlotte', category: 'lawn', description: 'Lawn fertilization, weed control, and pest management plans.', phone: '(704) 330-6800', website: 'https://trugreen.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'LawnStarter Charlotte', category: 'lawn', description: 'Book lawn mowing online. Vetted local lawn care pros.', phone: '', website: 'https://lawnstarter.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Greenscape Inc.', category: 'lawn', description: 'Commercial and residential landscaping. Design, install, maintain.', phone: '(704) 588-0808', website: 'https://greenscapeinc.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Outdoor Expressions CLT', category: 'lawn', description: 'Landscape design, hardscaping, outdoor living spaces.', phone: '(704) 504-3650', website: 'https://outdoorexpressionsclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Weed Man Charlotte', category: 'lawn', description: 'Lawn care programs — fertilizer, aeration, seeding, weed control.', phone: '(704) 841-1199', website: 'https://weedman.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Sunday Lawn Care', category: 'lawn', description: 'Custom lawn care plan shipped to your door. DIY application.', phone: '', website: 'https://sundayapp.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'The Grounds Guys Charlotte', category: 'lawn', description: 'Mowing, mulching, seasonal cleanups. Neighborly franchise.', phone: '(704) 626-3170', website: 'https://groundsguys.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Carolina Landscape Partners', category: 'lawn', description: 'Full-service landscaping — design, irrigation, sod, maintenance.', phone: '(704) 594-2850', website: 'https://carolinalandscapepartners.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Precision Landscaping CLT', category: 'lawn', description: 'Residential mowing, edging, leaf removal, mulch installation.', phone: '(704) 307-2970', website: 'https://precisionlandscapingclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'TaskEasy Charlotte', category: 'lawn', description: 'Automated lawn mowing scheduling. Book and pay online.', phone: '', website: 'https://taskeasy.com', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Tree Removal & Trimming (10) ---
  { name: 'Bartlett Tree Experts', category: 'tree', description: 'Certified arborists. Pruning, removal, disease treatment, planting.', phone: '(704) 542-8891', website: 'https://bartlett.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Davey Tree Expert Co.', category: 'tree', description: 'National arborist company with Charlotte office. Full tree care.', phone: '(704) 596-8tried', website: 'https://davey.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Tree Service', category: 'tree', description: 'Emergency tree removal, stump grinding, lot clearing.', phone: '(704) 365-7770', website: 'https://charlottetreeservice.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'AAA Tree Experts Charlotte', category: 'tree', description: 'Tree removal, trimming, stump removal. 24/7 emergency service.', phone: '(704) 366-1134', website: 'https://aaatreeexpertsclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Sexy Trees CLT', category: 'tree', description: 'Creative name, serious arborists. Tree pruning and health care.', phone: '(704) 790-1222', website: 'https://sexytrees.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Canopy Tree Care', category: 'tree', description: 'Certified arborist. Pruning, cabling, lightning protection, planting.', phone: '(704) 504-4200', website: 'https://canopytreecare.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Monster Tree Service Charlotte', category: 'tree', description: 'Large tree removal, crane work, storm damage cleanup.', phone: '(704) 800-2493', website: 'https://monstertreeservice.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Nelson Tree Specialist', category: 'tree', description: 'Utility line clearing and residential tree services.', phone: '(704) 364-9969', website: 'https://nelsontree.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'SavATree Charlotte', category: 'tree', description: 'Tree and shrub care. Plant health, pruning, removal, fertilization.', phone: '(704) 752-9477', website: 'https://savatree.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Leafy Tree Service CLT', category: 'tree', description: 'Affordable tree cutting, trimming, stump grinding. Free estimates.', phone: '(704) 515-3000', website: 'https://leafytreeservice.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Fencing (10) ---
  { name: 'Freedom Fence Charlotte', category: 'fencing', description: 'Wood, vinyl, aluminum, and chain link fencing. Free estimates.', phone: '(704) 504-2525', website: 'https://freedomfenceclt.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Lowe\'s Fencing Installation', category: 'fencing', description: 'Professional fence installation through Lowe\'s. Multiple materials.', phone: '(704) 523-3041', website: 'https://lowes.com/l/fence-installation', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Home Depot Fencing', category: 'fencing', description: 'Fence supplies and professional installation services.', phone: '(704) 596-8200', website: 'https://homedepot.com/services/fencing', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Superior Fence & Rail Charlotte', category: 'fencing', description: 'Custom fences — privacy, picket, pool, ornamental. Lifetime warranty.', phone: '(704) 621-0034', website: 'https://superiorfenceandrail.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Seegars Fence Company', category: 'fencing', description: 'Southeast fence leader since 1949. Residential and commercial.', phone: '(704) 821-2570', website: 'https://seegars.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Allison Fence Company', category: 'fencing', description: 'Custom wood, vinyl, and aluminum fences. Charlotte family business.', phone: '(704) 392-2855', website: 'https://allisonfence.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Fence Crafters CLT', category: 'fencing', description: 'Privacy fencing, gates, repair. Quality materials and workmanship.', phone: '(704) 307-0750', website: 'https://fencecraftersclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Crown Fence Charlotte', category: 'fencing', description: 'Chain link, wood, vinyl, iron. Commercial and residential installs.', phone: '(704) 545-6500', website: 'https://crownfenceclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Mossy Oak Fence CLT', category: 'fencing', description: 'Board on board, shadow box, custom styles. Stain and seal.', phone: '(704) 981-7550', website: 'https://mossyoakfences.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Ergeon Fencing Charlotte', category: 'fencing', description: 'Online fence quotes with 3D visualization. Fast scheduling.', phone: '', website: 'https://ergeon.com', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- TV Mounting & Smart Home (10) ---
  { name: 'HelloTech Charlotte', category: 'tv-mounting', description: 'TV mounting, smart home setup, WiFi optimization. Same-day.', phone: '(844) 435-5684', website: 'https://hellotech.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Geek Squad — Best Buy', category: 'tv-mounting', description: 'TV mounting, home theater, smart home device installation.', phone: '(704) 535-2288', website: 'https://bestbuy.com/services/geek-squad', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'CLT AV Pros', category: 'tv-mounting', description: 'Custom home theater, TV mounting, whole-home audio installs.', phone: '(704) 819-2828', website: 'https://cltavpros.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Puls TV Mounting', category: 'tv-mounting', description: 'Same-day TV mounting. Book online, technician comes to you.', phone: '', website: 'https://puls.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'TaskRabbit — TV Mount', category: 'tv-mounting', description: 'Find local taskers for TV mounting and cord concealment.', phone: '', website: 'https://taskrabbit.com/m/featured/tv-mounting', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Carolina Custom Mounts', category: 'tv-mounting', description: 'Professional TV mounting — above fireplace, outdoor, commercial.', phone: '(704) 996-7330', website: 'https://carolinacustommounts.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Smart Home Integration CLT', category: 'tv-mounting', description: 'Smart locks, cameras, thermostats, lighting automation.', phone: '(704) 550-0081', website: 'https://smarthomeclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Vivint Smart Home Charlotte', category: 'tv-mounting', description: 'Professional smart home security and automation systems.', phone: '(855) 848-4681', website: 'https://vivint.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Ring Doorbell Installers CLT', category: 'tv-mounting', description: 'Ring, Nest, Arlo camera and doorbell professional installation.', phone: '(704) 444-1800', website: 'https://ringinstallclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'ADT Charlotte', category: 'tv-mounting', description: 'Home security systems, cameras, smart home integration.', phone: '(800) 716-3640', website: 'https://adt.com', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Pest Control (10) ---
  { name: 'Terminix Charlotte', category: 'pest', description: 'Termite, pest, and mosquito control. Free inspections.', phone: '(704) 527-3070', website: 'https://terminix.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Orkin Charlotte', category: 'pest', description: 'Full pest control — roaches, ants, termites, rodents, bed bugs.', phone: '(704) 522-7990', website: 'https://orkin.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Truly Nolen Charlotte', category: 'pest', description: 'Environmentally responsible pest and termite control.', phone: '(704) 544-7770', website: 'https://trulynolen.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Aptive Environmental Charlotte', category: 'pest', description: 'Eco-friendly pest control. Quarterly treatment plans.', phone: '(704) 625-9090', website: 'https://goaptive.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Bulwark Exterminating CLT', category: 'pest', description: 'Guaranteed pest control. If bugs come back, so do they — free.', phone: '(704) 930-4020', website: 'https://bulwarkpestcontrol.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Croach Pest Control Charlotte', category: 'pest', description: 'Interior and exterior pest management. Family and pet safe.', phone: '(704) 625-7700', website: 'https://croach.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Arrow Exterminators Charlotte', category: 'pest', description: 'Pest, termite, and wildlife control. Moisture management.', phone: '(704) 504-5080', website: 'https://arrowexterminators.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Killingsworth Environmental', category: 'pest', description: 'Charlotte-based pest control since 1993. Crawl space solutions.', phone: '(704) 543-3688', website: 'https://killingsworth.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Mosquito Joe Charlotte', category: 'pest', description: 'Mosquito and tick barrier treatments for outdoor living.', phone: '(704) 625-1120', website: 'https://mosquitojoe.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Bug Out Service Charlotte', category: 'pest', description: 'Charlotte pest control — cockroaches, ants, spiders, fleas.', phone: '(704) 563-5700', website: 'https://bugoutservice.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Cleaning Services (10) ---
  { name: 'Molly Maid Charlotte', category: 'cleaning', description: 'Recurring, deep, and move-in/out cleans. Neighborly Done Right Promise.', phone: '(704) 527-1660', website: 'https://mollymaid.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Dust and Mop Charlotte', category: 'cleaning', description: 'Local company. Deep cleaning, recurring maid service, move cleaning.', phone: '(704) 321-0733', website: 'https://dustandmop.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Home Clean Heroes Charlotte', category: 'cleaning', description: 'Bonded, insured, background-checked. Anti-cross-contamination system.', phone: '(704) 526-3780', website: 'https://homecleanheroes.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'CottageCare Charlotte', category: 'cleaning', description: 'Eco-friendly, 165-point checklist. Flexible recurring schedules.', phone: '(704) 544-2212', website: 'https://cottagecare.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Homeaglow Charlotte', category: 'cleaning', description: 'On-demand cleaner marketplace. Book online, choose your cleaner.', phone: '', website: 'https://homeaglow.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Merry Maids Charlotte', category: 'cleaning', description: 'Trusted name in house cleaning. Customized plans.', phone: '(704) 525-3870', website: 'https://merrymaids.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'The Cleaning Authority CLT', category: 'cleaning', description: 'Detail-clean rotating system. Green cleaning products.', phone: '(704) 847-6855', website: 'https://thecleaningauthority.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Two Maids Charlotte', category: 'cleaning', description: 'Pay-for-performance cleaning. Rate your service, it affects their pay.', phone: '(704) 544-8000', website: 'https://twomaids.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Handy Cleaning Services', category: 'cleaning', description: 'Book cleaners via Handy app. Hourly rates, flexible scheduling.', phone: '', website: 'https://handy.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Queen City Cleaning Co.', category: 'cleaning', description: 'Locally owned — residential and Airbnb turnover cleaning.', phone: '(704) 302-7860', website: 'https://queencitycleaningco.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Dumpster Rental (10) ---
  { name: 'Budget Dumpster Charlotte', category: 'dumpster', description: 'Residential dumpster rentals. 10-40 yard sizes. Flat rate pricing.', phone: '(866) 284-6164', website: 'https://budgetdumpster.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Waste Management Dumpsters', category: 'dumpster', description: 'Temporary roll-off dumpsters for home renovation and cleanout.', phone: '(866) 909-4458', website: 'https://wm.com/us/dumpster-rental', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: '1-800-GOT-JUNK? Charlotte', category: 'dumpster', description: 'Full-service junk removal. They load and haul — you point.', phone: '(800) 468-5865', website: 'https://1800gotjunk.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'College Hunks Junk Removal', category: 'dumpster', description: 'Junk hauling, donation pickup, and labor services.', phone: '(704) 741-1325', website: 'https://collegehunkshaulingjunk.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Republic Services Dumpster', category: 'dumpster', description: 'Temporary and permanent dumpster service for construction/demo.', phone: '(704) 336-2673', website: 'https://republicservices.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Bin There Dump That CLT', category: 'dumpster', description: 'Residential-friendly dumpsters — driveway protection included.', phone: '(704) 960-1470', website: 'https://bintheredumpthat.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Junk King Charlotte', category: 'dumpster', description: 'Eco-friendly junk removal. They recycle and donate 60%+ of items.', phone: '(704) 519-5810', website: 'https://junkking.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'CLT Dumpster Rentals', category: 'dumpster', description: 'Local dumpster company. Fast delivery and pickup.', phone: '(704) 850-6040', website: 'https://cltdumpsterrentals.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Bagster by Waste Management', category: 'dumpster', description: 'Buy bag at Home Depot, fill it, schedule pickup. $30 bag + pickup fee.', phone: '(877) 789-2247', website: 'https://thebagster.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'LoadUp Charlotte', category: 'dumpster', description: 'On-demand junk removal. Upfront pricing, online booking.', phone: '', website: 'https://goloadup.com', featured: false, affiliate: true, area: 'Charlotte Metro' }
];
