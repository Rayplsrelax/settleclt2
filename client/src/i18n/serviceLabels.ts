import type { Locale } from "@shared/i18n";
import {
  SERVICE_CATEGORIES,
  SERVICE_SUPER_GROUPS,
} from "@shared/services";

type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];
type ServiceSuperGroupId = (typeof SERVICE_SUPER_GROUPS)[number]["id"];
type LocalizedLabel = Readonly<Record<Locale, string>>;

export const SERVICE_SUPER_GROUP_LABELS = {
  moving: { en: "Moving & Settling", es: "Mudanza e instalación" },
  official: { en: "Official Business", es: "Trámites oficiales" },
  home: { en: "Home & Property", es: "Hogar y propiedad" },
  personal: { en: "Personal Services", es: "Servicios personales" },
  daily: { en: "Daily Essentials", es: "Necesidades diarias" },
  lifestyle: { en: "Lifestyle & Entertainment", es: "Estilo de vida y entretenimiento" },
} as const satisfies Record<ServiceSuperGroupId, LocalizedLabel>;

export const SERVICE_CATEGORY_LABELS = {
  "moving-companies": { en: "Moving Companies", es: "Empresas de mudanzas" },
  storage: { en: "Storage & Moving Pods", es: "Almacenamiento y contenedores de mudanza" },
  utilities: { en: "Utilities", es: "Servicios públicos" },
  internet: { en: "Internet & TV", es: "Internet y televisión" },
  insurance: { en: "Insurance", es: "Seguros" },
  dmv: { en: "DMV & Vehicle Services", es: "DMV y servicios vehiculares" },
  government: { en: "Government & Civic", es: "Gobierno y servicios cívicos" },
  banking: { en: "Banking & Credit Unions", es: "Bancos y cooperativas de crédito" },
  tax: { en: "Tax Prep & Accounting", es: "Impuestos y contabilidad" },
  legal: { en: "Legal Services", es: "Servicios legales" },
  plumbers: { en: "Plumbers", es: "Plomería" },
  electricians: { en: "Electricians", es: "Electricistas" },
  hvac: { en: "HVAC & AC Repair", es: "HVAC y reparación de aire acondicionado" },
  roofing: { en: "Roofing & Gutters", es: "Techos y canaletas" },
  handyman: { en: "Handyman & General Repair", es: "Mantenimiento y reparaciones generales" },
  "pressure-washing": { en: "Pressure Washing", es: "Lavado a presión" },
  lawn: { en: "Lawn Care & Landscaping", es: "Cuidado del césped y jardinería" },
  tree: { en: "Tree Removal & Trimming", es: "Poda y retiro de árboles" },
  fencing: { en: "Fencing", es: "Cercas" },
  "tv-mounting": { en: "TV Mounting & Smart Home", es: "Instalación de televisores y hogar inteligente" },
  pest: { en: "Pest Control", es: "Control de plagas" },
  cleaning: { en: "Cleaning Services", es: "Servicios de limpieza" },
  dumpster: { en: "Dumpster Rental", es: "Alquiler de contenedores" },
  barbers: { en: "Barbers & Men's Grooming", es: "Barberías y cuidado masculino" },
  salons: { en: "Hair Salons & Stylists", es: "Salones de belleza y estilistas" },
  makeup: { en: "Makeup Artists & Beauty", es: "Maquillaje y belleza" },
  photographers: { en: "Photographers", es: "Fotografía" },
  chefs: { en: "Personal Chefs & Catering", es: "Chefs personales y catering" },
  grocery: { en: "Grocery & Food Shopping", es: "Supermercados y compras de alimentos" },
  healthcare: { en: "Healthcare & Urgent Care", es: "Salud y atención urgente" },
  fitness: { en: "Fitness & Gyms", es: "Fitness y gimnasios" },
  auto: { en: "Auto Repair & Car Wash", es: "Reparación y lavado de autos" },
  childcare: { en: "Childcare & Schools", es: "Cuidado infantil y escuelas" },
  pets: { en: "Pets", es: "Mascotas" },
  restaurants: { en: "Restaurants & Dining", es: "Restaurantes y comida" },
  breweries: { en: "Breweries & Bars", es: "Cervecerías y bares" },
  attractions: { en: "Things To Do & Attractions", es: "Actividades y atracciones" },
  coworking: { en: "Coworking Spaces", es: "Espacios de coworking" },
  community: { en: "Churches & Community", es: "Iglesias y comunidad" },
  "food-trucks": { en: "Food Trucks", es: "Camiones de comida" },
  "coffee-shops": { en: "Coffee Shops & Cafés", es: "Cafeterías" },
  "beauty-booking": { en: "Beauty & Booking Services", es: "Belleza y servicios con cita" },
  nightlife: { en: "Nightlife & Clubs", es: "Vida nocturna y clubes" },
  "outdoor-parks": { en: "Outdoor & Parks", es: "Actividades al aire libre y parques" },
  "tours-experiences": { en: "Tours & Experiences", es: "Tours y experiencias" },
  "art-culture": { en: "Art & Culture", es: "Arte y cultura" },
  "live-music": { en: "Live Music & Venues", es: "Música en vivo y locales" },
  "yoga-wellness": { en: "Yoga & Wellness", es: "Yoga y bienestar" },
  "sports-recreation": { en: "Sports & Recreation", es: "Deportes y recreación" },
  "kids-activities": { en: "Kids Activities", es: "Actividades infantiles" },
  "date-night": { en: "Date Night Spots", es: "Lugares para una cita" },
  "classes-workshops": { en: "Classes & Workshops", es: "Clases y talleres" },
  "shopping-boutiques": { en: "Shopping & Boutiques", es: "Compras y boutiques" },
  "wedding-events": { en: "Wedding & Events", es: "Bodas y eventos" },
} as const satisfies Record<ServiceCategoryId, LocalizedLabel>;

export function getServiceSuperGroupLabel(id: ServiceSuperGroupId, locale: Locale): string {
  return SERVICE_SUPER_GROUP_LABELS[id][locale];
}

export function getServiceCategoryLabel(id: ServiceCategoryId, locale: Locale): string {
  return SERVICE_CATEGORY_LABELS[id][locale];
}
