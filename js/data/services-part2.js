// =============================================
// SETTLE CLT — Services Data Part 2
// Personal Services, Daily Essentials, Lifestyle
// =============================================

const SERVICES_PART2 = [
  // ========================================
  // 💇 PERSONAL SERVICES
  // ========================================

  // --- Barbers & Men's Grooming (10) ---
  { name: 'The Boulevard at SouthEnd', category: 'barbers', description: 'Premium barbershop & lounge. Classic cuts, hot towel shaves, drinks.', phone: '(704) 594-4080', website: 'https://theboulevardse.com', featured: true, affiliate: false, area: 'South End' },
  { name: 'Arrow Haircuts', category: 'barbers', description: 'Walk-in haircuts. Easy booking, consistent quality. Multiple locations.', phone: '(704) 926-0065', website: 'https://arrowhaircuts.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Major League Barbers CLT', category: 'barbers', description: 'Full-service barbershop — fades, line-ups, beard trims.', phone: '(704) 536-0067', website: 'https://majorleaguebarbers.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Roosters Men\'s Grooming', category: 'barbers', description: 'Upscale grooming — cuts, color, scalp treatment. Beer while you wait.', phone: '(704) 540-2332', website: 'https://roostersmgc.com', featured: false, affiliate: false, area: 'Ballantyne' },
  { name: 'Floyd\'s 99 Barbershop', category: 'barbers', description: 'Rock-n-roll vibes. Haircuts, shaves, and coloring for men.', phone: '(704) 372-3699', website: 'https://floydsbarbershop.com', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'The Art of Shaving', category: 'barbers', description: 'Luxury shave and grooming products. Royal Shave experience.', phone: '(704) 552-8890', website: 'https://theartofshaving.com', featured: false, affiliate: true, area: 'SouthPark Mall' },
  { name: 'Sport Clips Charlotte', category: 'barbers', description: 'MVP sports-themed haircut experience. Walk-in or online check-in.', phone: '(704) 846-3400', website: 'https://sportclips.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Finley\'s Barber Shop', category: 'barbers', description: 'Walk-in friendly. Affordable fades, tapers, and buzz cuts.', phone: '(704) 817-2278', website: 'https://finleysbarbers.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'LUX Barber Lounge', category: 'barbers', description: 'VIP grooming experience. Hot lather, straight razor, scalp massage.', phone: '(704) 998-5000', website: 'https://luxbarberlounge.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'Taylor\'s Barbershop CLT', category: 'barbers', description: 'Classic neighborhood barbershop. Kids and adults welcome.', phone: '(704) 537-2222', website: 'https://taylorsbarbershopclt.com', featured: false, affiliate: false, area: 'East Charlotte' },

  // --- Hair Salons & Stylists (10) ---
  { name: 'GILD Hair Studio', category: 'salons', description: 'Award-winning stylists in South End. Color, cuts, extensions.', phone: '(704) 332-1202', website: 'https://gildhairstudio.com', featured: true, affiliate: false, area: 'South End' },
  { name: 'Mirror Mirror Salon', category: 'salons', description: 'Luxury salon — highlights, balayage, keratin, corrective color.', phone: '(704) 332-2626', website: 'https://mirrormirror.salon', featured: false, affiliate: false, area: 'Dilworth' },
  { name: 'Drybar Charlotte', category: 'salons', description: 'Blowout bar — no cuts, no color. Just blowouts and styling.', phone: '(704) 626-6008', website: 'https://drybar.com', featured: false, affiliate: true, area: 'SouthPark' },
  { name: 'Ulta Beauty Salon', category: 'salons', description: 'Full-service salon inside Ulta stores. Cuts, color, treatments.', phone: '(704) 541-8582', website: 'https://ulta.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Oscar Blandi Salon Charlotte', category: 'salons', description: 'Celebrity stylist brand. Premium cuts, color, and treatments.', phone: '(704) 442-4800', website: 'https://oscarblandi.com', featured: false, affiliate: false, area: 'Myers Park' },
  { name: 'Hair by Iman CLT', category: 'salons', description: 'Black hair specialist — braids, locs, weaves, natural hair care.', phone: '(704) 301-8877', website: 'https://hairbyiman.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Salon Lofts Charlotte', category: 'salons', description: 'Luxury salon suites. Independent stylists in upscale private rooms.', phone: '(704) 364-4000', website: 'https://salonlofts.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Great Clips Charlotte', category: 'salons', description: 'Affordable haircuts — walk-in or online check-in. 10+ locations.', phone: '(704) 541-7700', website: 'https://greatclips.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Supercuts Charlotte', category: 'salons', description: 'Budget-friendly haircuts and color. Multiple CLT locations.', phone: '(704) 542-1000', website: 'https://supercuts.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'BLK Beauty Charlotte', category: 'salons', description: 'Natural hair care specialist — twist-outs, silk press, protective styles.', phone: '(704) 550-1212', website: 'https://blkbeautyclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Makeup Artists & Beauty (10) ---
  { name: 'Glam by Joy CLT', category: 'makeup', description: 'Bridal, prom, and special event makeup artist. Mobile service.', phone: '(704) 408-1234', website: 'https://glambyjoy.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Sephora SouthPark', category: 'makeup', description: 'Premium cosmetics and beauty services. Makeovers and consultations.', phone: '(704) 365-3580', website: 'https://sephora.com', featured: false, affiliate: true, area: 'SouthPark Mall' },
  { name: 'MAC Cosmetics Charlotte', category: 'makeup', description: 'Professional makeup counter. Artist-quality products and application.', phone: '(704) 364-0800', website: 'https://maccosmetics.com', featured: false, affiliate: true, area: 'SouthPark Mall' },
  { name: 'Face Art Beauty CLT', category: 'makeup', description: 'Mobile makeup artist — weddings, photoshoots, corporate events.', phone: '(704) 310-5500', website: 'https://faceartbeauty.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Wink Lash & Brow Studio', category: 'makeup', description: 'Lash extensions, brow lamination, tinting, microblading.', phone: '(704) 504-8899', website: 'https://winklashstudio.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Benefit Brow Bar Charlotte', category: 'makeup', description: 'Brow waxing, tinting, and styling inside Ulta stores.', phone: '(704) 541-8582', website: 'https://benefitcosmetics.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Queen City Glam', category: 'makeup', description: 'Full glam squad — hair and makeup for groups. Bridal party bookings.', phone: '(704) 675-4420', website: 'https://queencityglam.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'European Wax Center Charlotte', category: 'makeup', description: 'Full-body waxing services — brows, lip, bikini, legs. Multiple locations.', phone: '(704) 544-3600', website: 'https://waxcenter.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Amazing Lash Studio CLT', category: 'makeup', description: 'Lash extensions — classic, hybrid, volume. Membership plans.', phone: '(704) 504-7229', website: 'https://amazinglashstudio.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Merle Norman Cosmetics CLT', category: 'makeup', description: 'Personalized consultations, complimentary makeovers, skincare.', phone: '(704) 366-0017', website: 'https://merlenorman.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Photographers (10) ---
  { name: 'Andi Lupton Photography', category: 'photographers', description: 'Weddings, families, portraits. Charlotte photographer of the year.', phone: '(704) 490-5050', website: 'https://andiluptonphoto.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Indigo Photography CLT', category: 'photographers', description: 'Lifestyle and portrait photography — families, seniors, headshots.', phone: '(704) 307-6720', website: 'https://indigophotoclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'JLM Weddings', category: 'photographers', description: 'Wedding photography and videography. Documentary style.', phone: '(704) 504-3310', website: 'https://jlmweddings.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Flashpoint Studios', category: 'photographers', description: 'Commercial, product, and corporate photography. In-studio or on-site.', phone: '(704) 333-0770', website: 'https://flashpointstudios.com', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'Brittney Oliver Photography', category: 'photographers', description: 'Newborn, maternity, and family sessions. Heartfelt storytelling.', phone: '(704) 701-3400', website: 'https://brittneyoliver.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'LKN Photo Co.', category: 'photographers', description: 'Family, senior, and engagement photos. Lake Norman and Charlotte.', phone: '(704) 919-4200', website: 'https://lknphoto.com', featured: false, affiliate: false, area: 'Lake Norman' },
  { name: 'ShootShare Charlotte', category: 'photographers', description: 'Photography marketplace — browse portfolios, book online.', phone: '', website: 'https://shootshare.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'CLT Headshot Co.', category: 'photographers', description: 'Professional headshots for LinkedIn, corporate, and acting.', phone: '(704) 880-3300', website: 'https://cltheadshots.com', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'Fresh Look Photography', category: 'photographers', description: 'Real estate photography, drone video, virtual tours for agents.', phone: '(704) 504-8100', website: 'https://freshlookphotography.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Thumbtack Photographers', category: 'photographers', description: 'Browse and compare Charlotte photographers. Reviews and pricing.', phone: '', website: 'https://thumbtack.com/nc/charlotte/photographers', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Personal Chefs & Catering (10) ---
  { name: 'Chef Alyssa\'s Kitchen', category: 'chefs', description: 'Personal chef, cooking classes, private dinner parties.', phone: '(704) 366-2433', website: 'https://chefalyssaskitchen.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Best Impressions Catering', category: 'chefs', description: 'Full-service catering — weddings, corporate, social events.', phone: '(704) 525-5558', website: 'https://bestimpressions.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Something Classic Catering', category: 'chefs', description: 'Charlotte\'s premier event caterer. Elegant menus and service.', phone: '(704) 333-0003', website: 'https://somethingclassic.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Lucky Dog Bark & Brew Catering', category: 'chefs', description: 'Dog-friendly venue with catering for private events.', phone: '(704) 632-9093', website: 'https://luckydogbarkandbrew.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'Personal Chef CLT', category: 'chefs', description: 'Weekly meal prep service. In-home cooking for families.', phone: '(704) 850-2210', website: 'https://personalchefclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Hungry For Good Catering', category: 'chefs', description: 'Farm-to-table catering. Corporate lunches and private events.', phone: '(704) 705-4530', website: 'https://hungryforgood.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Fresh Meal Plan CLT', category: 'chefs', description: 'Healthy, pre-made meals delivered. Keto, paleo, and balanced options.', phone: '(704) 900-3100', website: 'https://freshmealplandirect.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'CaterCow Charlotte', category: 'chefs', description: 'Online catering marketplace — order from top CLT restaurants.', phone: '', website: 'https://catercow.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Meal Village CLT', category: 'chefs', description: 'Homemade meals by local chefs. Order online, pickup or delivery.', phone: '(704) 990-1050', website: 'https://mealvillageclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'The Chef\'s Table CLT', category: 'chefs', description: 'Pop-up dining experiences and private chef bookings.', phone: '(704) 620-8800', website: 'https://chefstableclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // ========================================
  // 🛒 DAILY ESSENTIALS
  // ========================================

  // --- Grocery & Food Shopping (10) ---
  { name: 'Harris Teeter', category: 'grocery', description: 'Charlotte-born grocery chain! Fuel points, online ordering, delivery.', phone: '(704) 844-3100', website: 'https://harristeeter.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Publix', category: 'grocery', description: 'Southeast favorite. Pub subs, bakery, pharmacy. Expanding in CLT.', phone: '(704) 503-0300', website: 'https://publix.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Trader Joe\'s Charlotte', category: 'grocery', description: 'Unique, affordable products. SouthPark and Stonecrest locations.', phone: '(704) 334-0737', website: 'https://traderjoes.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Whole Foods Market', category: 'grocery', description: 'Organic and natural groceries. SouthPark and Midtown locations.', phone: '(704) 366-9944', website: 'https://wholefoodsmarket.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'ALDI Charlotte', category: 'grocery', description: 'Budget-friendly groceries. Award-winning store-brand products.', phone: '(855) 955-2534', website: 'https://aldi.us', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Walmart Grocery Pickup', category: 'grocery', description: 'Free curbside grocery pickup. Everyday low prices.', phone: '(704) 599-9926', website: 'https://walmart.com/grocery', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Costco Charlotte', category: 'grocery', description: 'Bulk groceries and household items. Membership warehouse.', phone: '(704) 227-2700', website: 'https://costco.com', featured: false, affiliate: false, area: 'University Area' },
  { name: 'Lidl Charlotte', category: 'grocery', description: 'European discount grocer with quality baked goods and produce.', phone: '(704) 504-5660', website: 'https://lidl.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Instacart Charlotte', category: 'grocery', description: 'Grocery delivery from multiple stores. Same-day delivery.', phone: '', website: 'https://instacart.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Charlotte Regional Farmers Market', category: 'grocery', description: 'Local produce, meats, baked goods. Open year-round Sat & Sun.', phone: '(704) 357-1269', website: 'https://charlottefarmersmarket.com', featured: false, affiliate: false, area: 'Yorkmont Rd' },

  // --- Healthcare & Urgent Care (10) ---
  { name: 'Atrium Health', category: 'healthcare', description: 'Charlotte\'s largest healthcare system. 40+ convenient care locations.', phone: '(704) 355-2000', website: 'https://atriumhealth.org', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Novant Health', category: 'healthcare', description: 'Major health network with urgent care, primary care, and specialty.', phone: '(704) 384-4000', website: 'https://novanthealth.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'MinuteClinic (CVS)', category: 'healthcare', description: 'Walk-in clinic inside CVS. Flu shots, strep tests, minor illness.', phone: '(866) 389-2727', website: 'https://cvs.com/minuteclinic', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'FastMed Urgent Care', category: 'healthcare', description: 'Walk-in urgent care. X-rays, lab work, physicals. Multiple locations.', phone: '(704) 887-8484', website: 'https://fastmed.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'CareSpot Urgent Care', category: 'healthcare', description: 'Urgent care for non-emergency medical needs. Short wait times.', phone: '(704) 504-9200', website: 'https://carespot.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'ZoomCare (Online Telehealth)', category: 'healthcare', description: 'Virtual doctor visits. Get prescriptions and advice from home.', phone: '', website: 'https://zocdoc.com', featured: false, affiliate: true, area: 'Online' },
  { name: 'Mecklenburg County Health Dept', category: 'healthcare', description: 'Immunizations, STD testing, health inspections, WIC, vital records.', phone: '(704) 336-4700', website: 'https://mecknc.gov/healthdepartment', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'Dental Works Charlotte', category: 'healthcare', description: 'Affordable dental care — cleanings, fillings, crowns. Walk-ins.', phone: '(704) 544-3720', website: 'https://dentalworks.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Aspen Dental Charlotte', category: 'healthcare', description: 'New patient specials. Dentures, implants, general dentistry.', phone: '(704) 817-4090', website: 'https://aspendental.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'America\'s Best Eye Care', category: 'healthcare', description: 'Eye exams, glasses, contacts. 2 pairs for $79.95 deal.', phone: '(704) 504-5500', website: 'https://americasbest.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Fitness & Gyms (10) ---
  { name: 'Charlotte YMCA', category: 'fitness', description: '12 branches across Charlotte. Pool, gym, classes, childcare.', phone: '(704) 716-6300', website: 'https://ymcacharlotte.org', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Orangetheory Fitness CLT', category: 'fitness', description: 'Heart-rate based HIIT workouts. Multiple Charlotte studios.', phone: '(704) 544-8333', website: 'https://orangetheory.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Planet Fitness Charlotte', category: 'fitness', description: 'Judgement-free zone. $10/month. Multiple Charlotte locations.', phone: '(704) 544-8400', website: 'https://planetfitness.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'MADabolic Charlotte', category: 'fitness', description: 'Strength-based interval training. Small group sessions.', phone: '(704) 335-8400', website: 'https://madabolic.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'CrossFit Charlotte', category: 'fitness', description: 'CrossFit box with community focus. Beginners welcome.', phone: '(704) 841-1234', website: 'https://crossfitcharlotte.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Burn Boot Camp Charlotte', category: 'fitness', description: 'Women-focused bootcamp. Free childwatch. Multiple locations.', phone: '(704) 999-2876', website: 'https://burnbootcamp.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'LA Fitness Charlotte', category: 'fitness', description: 'Full gym — weights, cardio, pool, basketball. Multiple locations.', phone: '(704) 529-1411', website: 'https://lafitness.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'CycleBar Charlotte', category: 'fitness', description: 'Premium indoor cycling studio. Theme rides and performance tracking.', phone: '(704) 504-0860', website: 'https://cyclebar.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Club Fitness Charlotte', category: 'fitness', description: 'No-frills local gym. Free weights, machines, affordable rates.', phone: '(704) 536-7848', website: 'https://clubfitnessclt.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'F45 Training Charlotte', category: 'fitness', description: 'Functional training with technology. Team workouts, 45 minutes.', phone: '(704) 489-2045', website: 'https://f45training.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Auto Repair & Car Wash (10) ---
  { name: 'Firestone Complete Auto Care', category: 'auto', description: 'Tires, brakes, oil changes, AC, alignment. Many CLT locations.', phone: '(704) 554-8473', website: 'https://firestonecompleteautocare.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Pep Boys Charlotte', category: 'auto', description: 'Auto repair and tires. Online scheduling, multiple locations.', phone: '(704) 535-8200', website: 'https://pepboys.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Christian Brothers Automotive', category: 'auto', description: 'Trustworthy auto repair. Free courtesy shuttle. Warranty included.', phone: '(704) 847-6677', website: 'https://cbac.com', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Autobell Car Wash', category: 'auto', description: 'Charlotte-born car wash chain since 1969! Full-service and express.', phone: '(704) 529-3330', website: 'https://autobell.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Discount Tire Charlotte', category: 'auto', description: 'Tire sales, install, rotation, repair. Price match guarantee.', phone: '(704) 544-8800', website: 'https://discounttire.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Jiffy Lube Charlotte', category: 'auto', description: 'Quick oil changes, tire rotation, AC services. No appointment.', phone: '(704) 541-1088', website: 'https://jiffylube.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Take 5 Oil Change', category: 'auto', description: 'Stay-in-your-car oil change. 10-minute service.', phone: '(704) 847-4200', website: 'https://take5.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'AAMCO Charlotte', category: 'auto', description: 'Transmission repair specialists. Brake, tune-up, AC service.', phone: '(704) 568-0099', website: 'https://aamco.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Caliber Collision Charlotte', category: 'auto', description: 'Auto body and collision repair. Insurance approved. Multiple shops.', phone: '(704) 399-1590', website: 'https://calibercollision.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Queen City Detailing', category: 'auto', description: 'Mobile auto detailing. Interior, exterior, ceramic coating.', phone: '(704) 907-5300', website: 'https://queencitydetailing.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Childcare & Schools (10) ---
  { name: 'KinderCare Charlotte', category: 'childcare', description: 'Infant to pre-K care and learning. Multiple Charlotte centers.', phone: '(704) 554-4488', website: 'https://kindercare.com', featured: true, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Bright Horizons Charlotte', category: 'childcare', description: 'Employer-sponsored and community childcare. Infants to K.', phone: '(704) 365-4480', website: 'https://brighthorizons.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Primrose School Charlotte', category: 'childcare', description: 'Character-focused curriculum. Infant, toddler, preschool, after-school.', phone: '(704) 544-7997', website: 'https://primroseschools.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Mecklenburg Schools', category: 'childcare', description: 'Public school district — K-12 registration and school finder.', phone: '(980) 343-3000', website: 'https://cms.k12.nc.us', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'Goddard School Charlotte', category: 'childcare', description: 'Play-based STEAM learning. Infants to school-age.', phone: '(704) 541-3133', website: 'https://goddardschool.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Childcare Resources Inc.', category: 'childcare', description: 'Non-profit childcare referral service for Meck County families.', phone: '(704) 376-6697', website: 'https://childcareresourcesinc.org', featured: false, affiliate: false, area: 'Mecklenburg County' },
  { name: 'Discovery Place Kids', category: 'childcare', description: 'Children\'s museum offering memberships, programs, and camps.', phone: '(704) 372-6261', website: 'https://discoveryplace.org', featured: false, affiliate: false, area: 'Huntersville' },
  { name: 'YMCA After School Care', category: 'childcare', description: 'After-school programs at 50+ CMS schools. Homework help and activities.', phone: '(704) 716-6300', website: 'https://ymcacharlotte.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Care.com Charlotte', category: 'childcare', description: 'Find babysitters, nannies, and tutors. Background checks available.', phone: '', website: 'https://care.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Montessori School of Charlotte', category: 'childcare', description: 'Montessori curriculum — toddler through 3rd grade. Peaceful environment.', phone: '(704) 366-4998', website: 'https://montessoricharlotte.org', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Pets (10) ---
  { name: 'Charlotte Animal Control', category: 'pets', description: 'Pet license, lost pets, stray pickup, and adoption services.', phone: '(704) 336-3786', website: 'https://charlottenc.gov/AnimalsCMPD', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Humane Society of Charlotte', category: 'pets', description: 'Pet adoption, low-cost spay/neuter, and vaccination clinics.', phone: '(704) 377-0534', website: 'https://humanesocietyofcharlotte.org', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Banfield Pet Hospital', category: 'pets', description: 'Vet clinics inside PetSmart. Wellness plans and preventive care.', phone: '(704) 504-0740', website: 'https://banfield.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Dilworth Animal Hospital', category: 'pets', description: 'Full-service vet — check-ups, surgery, dental, boarding.', phone: '(704) 332-0318', website: 'https://dilworthvet.com', featured: false, affiliate: false, area: 'Dilworth' },
  { name: 'Camp Bow Wow Charlotte', category: 'pets', description: 'Doggy daycare and overnight boarding. Webcams for pet parents.', phone: '(704) 504-0660', website: 'https://campbowwow.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'PetSmart Charlotte', category: 'pets', description: 'Pet supplies, grooming, training, and PetsHotel boarding.', phone: '(704) 504-0740', website: 'https://petsmart.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Fetch! Pet Care Charlotte', category: 'pets', description: 'Professional dog walking, pet sitting, and overnight care.', phone: '(704) 850-4700', website: 'https://fetchpetcare.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Rover Charlotte', category: 'pets', description: 'Find trusted local dog walkers, pet sitters, and boarding.', phone: '', website: 'https://rover.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Wag! Charlotte', category: 'pets', description: 'On-demand dog walking app. Vetted and insured walkers.', phone: '', website: 'https://wagwalking.com', featured: false, affiliate: true, area: 'Charlotte Metro' },
  { name: 'Charlotte Dog Club', category: 'pets', description: 'Dog parks, meetups, and pet-friendly events around Charlotte.', phone: '', website: 'https://charlottedogclub.com', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // ========================================
  // 🎉 LIFESTYLE & ENTERTAINMENT
  // ========================================

  // --- Restaurants & Dining (10) ---
  { name: 'Midwood Smokehouse', category: 'restaurants', description: 'Best BBQ in Charlotte — brisket, ribs, pulled pork. Multiple locations.', phone: '(704) 295-4227', website: 'https://midwoodsmokehouse.com', featured: true, affiliate: false, area: 'Plaza Midwood' },
  { name: 'Leah & Louise', category: 'restaurants', description: 'Modern juke joint. Southern-chef driven. Camp North End.', phone: '(980) 297-1564', website: 'https://leahandlouise.com', featured: false, affiliate: false, area: 'Camp North End' },
  { name: 'Haberdish', category: 'restaurants', description: 'Southern shared plates in NoDa. Family-style dining.', phone: '(704) 817-7640', website: 'https://haberdishclt.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'Supperland', category: 'restaurants', description: 'Beautiful historic church turned restaurant. New American cuisine.', phone: '(980) 297-1189', website: 'https://supperlandclt.com', featured: false, affiliate: false, area: 'Elizabeth' },
  { name: 'Yafo Kitchen', category: 'restaurants', description: 'Fast-casual Mediterranean bowls. Charlotte Magazine Best Of winner.', phone: '(980) 219-7775', website: 'https://yafokitchen.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Chick-fil-A (HQ in ATL CLT fave)', category: 'restaurants', description: 'Charlotte\'s most beloved fast food. Drive-thru lines to prove it.', phone: '', website: 'https://chick-fil-a.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Bao & Noodle Charlotte', category: 'restaurants', description: 'Hand-pulled noodles and steamed bao. Authentic Asian comfort food.', phone: '(704) 228-5678', website: 'https://baoandnoodle.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Steak 48 Charlotte', category: 'restaurants', description: 'Premium steakhouse in SouthPark. Upscale dining, fine cuts.', phone: '(704) 540-4848', website: 'https://steak48.com', featured: false, affiliate: false, area: 'SouthPark' },
  { name: 'The Fig Tree Restaurant', category: 'restaurants', description: 'Charlotte fine dining institution in historic Elizabeth. French-American.', phone: '(704) 332-3322', website: 'https://charlottefigtree.com', featured: false, affiliate: false, area: 'Elizabeth' },
  { name: 'OpenTable Charlotte', category: 'restaurants', description: 'Browse and reserve Charlotte restaurants online. Reviews and menus.', phone: '', website: 'https://opentable.com/charlotte', featured: false, affiliate: true, area: 'Charlotte Metro' },

  // --- Breweries & Bars (10) ---
  { name: 'NoDa Brewing Company', category: 'breweries', description: 'Charlotte\'s original craft brewery. Hop Drop \'N Roll IPA.', phone: '(704) 900-6851', website: 'https://nodabrewing.com', featured: true, affiliate: false, area: 'NoDa' },
  { name: 'Olde Mecklenburg Brewery', category: 'breweries', description: 'German-style brews in a huge biergarten. Family-friendly.', phone: '(704) 525-5644', website: 'https://oldemeckbrew.com', featured: false, affiliate: false, area: 'LoSo' },
  { name: 'Sycamore Brewing', category: 'breweries', description: 'South End taproom with huge outdoor patio. Great IPAs and sours.', phone: '(704) 910-3821', website: 'https://sycamorebrew.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Birdsong Brewing Company', category: 'breweries', description: 'Award-winning beers. Lazy Bird brown ale, Higher Ground IPA.', phone: '(704) 332-1810', website: 'https://birdsongbrewing.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'Wooden Robot Brewery', category: 'breweries', description: 'Sour and wild-fermented ales. Multiple taproom locations.', phone: '(704) 405-2042', website: 'https://woodenrobotbrewery.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Divine Barrel Brewing', category: 'breweries', description: 'NoDa brewery known for creative sours and IPAs. Dog-friendly patio.', phone: '(704) 626-6243', website: 'https://divinebarrel.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'Resident Culture Brewing', category: 'breweries', description: 'Trendy Plaza Midwood brewery. Hazy IPAs and barrel-aged stouts.', phone: '(704) 750-2433', website: 'https://residentculturebrewing.com', featured: false, affiliate: false, area: 'Plaza Midwood' },
  { name: 'Suffolk Punch', category: 'breweries', description: 'Cocktail bar, brewery, and coffee roaster. South End hot spot.', phone: '(704) 248-8835', website: 'https://suffolkpunch.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'The Broken Spoke', category: 'breweries', description: 'Dive bar meets honky-tonk. Live music and cold drinks.', phone: '(980) 339-4458', website: 'https://thebrokenspokeclt.com', featured: false, affiliate: false, area: 'Plaza Midwood' },
  { name: 'Protagonist Clubhouse', category: 'breweries', description: 'Craft cocktail bar in South End. Speakeasy vibes, curated menu.', phone: '(704) 900-3255', website: 'https://protagonistbar.com', featured: false, affiliate: false, area: 'South End' },

  // --- Things To Do & Attractions (10) ---
  { name: 'Carowinds', category: 'attractions', description: 'Thrill rides and water park on the NC/SC border. Season passes.', phone: '(704) 588-2600', website: 'https://carowinds.com', featured: true, affiliate: true, area: 'Fort Mill' },
  { name: 'Discovery Place Science', category: 'attractions', description: 'Interactive science museum in Uptown. IMAX theater. Family favorite.', phone: '(704) 372-6261', website: 'https://discoveryplace.org', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'NASCAR Hall of Fame', category: 'attractions', description: 'Racing history, simulators, and exhibits. CLT is the motorsport capital.', phone: '(704) 654-4400', website: 'https://nascarhall.com', featured: false, affiliate: true, area: 'Uptown' },
  { name: 'US National Whitewater Center', category: 'attractions', description: 'Outdoor adventure — kayaking, rafting, mountain biking, zip lining.', phone: '(704) 391-3900', website: 'https://whitewater.org', featured: false, affiliate: false, area: 'West Charlotte' },
  { name: 'Charlotte Motor Speedway', category: 'attractions', description: 'NASCAR events, concerts, and the Christmas lights spectacular.', phone: '(704) 455-3200', website: 'https://charlottemotorspeedway.com', featured: false, affiliate: true, area: 'Concord' },
  { name: 'Spectrum Center (Hornets)', category: 'attractions', description: 'NBA Charlotte Hornets games, concerts, and events.', phone: '(704) 688-8600', website: 'https://spectrumcentercharlotte.com', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'Bank of America Stadium (Panthers)', category: 'attractions', description: 'NFL Carolina Panthers home. Football, soccer, and concerts.', phone: '(704) 358-7000', website: 'https://panthers.com', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'Freedom Park', category: 'attractions', description: '98-acre park — lake, trails, playground, tennis, festival venue.', phone: '(704) 336-3854', website: 'https://mecknc.gov/parks', featured: false, affiliate: false, area: 'Myers Park' },
  { name: 'Mint Museum Charlotte', category: 'attractions', description: 'Art and design museum. Two locations: Uptown and Randolph Road.', phone: '(704) 337-2000', website: 'https://mintmuseum.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Camp North End', category: 'attractions', description: 'Adaptive reuse campus — food, art, shopping, yoga, events.', phone: '', website: 'https://campnorthend.com', featured: false, affiliate: false, area: 'North End' },

  // --- Coworking Spaces (10) ---
  { name: 'Hygge Coworking', category: 'coworking', description: 'Charlotte\'s largest coworking — multiple locations, event space.', phone: '(704) 879-3600', website: 'https://hyggecoworking.com', featured: true, affiliate: false, area: 'South End' },
  { name: 'WeWork Charlotte', category: 'coworking', description: 'Premium shared office space. Private offices and hot desks.', phone: '(646) 491-9060', website: 'https://wework.com', featured: false, affiliate: true, area: 'Uptown' },
  { name: 'Industrious Charlotte', category: 'coworking', description: 'Upscale coworking in SouthPark and Uptown. Day passes available.', phone: '(704) 247-4700', website: 'https://industriousoffice.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Spaces Charlotte', category: 'coworking', description: 'Regus premium brand — offices, coworking, meeting rooms.', phone: '(704) 227-0012', website: 'https://spacesworks.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'ALT Charlotte', category: 'coworking', description: 'Creative coworking and event space. Boutique feel, NoDa.', phone: '(980) 495-6644', website: 'https://altclt.com', featured: false, affiliate: false, area: 'NoDa' },
  { name: 'The Loading Dock', category: 'coworking', description: 'Coworking and podcast studio in Camp North End.', phone: '(704) 756-5500', website: 'https://theloadingdock.co', featured: false, affiliate: false, area: 'Camp North End' },
  { name: 'Venture X Charlotte', category: 'coworking', description: 'Executive-style coworking. Private offices, boardrooms, café.', phone: '(704) 489-8240', website: 'https://venturex.com', featured: false, affiliate: false, area: 'Ballantyne' },
  { name: 'Regus Charlotte', category: 'coworking', description: 'Flexible office rentals and virtual offices. 10+ CLT locations.', phone: '(704) 369-7777', website: 'https://regus.com', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Common Desk Charlotte', category: 'coworking', description: 'Modern shared workspace. Monthly memberships and day passes.', phone: '(704) 320-8800', website: 'https://commondesk.com', featured: false, affiliate: false, area: 'South End' },
  { name: 'Charlotte Mecklenburg Library (Free WiFi)', category: 'coworking', description: '20 branches with free WiFi, power, and study rooms. Library card free.', phone: '(704) 416-0100', website: 'https://cmlibrary.org', featured: false, affiliate: false, area: 'Charlotte Metro' },

  // --- Churches & Community (10) ---
  { name: 'Elevation Church', category: 'community', description: 'Charlotte-born megachurch. Pastor Steven Furtick. 25+ campuses.', phone: '(704) 246-0800', website: 'https://elevationchurch.org', featured: true, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Forest Hill Church', category: 'community', description: 'Multi-campus. Contemporary worship, community groups, outreach.', phone: '(704) 543-6161', website: 'https://foresthillchurch.tv', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Transformation Church CLT', category: 'community', description: 'Non-denominational, diverse, gospel-centered. Freedom Campus.', phone: '(704) 504-1010', website: 'https://transformationchurch.tc', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'First Baptist Church Charlotte', category: 'community', description: 'Historic Uptown church. Traditional and contemporary services.', phone: '(704) 375-0281', website: 'https://fbccharlotte.org', featured: false, affiliate: false, area: 'Uptown' },
  { name: 'Charlotte Rescue Mission', category: 'community', description: 'Homeless services — meals, shelter, addiction recovery programs.', phone: '(704) 333-4673', website: 'https://charlotterescuemission.org', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Habitat for Humanity Charlotte', category: 'community', description: 'Volunteer builds, ReStore, and affordable homeownership programs.', phone: '(704) 376-2054', website: 'https://habitatcharlotte.org', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Charlotte Jewish Community Center', category: 'community', description: 'Fitness, education, camp, and community events for all backgrounds.', phone: '(704) 366-5007', website: 'https://charlottejcc.org', featured: false, affiliate: false, area: 'Shalom Park' },
  { name: 'Islamic Center of Charlotte', category: 'community', description: 'Friday prayers, classes, community events. Open to visitors.', phone: '(704) 537-9399', website: 'https://iccnc.org', featured: false, affiliate: false, area: 'Charlotte' },
  { name: 'Meetup.com Charlotte', category: 'community', description: 'Find groups for every interest — hiking, tech, dining, sports, newcomers.', phone: '', website: 'https://meetup.com/cities/us/nc/charlotte', featured: false, affiliate: false, area: 'Charlotte Metro' },
  { name: 'Nextdoor Charlotte', category: 'community', description: 'Neighborhood social network — find events, recommendations, alerts.', phone: '', website: 'https://nextdoor.com', featured: false, affiliate: false, area: 'Charlotte Metro' }
];

// Merge SERVICES_PART2 into SERVICES
SERVICES.push(...SERVICES_PART2);
