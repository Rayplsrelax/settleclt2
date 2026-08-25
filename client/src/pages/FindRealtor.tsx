import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Home,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/i18n/I18nContext";
import { trpc } from "@/lib/trpc";
import { trackFindHomeIntent, trackFindHomeLead } from "@/lib/mixpanel";
import type { Locale } from "@shared/i18n";
import { HOUSING_COPY } from "@shared/housing-copy";

type ReferralType = "buying" | "selling" | "renting" | "relocating" | "investing";
type Option = { value: string; label: string };
type RealtorCopy = {
  badge: string;
  heroDescription: string;
  benefits: string[];
  stats: Array<{ value: string; label: string }>;
  howTitle: string;
  steps: Array<{ title: string; description: string }>;
  formDescription: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  referralLabel: string;
  selectOption: string;
  referralOptions: Array<{ value: ReferralType; label: string }>;
  currentCity: string;
  currentCityPlaceholder: string;
  rentalNoticeStrong: string;
  rentalNotice: string;
  monthlyBudget: string;
  budgetRange: string;
  selectBudget: string;
  buyingBudgets: Option[];
  rentalBudgets: Option[];
  timeline: string;
  timelinePlaceholder: string;
  timelines: Option[];
  neighborhoods: string;
  neighborhoodsPlaceholder: string;
  quizHintBefore: string;
  quizHintLink: string;
  quizHintAfter: string;
  notes: string;
  notesPlaceholder: string;
  submitting: string;
  submitHome: string;
  submitApartment: string;
  consentBeforePrivacy: string;
  privacy: string;
  consentBetween: string;
  terms: string;
  consentAfter: string;
  trust: string[];
  quizTitle: string;
  quizDescription: string;
  quizButton: string;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  disclosureTitle: string;
  disclosure: string;
  disclosureBeforeSite: string;
  disclosureAfterSite: string;
  successDescriptionHome: string;
  successDescriptionApartment: string;
  successNext: string;
  exploreNeighborhoods: string;
  backHome: string;
  quizSourceNote: string;
};

const REALTOR_COPY = {
  en: {
    badge: "Charlotte Housing Request",
    heroDescription: HOUSING_COPY.en.request,
    benefits: ["No fee to submit", "Charlotte-area requests", "NCREC license lookup"],
    stats: [
      { value: "1", label: "Request Form" },
      { value: "CLT", label: "Charlotte Focus" },
      { value: "NCREC", label: "License Lookup" },
      { value: "$0", label: "Submission Fee" },
    ],
    howTitle: "How It Works",
    steps: [
      { title: "Tell Us What You Need", description: "Submit the form with the type of housing help you are seeking." },
      { title: "Request Review", description: "Settle CLT reviews the request and may share it with an independent professional when appropriate." },
      { title: "Choose What Comes Next", description: "You decide whether to respond to or work with any professional who contacts you." },
    ],
    formDescription: "Submit the form below for review. A referral or response is not guaranteed.",
    name: "Full Name *",
    namePlaceholder: "Your name",
    email: "Email *",
    emailPlaceholder: "you@email.com",
    phone: "Phone (optional)",
    phonePlaceholder: "(555) 123-4567",
    referralLabel: "What are you looking for? *",
    selectOption: "Select an option",
    referralOptions: [
      { value: "buying", label: "Buying a home" },
      { value: "selling", label: "Selling a home" },
      { value: "renting", label: "Renting an apartment" },
      { value: "relocating", label: "Relocating to Charlotte" },
      { value: "investing", label: "Real estate investing" },
    ],
    currentCity: "Where are you moving from?",
    currentCityPlaceholder: "e.g. New York, Chicago, Atlanta...",
    rentalNoticeStrong: "Review provider terms before proceeding.",
    rentalNotice: "If a professional contacts you, ask them to explain any fees, compensation, and relationships.",
    monthlyBudget: "Monthly Budget",
    budgetRange: "Budget Range",
    selectBudget: "Select budget",
    buyingBudgets: [
      { value: "Under $200K", label: "Under $200K" },
      { value: "$200K - $350K", label: "$200K - $350K" },
      { value: "$350K - $500K", label: "$350K - $500K" },
      { value: "$500K - $750K", label: "$500K - $750K" },
      { value: "$750K - $1M", label: "$750K - $1M" },
      { value: "$1M+", label: "$1M+" },
      { value: "Not sure yet", label: "Not sure yet" },
    ],
    rentalBudgets: [
      { value: "Under $1,200/mo", label: "Under $1,200/mo" },
      { value: "$1,200 - $1,500/mo", label: "$1,200 - $1,500/mo" },
      { value: "$1,500 - $1,800/mo", label: "$1,500 - $1,800/mo" },
      { value: "$1,800 - $2,200/mo", label: "$1,800 - $2,200/mo" },
      { value: "$2,200 - $3,000/mo", label: "$2,200 - $3,000/mo" },
      { value: "$3,000+/mo", label: "$3,000+/mo" },
      { value: "Not sure yet", label: "Not sure yet" },
    ],
    timeline: "Timeline",
    timelinePlaceholder: "When do you need help?",
    timelines: [
      { value: "ASAP (within 30 days)", label: "ASAP (within 30 days)" },
      { value: "1-3 months", label: "1-3 months" },
      { value: "3-6 months", label: "3-6 months" },
      { value: "6-12 months", label: "6-12 months" },
      { value: "Just exploring", label: "Just exploring" },
    ],
    neighborhoods: "Preferred Neighborhoods",
    neighborhoodsPlaceholder: "e.g. South End, NoDa, Ballantyne...",
    quizHintBefore: "Not sure?",
    quizHintLink: "Take our neighborhood quiz",
    quizHintAfter: "to find your match.",
    notes: "Anything else we should know?",
    notesPlaceholder: "Tell us about your situation, must-haves, or questions...",
    submitting: "Submitting...",
    submitHome: "Find Your Home",
    submitApartment: "Find My Apartment",
    consentBeforePrivacy: "By submitting, you agree that Settle CLT may review and share your request with an independent professional. A referral or response is not guaranteed. You may also review our",
    privacy: "Privacy Policy",
    consentBetween: "and",
    terms: "Terms of Service",
    consentAfter: ".",
    trust: ["No Fee to Submit", "No Response Guarantee", "Verify Licenses with NCREC"],
    quizTitle: "Not Sure Where to Start?",
    quizDescription: "Use our neighborhood quiz to explore Charlotte areas by budget and lifestyle, then return here if you want to submit a request.",
    quizButton: "Take the Neighborhood Quiz",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { question: "Is there a submission fee?", answer: "No. Settle CLT does not charge a fee to submit this request. Any professional who contacts you should separately disclose their own fees and relationships." },
      { question: "How quickly will I hear back?", answer: "Timing varies. Submitting a request does not guarantee a referral or response." },
      { question: "Can I submit an apartment request?", answer: "Yes. Apartment requests are reviewed under the same process, but a referral is not guaranteed." },
      { question: "Do I have to work with someone who contacts me?", answer: "No. You decide whether to respond to or work with any professional." },
      { question: "Do you cover areas outside Charlotte?", answer: "This form is focused on Charlotte-area requests. Coverage and referrals are not guaranteed." },
    ],
    disclosureTitle: "NC Real Estate Commission Disclosure:",
    disclosure: HOUSING_COPY.en.disclosure,
    disclosureBeforeSite: "For questions about NC real estate licensing, visit",
    disclosureAfterSite: ".",
    successDescriptionHome: HOUSING_COPY.en.success,
    successDescriptionApartment: HOUSING_COPY.en.success,
    successNext: "In the meantime, explore neighborhoods to get a head start on your search.",
    exploreNeighborhoods: "Explore Neighborhoods",
    backHome: "Back to Home",
    quizSourceNote: "Came from the neighborhood quiz",
  },
  es: {
    badge: "Solicitud de vivienda en Charlotte",
    heroDescription: HOUSING_COPY.es.request,
    benefits: ["Sin cargo por enviar", "Solicitudes del área de Charlotte", "Consulta de licencias en NCREC"],
    stats: [
      { value: "1", label: "Formulario de solicitud" },
      { value: "CLT", label: "Enfoque en Charlotte" },
      { value: "NCREC", label: "Consulta de licencias" },
      { value: "$0", label: "Cargo por enviar" },
    ],
    howTitle: "Cómo funciona",
    steps: [
      { title: "Cuéntanos qué necesitas", description: "Envía el formulario con el tipo de ayuda de vivienda que buscas." },
      { title: "Revisión de la solicitud", description: "Settle CLT revisa la solicitud y puede compartirla con un profesional independiente cuando corresponda." },
      { title: "Decide qué sigue", description: "Tú decides si respondes o trabajas con cualquier profesional que se comunique contigo." },
    ],
    formDescription: "Envía el formulario para revisión. No se garantiza una referencia ni una respuesta.",
    name: "Nombre completo *",
    namePlaceholder: "Tu nombre",
    email: "Correo electrónico *",
    emailPlaceholder: "tu@correo.com",
    phone: "Teléfono (opcional)",
    phonePlaceholder: "(704) 555-0123",
    referralLabel: "¿Qué estás buscando? *",
    selectOption: "Selecciona una opción",
    referralOptions: [
      { value: "buying", label: "Comprar una casa" },
      { value: "selling", label: "Vender una casa" },
      { value: "renting", label: "Alquilar un apartamento" },
      { value: "relocating", label: "Mudarse a Charlotte" },
      { value: "investing", label: "Invertir en bienes raíces" },
    ],
    currentCity: "¿Desde dónde te mudas?",
    currentCityPlaceholder: "p. ej., Nueva York, Chicago, Atlanta...",
    rentalNoticeStrong: "Revisa las condiciones del proveedor antes de continuar.",
    rentalNotice: "Si un profesional se comunica contigo, pídele que explique sus cargos, compensación y relaciones.",
    monthlyBudget: "Presupuesto mensual",
    budgetRange: "Rango de presupuesto",
    selectBudget: "Selecciona un presupuesto",
    buyingBudgets: [
      { value: "Under $200K", label: "Menos de $200 mil" },
      { value: "$200K - $350K", label: "$200 mil - $350 mil" },
      { value: "$350K - $500K", label: "$350 mil - $500 mil" },
      { value: "$500K - $750K", label: "$500 mil - $750 mil" },
      { value: "$750K - $1M", label: "$750 mil - $1 millón" },
      { value: "$1M+", label: "Más de $1 millón" },
      { value: "Not sure yet", label: "Aún no lo sé" },
    ],
    rentalBudgets: [
      { value: "Under $1,200/mo", label: "Menos de $1,200/mes" },
      { value: "$1,200 - $1,500/mo", label: "$1,200 - $1,500/mes" },
      { value: "$1,500 - $1,800/mo", label: "$1,500 - $1,800/mes" },
      { value: "$1,800 - $2,200/mo", label: "$1,800 - $2,200/mes" },
      { value: "$2,200 - $3,000/mo", label: "$2,200 - $3,000/mes" },
      { value: "$3,000+/mo", label: "$3,000+/mes" },
      { value: "Not sure yet", label: "Aún no lo sé" },
    ],
    timeline: "Plazo",
    timelinePlaceholder: "¿Cuándo necesitas ayuda?",
    timelines: [
      { value: "ASAP (within 30 days)", label: "Lo antes posible (en 30 días)" },
      { value: "1-3 months", label: "1 a 3 meses" },
      { value: "3-6 months", label: "3 a 6 meses" },
      { value: "6-12 months", label: "6 a 12 meses" },
      { value: "Just exploring", label: "Solo estoy explorando" },
    ],
    neighborhoods: "Vecindarios preferidos",
    neighborhoodsPlaceholder: "p. ej., South End, NoDa, Ballantyne...",
    quizHintBefore: "¿No estás seguro?",
    quizHintLink: "Haz nuestro cuestionario de vecindarios",
    quizHintAfter: "para encontrar tu opción ideal.",
    notes: "¿Algo más que debamos saber?",
    notesPlaceholder: "Cuéntanos tus necesidades o preguntas...",
    submitting: "Enviando...",
    submitHome: "Encontrar mi hogar",
    submitApartment: "Encontrar mi apartamento",
    consentBeforePrivacy: "Al enviar, aceptas que Settle CLT revise y pueda compartir tu solicitud con un profesional independiente. No se garantiza una referencia ni una respuesta. Consulta la",
    privacy: "Política de Privacidad",
    consentBetween: "y los",
    terms: "Términos de Servicio",
    consentAfter: ".",
    trust: ["Sin cargo por enviar", "Sin garantía de respuesta", "Verifica licencias con NCREC"],
    quizTitle: "¿No sabes por dónde empezar?",
    quizDescription: "Usa nuestro cuestionario para explorar zonas de Charlotte según tu presupuesto y estilo de vida.",
    quizButton: "Hacer el cuestionario de vecindarios",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { question: "¿Hay un cargo por enviar la solicitud?", answer: "No. Settle CLT no cobra por enviar esta solicitud. Cualquier profesional que se comunique contigo debe explicar por separado sus cargos y relaciones." },
      { question: "¿Cuándo recibiré respuesta?", answer: "El plazo varía. Enviar una solicitud no garantiza una referencia ni una respuesta." },
      { question: "¿Puedo enviar una solicitud de apartamento?", answer: "Sí. Las solicitudes de apartamentos siguen el mismo proceso de revisión, pero no se garantiza una referencia." },
      { question: "¿Tengo que trabajar con quien me contacte?", answer: "No. Tú decides si respondes o trabajas con cualquier profesional." },
      { question: "¿Cubren zonas fuera de Charlotte?", answer: "Este formulario se centra en el área de Charlotte. La cobertura y las referencias no están garantizadas." },
    ],
    disclosureTitle: "Divulgación de la Comisión de Bienes Raíces de Carolina del Norte:",
    disclosure: HOUSING_COPY.es.disclosure,
    disclosureBeforeSite: "Para preguntas sobre licencias inmobiliarias de Carolina del Norte, visita",
    disclosureAfterSite: ".",
    successDescriptionHome: HOUSING_COPY.es.success,
    successDescriptionApartment: HOUSING_COPY.es.success,
    successNext: "Mientras tanto, explora los vecindarios para adelantar tu búsqueda.",
    exploreNeighborhoods: "Explorar vecindarios",
    backHome: "Volver al inicio",
    quizSourceNote: "Llegó desde el cuestionario de vecindarios",
  },
} satisfies Record<Locale, RealtorCopy>;

export default function FindRealtor() {
  const { locale, t } = useI18n();
  const copy = REALTOR_COPY[locale];
  useSEO({ title: t("realtor.title"), description: t("realtor.description"), keywords: t("realtor.keywords"), path: "/find-your-home" });
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    const source = params.get("source");
    const type = params.get("type");
    return {
      name: "",
      email: "",
      phone: "",
      referralType: (type === "renting" || type === "buying" ? type : "") as ReferralType | "",
      budget: params.get("budget") || "",
      neighborhoods: params.get("neighborhoods") || "",
      timeline: "",
      notes: source === "quiz" ? copy.quizSourceNote : "",
      currentCity: "",
      referralSource: source || params.get("ref") || "direct",
    };
  });

  useEffect(() => {
    trackFindHomeIntent({ surface: "find_home_page", source: form.referralSource, neighborhoods: form.neighborhoods || undefined, referral_type: form.referralType || undefined });
    // Track initial entry only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitMutation = trpc.referrals.submit.useMutation({
    onSuccess: () => {
      trackFindHomeLead({ referral_type: form.referralType, budget: form.budget || undefined, neighborhoods: form.neighborhoods || undefined, timeline: form.timeline || undefined, referral_source: form.referralSource || undefined, current_city: form.currentCity || undefined });
      setSubmitted(true);
      toast.success(t("realtor.submitSuccess"));
    },
    onError: () => toast.error(t("realtor.error")),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.referralType) {
      toast.error(t("realtor.validationRequired"));
      return;
    }
    submitMutation.mutate({ name: form.name, email: form.email, phone: form.phone || undefined, referralType: form.referralType, budget: form.budget || undefined, neighborhoods: form.neighborhoods || undefined, timeline: form.timeline || undefined, notes: form.notes || undefined, currentCity: form.currentCity || undefined, referralSource: form.referralSource || undefined });
  };

  const isRenting = form.referralType === "renting";
  const budgets = isRenting ? copy.rentalBudgets : copy.buyingBudgets;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-20 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold mb-4">
            {t("realtor.successTitle")}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {isRenting
              ? copy.successDescriptionApartment
              : copy.successDescriptionHome}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {copy.successNext}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/neighborhoods">
              <Button variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                {copy.exploreNeighborhoods}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">{copy.backHome}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statIcons = [Building2, TrendingUp, Users, MapPin];
  const stepIcons = [MessageSquare, UserCheck, Home];
  const trustIcons = [Shield, Clock, DollarSign];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section data-section="realtor-hero" className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-16 md:py-24">
          <div className="container max-w-6xl grid md:grid-cols-2 gap-12 items-center">
            <div><div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4"><Home className="w-4 h-4" />{copy.badge}</div><h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{t("realtor.heroTitle")}</h1><p className="text-lg text-muted-foreground mb-6">{copy.heroDescription}</p><div className="flex flex-col sm:flex-row gap-3">{copy.benefits.map(benefit => <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{benefit}</div>)}</div></div>
            <div className="grid grid-cols-2 gap-4">{copy.stats.map((stat, index) => { const Icon = statIcons[index]; return <Card key={stat.label} className="bg-white/80 border-emerald-100"><CardContent className="p-4 text-center"><Icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></CardContent></Card>; })}</div>
          </div>
        </section>

        <section data-section="realtor-how-it-works" className="py-16 bg-card border-b"><div className="container max-w-4xl"><h2 className="text-2xl font-display font-bold text-center mb-10">{copy.howTitle}</h2><div className="grid md:grid-cols-3 gap-8">{copy.steps.map((step, index) => { const Icon = stepIcons[index]; return <div key={step.title} className="text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4"><Icon className="w-6 h-6" /></div><h3 className="font-semibold mb-2">{step.title}</h3><p className="text-sm text-muted-foreground">{step.description}</p></div>; })}</div></div></section>

        <section data-section="realtor-form" id="form" className="py-16"><div className="container max-w-2xl"><Card className="shadow-lg border-2"><CardHeader className="text-center"><CardTitle>{t("realtor.formTitle")}</CardTitle><CardDescription>{copy.formDescription}</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4"><div><Label htmlFor="realtor-name">{copy.name}</Label><Input id="realtor-name" placeholder={copy.namePlaceholder} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></div><div><Label htmlFor="realtor-email">{copy.email}</Label><Input id="realtor-email" type="email" placeholder={copy.emailPlaceholder} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></div></div>
          <div><Label htmlFor="realtor-phone">{copy.phone}</Label><Input id="realtor-phone" type="tel" placeholder={copy.phonePlaceholder} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></div>
          <div><Label>{copy.referralLabel}</Label><Select value={form.referralType || undefined} onValueChange={value => setForm({ ...form, referralType: value as ReferralType, budget: "" })}><SelectTrigger aria-label={t("realtor.referralTypeAria")}><SelectValue placeholder={copy.selectOption} /></SelectTrigger><SelectContent>{copy.referralOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          {form.referralType === "relocating" && <div><Label htmlFor="realtor-current-city">{copy.currentCity}</Label><Input id="realtor-current-city" placeholder={copy.currentCityPlaceholder} value={form.currentCity} onChange={event => setForm({ ...form, currentCity: event.target.value })} /></div>}
          {isRenting && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"><DollarSign className="w-4 h-4 inline mr-1" /><strong>{copy.rentalNoticeStrong}</strong> {copy.rentalNotice}</div>}
          <div className="grid sm:grid-cols-2 gap-4"><div><Label>{isRenting ? copy.monthlyBudget : copy.budgetRange}</Label><Select value={form.budget} onValueChange={value => setForm({ ...form, budget: value })}><SelectTrigger aria-label={t("realtor.budgetAria")}><SelectValue placeholder={copy.selectBudget} /></SelectTrigger><SelectContent>{budgets.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div><Label>{copy.timeline}</Label><Select value={form.timeline} onValueChange={value => setForm({ ...form, timeline: value })}><SelectTrigger aria-label={t("realtor.timelineAria")}><SelectValue placeholder={copy.timelinePlaceholder} /></SelectTrigger><SelectContent>{copy.timelines.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div>
          <div><Label htmlFor="realtor-neighborhoods">{copy.neighborhoods}</Label><Input id="realtor-neighborhoods" placeholder={copy.neighborhoodsPlaceholder} value={form.neighborhoods} onChange={event => setForm({ ...form, neighborhoods: event.target.value })} /><p className="text-xs text-muted-foreground">{copy.quizHintBefore} <Link href="/quiz" className="text-clt-teal underline">{copy.quizHintLink}</Link> {copy.quizHintAfter}</p></div>
          <div><Label htmlFor="realtor-notes">{copy.notes}</Label><Textarea id="realtor-notes" placeholder={copy.notesPlaceholder} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} rows={3} /></div>
          <Button type="submit" size="lg" className="w-full bg-emerald-600 text-white" disabled={submitMutation.isPending}>{submitMutation.isPending ? copy.submitting : <>{isRenting ? copy.submitApartment : copy.submitHome}<ArrowRight className="w-4 h-4 ml-2" /></>}</Button>
          <p className="text-xs text-center text-muted-foreground">{copy.consentBeforePrivacy} <Link href="/privacy" className="underline">{copy.privacy}</Link> {copy.consentBetween} <Link href="/terms" className="underline">{copy.terms}</Link>{copy.consentAfter}</p>
        </form></CardContent></Card>
        <div data-section="realtor-trust-controls" className="mt-8 grid grid-cols-3 gap-4 text-center">{copy.trust.map((item, index) => { const Icon = trustIcons[index]; return <div key={item} className="flex flex-col items-center gap-2"><Icon className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">{item}</span></div>; })}</div>
        </div></section>

        <section data-section="realtor-quiz-cta" className="py-12 bg-muted/30 border-y"><div className="container max-w-2xl text-center"><Search className="w-8 h-8 text-clt-teal mx-auto mb-3" /><h2 className="font-display font-bold text-lg mb-2">{copy.quizTitle}</h2><p className="text-sm text-muted-foreground mb-4">{copy.quizDescription}</p><Link href="/quiz"><Button variant="outline">{copy.quizButton}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link></div></section>

        <section data-section="realtor-faq" className="py-16 bg-muted/30"><div className="container max-w-2xl"><h2 className="text-2xl font-display font-bold text-center mb-8">{copy.faqTitle}</h2><div className="space-y-3">{copy.faqs.map(item => <details key={item.question} className="bg-card rounded-xl border p-4"><summary className="font-semibold cursor-pointer">{item.question}</summary><p className="text-sm text-muted-foreground mt-3">{item.answer}</p></details>)}</div></div></section>

        <section data-section="realtor-disclosure" className="py-8 bg-muted/20 border-t"><div className="container max-w-3xl"><p className="text-xs text-muted-foreground leading-relaxed text-center"><strong>{copy.disclosureTitle}</strong> {copy.disclosure} {copy.disclosureBeforeSite} <a href="https://www.ncrec.gov" target="_blank" rel="noopener noreferrer" className="underline">ncrec.gov</a>{copy.disclosureAfterSite}</p></div></section>
      </main>
      <Footer />
    </div>
  );
}
