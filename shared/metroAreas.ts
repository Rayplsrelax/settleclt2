export interface MetroArea {
  id: string;
  name: string;
  type: "inner-ring" | "suburb" | "exurb";
  vibe: string;
  distance: string; // from Uptown
  avgRent: string;
  highlights: string[];
  serviceCount?: number;
}

export const CORE_NEIGHBORHOOD_NAMES = [
  "South End", "NoDa", "Plaza Midwood", "Dilworth",
  "Myers Park", "Uptown", "Ballantyne", "Camp North End"
];

export const metroAreas: MetroArea[] = [
  {
    id: "southpark",
    name: "SouthPark",
    type: "inner-ring",
    vibe: "Upscale shopping & dining hub",
    distance: "8 mi from Uptown",
    avgRent: "$1,800",
    highlights: ["SouthPark Mall", "Phillips Place", "Symphony Park"],
  },
  {
    id: "elizabeth",
    name: "Elizabeth",
    type: "inner-ring",
    vibe: "Historic charm near medical district",
    distance: "2 mi from Uptown",
    avgRent: "$1,500",
    highlights: ["Independence Park", "Novant Health", "Elizabeth Ave shops"],
  },
  {
    id: "loso",
    name: "LoSo (Lower South End)",
    type: "inner-ring",
    vibe: "Emerging creative & brewery corridor",
    distance: "3 mi from Uptown",
    avgRent: "$1,550",
    highlights: ["Olde Mecklenburg Brewery", "Scaleybark Station", "Art studios"],
  },
  {
    id: "east-charlotte",
    name: "East Charlotte",
    type: "inner-ring",
    vibe: "Diverse, international food scene",
    distance: "7 mi from Uptown",
    avgRent: "$1,200",
    highlights: ["Central Ave eats", "Eastway Park", "Cultural diversity"],
  },
  {
    id: "south-charlotte",
    name: "South Charlotte",
    type: "suburb",
    vibe: "Family-oriented with top schools",
    distance: "12 mi from Uptown",
    avgRent: "$1,700",
    highlights: ["Top-rated schools", "Pineville shops", "Park Road Park"],
  },
  {
    id: "west-charlotte",
    name: "West Charlotte",
    type: "inner-ring",
    vibe: "Historic neighborhoods in transition",
    distance: "5 mi from Uptown",
    avgRent: "$1,100",
    highlights: ["Biddleville", "Johnson C. Smith University", "Affordable living"],
  },
  {
    id: "university-area",
    name: "University City",
    type: "suburb",
    vibe: "College town energy near UNC Charlotte",
    distance: "10 mi from Uptown",
    avgRent: "$1,250",
    highlights: ["UNC Charlotte", "LYNX Blue Line Extension", "University Research Park"],
  },
  {
    id: "huntersville",
    name: "Huntersville",
    type: "suburb",
    vibe: "Lake Norman access with suburban comfort",
    distance: "16 mi from Uptown",
    avgRent: "$1,600",
    highlights: ["Birkdale Village", "Lake Norman", "Latta Nature Preserve"],
  },
  {
    id: "lake-norman",
    name: "Lake Norman",
    type: "exurb",
    vibe: "Waterfront living & weekend escapes",
    distance: "22 mi from Uptown",
    avgRent: "$1,800",
    highlights: ["Boating & water sports", "Lakefront dining", "Davidson College"],
  },
  {
    id: "matthews",
    name: "Matthews",
    type: "suburb",
    vibe: "Small-town feel with a walkable downtown",
    distance: "12 mi from Uptown",
    avgRent: "$1,450",
    highlights: ["Stumptown Park", "Main Street shops", "Squirrel Lake Park"],
  },
  {
    id: "concord",
    name: "Concord",
    type: "exurb",
    vibe: "Motorsports capital & outlet shopping",
    distance: "20 mi from Uptown",
    avgRent: "$1,400",
    highlights: ["Charlotte Motor Speedway", "Concord Mills", "Great Wolf Lodge"],
  },
  {
    id: "fort-mill",
    name: "Fort Mill, SC",
    type: "exurb",
    vibe: "SC tax benefits with CLT commute",
    distance: "18 mi from Uptown",
    avgRent: "$1,500",
    highlights: ["No state income tax (SC)", "Anne Springs Close Greenway", "Kingsley Town Center"],
  },
  {
    id: "pineville",
    name: "Pineville",
    type: "suburb",
    vibe: "Budget-friendly with big-box convenience",
    distance: "14 mi from Uptown",
    avgRent: "$1,300",
    highlights: ["Carolina Place Mall", "McAlpine Creek Greenway", "I-485 access"],
  },
  {
    id: "mecklenburg-county",
    name: "Mecklenburg County",
    type: "suburb",
    vibe: "Broad county services & parks",
    distance: "Varies",
    avgRent: "$1,400",
    highlights: ["County parks system", "Greenway network", "Library system"],
  },
];
