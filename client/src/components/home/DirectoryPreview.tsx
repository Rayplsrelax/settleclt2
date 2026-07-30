import { Search } from "lucide-react";
import { Link } from "wouter";
import { SERVICE_CATEGORIES, SERVICE_SUPER_GROUPS } from "@shared/services";
import { Button } from "@/components/ui/button";

export default function DirectoryPreview() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            700+ Charlotte Services
          </h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            From movers to mechanics, barbers to breweries — every service you
            need to get settled.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICE_SUPER_GROUPS.map(sg => {
            const catCount = SERVICE_CATEGORIES.filter(
              category => category.group === sg.id
            ).length;
            return (
              <Link
                key={sg.id}
                href={`/directory?group=${sg.id}`}
                className="no-underline"
              >
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-center group">
                  <span className="text-3xl">{sg.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {sg.label.replace(`${sg.icon} `, "")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {catCount} categories
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/directory">
            <Button variant="outline" size="lg" className="font-semibold">
              <Search className="w-4 h-4 mr-2" />
              Browse Full Directory
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
