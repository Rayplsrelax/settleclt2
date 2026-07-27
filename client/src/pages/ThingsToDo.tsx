import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { Calendar, MapPin, Music, Utensils, Users, Ticket, TreePine, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";

const categories = [
  { icon: Music, label: "Live Music & Concerts", href: "/events", description: "From arena shows at Spectrum Center to intimate sets at Evening Muse, Charlotte's live music scene spans every genre." },
  { icon: Utensils, label: "Food & Drink Events", href: "/events", description: "Food truck rallies, brewery crawls, wine tastings, and pop-up dinners across NoDa, South End, and Plaza Midwood." },
  { icon: Users, label: "Family Activities", href: "/events", description: "Discovery Place, Carowinds, Freedom Park festivals, and weekend farmers markets the whole family will love." },
  { icon: Ticket, label: "Festivals & Markets", href: "/events", description: "Speed Street, Taste of Charlotte, Plaza Midwood Festival, and dozens of seasonal markets and street fairs." },
  { icon: TreePine, label: "Outdoor & Nature", href: "/events", description: "Whitewater Center adventures, greenway trails, Lake Norman boating, and Crowders Mountain hikes — all within 30 minutes." },
  { icon: Heart, label: "Free Things to Do", href: "/events", description: "Gallery crawls, park concerts, library events, community meetups, and First Friday art walks that cost nothing." },
];

const neighborhoods = [
  { name: "NoDa", id: "noda", vibe: "Arts district with breweries and live music" },
  { name: "South End", id: "south-end", vibe: "Walkable rail trail with rooftops and restaurants" },
  { name: "Plaza Midwood", id: "plaza-midwood", vibe: "Eclectic eats, vintage shops, and dive bars" },
  { name: "Uptown", id: "uptown", vibe: "Sports, museums, and skyline views" },
  { name: "Dilworth", id: "dilworth", vibe: "Historic charm, East Blvd dining, Freedom Park" },
  { name: "South Charlotte", id: "south-charlotte", vibe: "Family-friendly with SouthPark and Ballantyne" },
];

export default function ThingsToDo() {
  useSEO({
    title: "Things to Do in Charlotte NC (2026): Events, Activities & Free Fun",
    description: "Discover the best things to do in Charlotte NC this week and weekend. Free events, family activities, concerts, food festivals, outdoor adventures, and nightlife in the Queen City.",
    keywords: "things to do in Charlotte, things to do in Charlotte NC, Charlotte events this weekend, free things to do in Charlotte, family activities Charlotte NC, Charlotte nightlife, Charlotte outdoor activities",
    path: "/things-to-do",
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 sm:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Charlotte NC Guide
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
              Things to Do in{" "}
              <span className="text-primary">Charlotte, NC</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Your complete guide to Charlotte events, activities, and experiences. Whether you just moved here or you're planning your weekend, find exactly what to do in the Queen City.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/events">
                <Button size="lg" className="bg-primary text-primary-foreground font-semibold">
                  <Calendar className="w-4 h-4 mr-2" />
                  Browse Events Calendar
                </Button>
              </Link>
              <Link href="/neighborhoods">
                <Button size="lg" variant="outline" className="font-semibold">
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore Neighborhoods
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What to Do This Week */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            What to Do in Charlotte This Week & Weekend
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl">
            Charlotte has something for everyone — from free outdoor concerts and family-friendly festivals to craft brewery tours and professional sports. Here are the top categories of things to do in Charlotte NC right now.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.label} href={cat.href}>
                <div className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <cat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{cat.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Charlotte Neighborhoods for Activities */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container max-w-5xl">
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            Best Charlotte Neighborhoods for Things to Do
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl">
            Each Charlotte neighborhood has its own personality and activities. Whether you want live music in NoDa, rooftop bars in South End, or family parks in South Charlotte, here's where to go.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((n) => (
              <Link key={n.id} href={`/neighborhood/${n.id}`}>
                <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{n.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{n.vibe}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/neighborhoods">
              <Button variant="outline" className="font-semibold">
                View All 20 Charlotte Neighborhoods →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Long-form SEO Content */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-display font-bold text-2xl text-foreground mb-6">
            Your Complete Guide to Things to Do in Charlotte NC (2026)
          </h2>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 leading-relaxed">
            <p>
              Charlotte, North Carolina is one of the fastest-growing cities in the Southeast, and its entertainment, dining, and outdoor scenes have grown right along with it. Whether you're a newcomer figuring out what to do this weekend or a long-time resident looking for something new, Charlotte delivers year-round.
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">Charlotte Events This Weekend</h3>
            <p>
              Every weekend in Charlotte brings a packed calendar. Friday nights come alive with live music at venues like The Fillmore, Neighborhood Theatre, and Amos' Southend. Saturday mornings mean farmers markets at South End, Matthews, and Davidson. Sundays are for brunch crawls through Plaza Midwood and Dilworth, or catching a Panthers or Charlotte FC game at Bank of America Stadium.
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">Free Things to Do in Charlotte</h3>
            <p>
              You don't need to spend money to enjoy Charlotte. The city offers free First Friday gallery crawls in NoDa, free concerts at Romare Bearden Park, miles of greenway trails for walking and biking, and community events at public libraries across Mecklenburg County. Freedom Park, Latta Park, and the Little Sugar Creek Greenway are always free and always beautiful.
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">Family Activities in Charlotte NC</h3>
            <p>
              Charlotte is one of the best cities in the Southeast for families. Discovery Place Science and Discovery Place Nature offer hands-on learning. Carowinds theme park sits right on the NC/SC border. The U.S. National Whitewater Center provides rafting, zip-lining, and mountain biking for all ages. Seasonal events like the Carolina Renaissance Festival and Speedway Christmas draw families from across the region.
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">Charlotte Nightlife & Date Night</h3>
            <p>
              For nightlife, South End's rooftop bars and breweries are the go-to for young professionals. Uptown offers cocktail lounges and late-night spots near the EpiCentre area. NoDa's dive bars and live music venues attract a creative crowd. For date nights, try the restaurants along East Boulevard in Dilworth, the tasting menus in South End, or catch a show at Blumenthal Performing Arts.
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">Outdoor Adventures Near Charlotte</h3>
            <p>
              Within 30 minutes of Uptown, you can be hiking Crowders Mountain, paddleboarding on Lake Norman, or rock climbing at the Whitewater Center. Charlotte's 50+ miles of greenways connect neighborhoods for running and cycling. Lake Wylie and Mountain Island Lake offer fishing, kayaking, and swimming. The Blue Ridge Mountains are just 2 hours west for weekend getaways.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/events">
              <Button className="bg-primary text-primary-foreground font-semibold">
                See This Week's Events →
              </Button>
            </Link>
            <Link href="/directory">
              <Button variant="outline" className="font-semibold">
                Browse Local Directory
              </Button>
            </Link>
            <Link href="/quiz">
              <Button variant="outline" className="font-semibold">
                Find Your Neighborhood
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
