import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  CheckCircle2,
  Crown,
  Eye,
  Image,
  MousePointerClick,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/i18n/I18nContext";
import { trpc } from "@/lib/trpc";
import { SERVICE_CATEGORIES } from "@shared/services";
import type { Locale } from "@shared/i18n";
import { getServiceCategoryLabel } from "@/i18n/serviceLabels";

type ListingCopy = {
  steps: Array<{ title: string; description: string }>;
  plansTitle: string;
  plansDescription: string;
  plans: Array<{ name: string; description: string; price: string; suffix: string; note: string; badge?: string; features: string[]; button: string }>;
  pricingDisclosure: string;
  alreadyListed: string;
  manageBusiness: string;
  metrics: Array<{ value: string; label: string }>;
  benefitsTitle: string;
  benefitsDescription: string;
  benefits: Array<{ title: string; description: string }>;
  formDescription: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  businessPlaceholder: string;
  areaPlaceholder: string;
  phonePlaceholder: string;
  websitePlaceholder: string;
  descriptionPlaceholder: string;
  freeDisclosure: string;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  successDescription: string;
  claimBefore: string;
  claimLink: string;
  claimAfter: string;
};

const LISTING_COPY = {
  en: {
    steps: [
      { title: "Submit", description: "Fill out the form below with your business details." },
      { title: "Review", description: "We review each submission before any listing is published. Publication is not guaranteed." },
      { title: "Claim", description: "Claim your listing to edit details and manage your profile." },
      { title: "Upgrade", description: "Review optional Featured or Premium placement details after an approved claim." },
    ],
    plansTitle: "Choose Your Plan",
    plansDescription: "Start with a basic submission and review optional paid features after claim approval.",
    plans: [
      { name: "Basic", description: "Basic directory listing features", price: "$0", suffix: "/mo", note: "Free forever", features: ["Listed in directory", "Business detail page", "Google Maps directions", "Customer reviews", "Edit listing after claim"], button: "Get Started Free" },
      { name: "Featured", description: "Featured listing settings", price: "$29", suffix: "/mo", note: "Cancel anytime", badge: "Featured Option", features: ["Everything in Basic", "Featured badge on listing", "Priority category placement", "Photo gallery up to 5", "Detailed click analytics"], button: "Get Started" },
      { name: "Premium", description: "Additional listing and analytics features", price: "$79", suffix: "/mo", note: "Cancel anytime", features: ["Everything in Featured", "Premium badge and listing highlight", "Premium placement setting", "Photo gallery up to 15", "Lead generation analytics", "Monthly performance report"], button: "Get Started" },
    ],
    pricingDisclosure: "All plans include a free basic listing. Premium upgrades are available after claiming your business.",
    alreadyListed: "Already listed?",
    manageBusiness: "Manage your business",
    metrics: [
      { value: "700+", label: "Local Businesses Listed" },
      { value: "20", label: "Charlotte Neighborhoods" },
      { value: "54", label: "Business Categories" },
      { value: "$0", label: "Basic Submission" },
    ],
    benefitsTitle: "Charlotte directory listing workflow",
    benefitsDescription: "Approved listings can include directory details and claim controls, with optional paid features.",
    benefits: [
      { title: "Directory presence", description: "Approved listings can appear in directory and neighborhood searches." },
      { title: "Listing details", description: "Display approved business details, directions, photos, and customer reviews." },
      { title: "Measure results", description: "Track views, clicks, and leads on eligible plans." },
      { title: "Manage anytime", description: "Claim your listing to update details and control upgrades." },
    ],
    formDescription: "Start with a free listing. You can claim and upgrade after we review your submission.",
    namePlaceholder: "Jane Smith",
    emailPlaceholder: "jane@business.com",
    businessPlaceholder: "Charlotte's Best Moving Co.",
    areaPlaceholder: "South End, Charlotte Metro, etc.",
    phonePlaceholder: "(704) 555-0123",
    websitePlaceholder: "https://yourbusiness.com",
    descriptionPlaceholder: "Tell us about your business and what makes it great for Charlotte newcomers...",
    freeDisclosure: "Basic listings are free forever. Premium upgrades are available after claiming your listing.",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { question: "How does listing review work?", answer: "We review each submission before publication. Review timing varies, and publication is not guaranteed." },
      { question: "What's included in the free listing?", answer: "Your business appears in our directory with a detail page, Google Maps directions, customer reviews, and editing after claim approval." },
      { question: "How do I upgrade to Featured or Premium?", answer: "Claim your live listing, then go to My Business in your account menu to select a premium plan." },
      { question: "Can I cancel my premium subscription?", answer: "Yes. Cancel anytime from My Business; premium features remain active until the end of the billing period." },
    ],
    successDescription: "We received your business submission and will review it for the directory. No further action is needed right now.",
    claimBefore: "Once listed, you can",
    claimLink: "claim your business",
    claimAfter: "to unlock editing and premium features.",
  },
  es: {
    steps: [
      { title: "Enviar", description: "Completa el formulario con los datos de tu negocio." },
      { title: "Revisión", description: "Revisamos cada solicitud antes de publicar un perfil. La publicación no está garantizada." },
      { title: "Reclamar", description: "Reclama el perfil para editarlo y administrarlo." },
      { title: "Mejorar", description: "Consulta las opciones de pago Destacado o Premium después de aprobarse la reclamación." },
    ],
    plansTitle: "Elige tu plan",
    plansDescription: "Comienza con una solicitud básica y consulta funciones de pago después de aprobarse la reclamación.",
    plans: [
      { name: "Básico", description: "Funciones básicas del perfil de directorio", price: "$0", suffix: "/mes", note: "Gratis para siempre", features: ["Perfil en el directorio", "Página de detalles", "Indicaciones de Google Maps", "Reseñas de clientes", "Edición después de reclamar"], button: "Comenzar gratis" },
      { name: "Destacado", description: "Configuración del perfil Destacado", price: "$29", suffix: "/mes", note: "Cancela cuando quieras", badge: "Opción Destacada", features: ["Todo lo del plan Básico", "Insignia destacada", "Posición prioritaria", "Galería de hasta 5 fotos", "Analíticas detalladas de clics"], button: "Comenzar" },
      { name: "Premium", description: "Funciones adicionales de perfil y analíticas", price: "$79", suffix: "/mes", note: "Cancela cuando quieras", features: ["Todo lo del plan Destacado", "Insignia y resaltado premium", "Configuración de posición premium", "Galería de hasta 15 fotos", "Analíticas de clientes potenciales", "Informe mensual"], button: "Comenzar" },
    ],
    pricingDisclosure: "Todos los planes incluyen un perfil básico gratuito. Las mejoras premium están disponibles después de reclamar tu negocio.",
    alreadyListed: "¿Ya está publicado?",
    manageBusiness: "Administra tu negocio",
    metrics: [
      { value: "700+", label: "Negocios locales publicados" },
      { value: "20", label: "Vecindarios de Charlotte" },
      { value: "54", label: "Categorías de negocios" },
      { value: "$0", label: "Solicitud básica" },
    ],
    benefitsTitle: "Proceso de perfiles del directorio de Charlotte",
    benefitsDescription: "Los perfiles aprobados pueden incluir datos del directorio y controles de reclamación, con funciones de pago opcionales.",
    benefits: [
      { title: "Presencia en el directorio", description: "Los perfiles aprobados pueden aparecer en búsquedas del directorio y de vecindarios." },
      { title: "Datos del perfil", description: "Muestra datos aprobados, indicaciones, fotos y reseñas de clientes." },
      { title: "Mide resultados", description: "Consulta vistas, clics y clientes potenciales en planes elegibles." },
      { title: "Administra cuando quieras", description: "Reclama tu perfil para actualizar datos y controlar mejoras." },
    ],
    formDescription: "Comienza con un perfil gratuito. Podrás reclamarlo y mejorar el plan después de la revisión.",
    namePlaceholder: "Juana Pérez",
    emailPlaceholder: "juana@negocio.com",
    businessPlaceholder: "Mudanzas Charlotte",
    areaPlaceholder: "South End, área metropolitana de Charlotte, etc.",
    phonePlaceholder: "(704) 555-0123",
    websitePlaceholder: "https://tunegocio.com",
    descriptionPlaceholder: "Cuéntanos sobre tu negocio y por qué es ideal para quienes llegan a Charlotte...",
    freeDisclosure: "Los perfiles básicos son gratuitos para siempre. Las mejoras premium están disponibles después de reclamar tu perfil.",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { question: "¿Cómo funciona la revisión?", answer: "Revisamos cada solicitud antes de publicarla. El plazo varía y la publicación no está garantizada." },
      { question: "¿Qué incluye el perfil gratuito?", answer: "Una página de detalles, indicaciones de Google Maps, reseñas y edición después de reclamarlo." },
      { question: "¿Cómo mejoro el plan?", answer: "Reclama el negocio y elige un plan desde Mi Negocio." },
      { question: "¿Puedo cancelar?", answer: "Sí. Puedes cancelar cuando quieras; las funciones siguen activas hasta terminar el periodo de facturación." },
    ],
    successDescription: "Recibimos los datos de tu negocio y los revisaremos para el directorio. No necesitas hacer nada más por ahora.",
    claimBefore: "Cuando esté publicado, puedes",
    claimLink: "reclamar tu negocio",
    claimAfter: "para editarlo y acceder a funciones premium.",
  },
} satisfies Record<Locale, ListingCopy>;

export default function ListYourBusiness() {
  const { locale, t } = useI18n();
  const copy = LISTING_COPY[locale];
  const { isAuthenticated } = useAuth();
  useSEO({ title: t("business.listTitle"), description: t("listing.seoDescription"), keywords: t("listing.seoKeywords"), path: "/list-your-business" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitBusiness = trpc.leads.submitBusiness.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("business.submissionReceived"));
    },
    onError: () => toast.error(t("listing.error")),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !businessName || !category) return;
    submitBusiness.mutate({ name, email, businessName, category, phone, website, area, description });
  };

  if (submitted) {
    return <PageLayout><section className="py-20 md:py-28"><div className="container"><div className="max-w-lg mx-auto text-center"><CheckCircle className="w-14 h-14 text-primary mx-auto mb-5" /><h1 className="font-display font-bold text-2xl">{t("business.submissionReceived")}</h1><p className="mt-3 text-muted-foreground">{copy.successDescription}</p><p className="mt-4 text-sm text-muted-foreground">{copy.claimBefore} <Link href="/directory" className="text-primary hover:underline">{copy.claimLink}</Link> {copy.claimAfter}</p></div></div></section></PageLayout>;
  }

  const planIcons = [Shield, Sparkles, Crown];
  const benefitIcons = [Search, Star, BarChart3, Zap];

  return (
    <PageLayout>
      <section data-section="listing-hero" className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-14 md:py-20"><div className="container"><div className="max-w-2xl"><h1 className="font-display font-extrabold text-3xl md:text-5xl text-white">{t("business.listTitle")}</h1><p className="mt-4 text-lg text-white/70">{t("listing.heroDescription")}</p></div></div></section>

      <section data-section="listing-how-it-works" className="py-10 bg-muted/50 border-b"><div className="container grid sm:grid-cols-4 gap-6">{copy.steps.map((step, index) => <div key={step.title} className="flex items-start gap-3"><div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{index + 1}</div><div><h2 className="font-semibold text-sm">{step.title}</h2><p className="text-xs text-muted-foreground mt-1">{step.description}</p></div></div>)}</div></section>

      <section data-section="listing-plans" className="py-12 md:py-16"><div className="container"><div className="text-center mb-10"><h2 className="font-display font-bold text-2xl md:text-3xl">{copy.plansTitle}</h2><p className="mt-2 text-muted-foreground">{copy.plansDescription}</p></div><div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">{copy.plans.map((plan, index) => { const Icon = planIcons[index]; return <Card key={plan.name} className={index === 1 ? "border-clt-gold ring-1 ring-clt-gold/20 relative" : "border-border relative"}>{plan.badge && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-clt-gold text-white">{plan.badge}</Badge>}<CardHeader><CardTitle className="flex items-center gap-2"><Icon className="w-5 h-5" />{plan.name}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.suffix}</span></p><p className="text-xs text-muted-foreground mb-5">{plan.note}</p><ul className="space-y-2.5 text-sm">{plan.features.map(feature => <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />{feature}</li>)}</ul><Button variant={index === 0 ? "outline" : "default"} className="w-full mt-6" onClick={() => document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" })}>{plan.button}{index > 0 && <ArrowRight className="w-4 h-4 ml-2" />}</Button></CardContent></Card>; })}</div><p className="text-center text-xs text-muted-foreground mt-6">{copy.pricingDisclosure} {isAuthenticated && <>{copy.alreadyListed} <Link href="/my-business" className="text-primary hover:underline">{copy.manageBusiness}</Link></>}</p></div></section>

      <section data-section="listing-metrics" className="py-10 bg-muted/30 border-y"><div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center">{copy.metrics.map(metric => <div key={metric.label}><p className="text-2xl md:text-3xl font-bold text-primary">{metric.value}</p><p className="text-xs text-muted-foreground mt-1">{metric.label}</p></div>)}</div></section>

      <section data-section="listing-benefits" className="py-12"><div className="container max-w-5xl"><div className="text-center mb-8"><h2 className="font-display font-bold text-2xl">{copy.benefitsTitle}</h2><p className="text-muted-foreground mt-2">{copy.benefitsDescription}</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{copy.benefits.map((benefit, index) => { const Icon = benefitIcons[index]; return <Card key={benefit.title}><CardContent className="p-5"><Icon className="w-6 h-6 text-primary mb-3" /><h3 className="font-semibold">{benefit.title}</h3><p className="text-sm text-muted-foreground mt-1">{benefit.description}</p></CardContent></Card>; })}</div></div></section>

      <section data-section="listing-form" id="submit-form" className="py-12 md:py-16 bg-muted/20"><div className="container"><form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl bg-card border shadow-sm space-y-5"><h2 className="font-display font-bold text-xl flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />{t("listing.formTitle")}</h2><p className="text-sm text-muted-foreground">{copy.formDescription}</p>
        <div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="listing-name" className="block text-sm font-medium mb-1.5">{t("listing.name")}</label><input id="listing-name" value={name} onChange={event => setName(event.target.value)} required className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.namePlaceholder} /></div><div><label htmlFor="listing-email" className="block text-sm font-medium mb-1.5">{t("listing.email")}</label><input id="listing-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.emailPlaceholder} /></div></div>
        <div><label htmlFor="listing-business-name" className="block text-sm font-medium mb-1.5">{t("listing.businessName")}</label><input id="listing-business-name" value={businessName} onChange={event => setBusinessName(event.target.value)} required className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.businessPlaceholder} /></div>
        <div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="listing-category" className="block text-sm font-medium mb-1.5">{t("listing.category")}</label><select id="listing-category" value={category} onChange={event => setCategory(event.target.value)} required className="w-full px-3 py-2.5 rounded-lg border bg-background"><option value="">{t("listing.selectCategory")}</option>{SERVICE_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.icon} {getServiceCategoryLabel(item.id, locale)}</option>)}</select></div><div><label htmlFor="listing-area" className="block text-sm font-medium mb-1.5">{t("listing.area")}</label><input id="listing-area" value={area} onChange={event => setArea(event.target.value)} className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.areaPlaceholder} /></div></div>
        <div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="listing-phone" className="block text-sm font-medium mb-1.5">{t("listing.phone")}</label><input id="listing-phone" type="tel" value={phone} onChange={event => setPhone(event.target.value)} className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.phonePlaceholder} /></div><div><label htmlFor="listing-website" className="block text-sm font-medium mb-1.5">{t("listing.website")}</label><input id="listing-website" type="url" value={website} onChange={event => setWebsite(event.target.value)} className="w-full px-3 py-2.5 rounded-lg border bg-background" placeholder={copy.websitePlaceholder} /></div></div>
        <div><label htmlFor="listing-description" className="block text-sm font-medium mb-1.5">{t("listing.description")}</label><textarea id="listing-description" value={description} onChange={event => setDescription(event.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-lg border bg-background resize-none" placeholder={copy.descriptionPlaceholder} /></div>
        <Button type="submit" size="lg" className="w-full" disabled={submitBusiness.isPending}>{submitBusiness.isPending ? t("listing.submitPending") : t("listing.formTitle")}</Button><p className="text-xs text-muted-foreground text-center">{copy.freeDisclosure}</p>
      </form></div></section>

      <section data-section="listing-trust-controls" className="py-10 bg-background"><div className="container max-w-3xl grid grid-cols-3 gap-5 text-center"><div><Eye className="w-6 h-6 text-primary mx-auto" /><p className="text-xs text-muted-foreground mt-2">{copy.metrics[3].label}</p></div><div><MousePointerClick className="w-6 h-6 text-primary mx-auto" /><p className="text-xs text-muted-foreground mt-2">{copy.benefits[2].title}</p></div><div><Image className="w-6 h-6 text-primary mx-auto" /><p className="text-xs text-muted-foreground mt-2">{copy.benefits[1].title}</p></div></div></section>

      <section data-section="listing-faq" className="py-12 bg-muted/30 border-t"><div className="container max-w-2xl"><h2 className="font-display font-bold text-xl text-center mb-8">{copy.faqTitle}</h2><div className="space-y-4">{copy.faqs.map(item => <div key={item.question} className="p-4 rounded-lg bg-card border"><h3 className="font-semibold text-sm">{item.question}</h3><p className="text-sm text-muted-foreground mt-1">{item.answer}</p></div>)}</div></div></section>
    </PageLayout>
  );
}
