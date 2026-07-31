import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Circle,
  Compass,
  MapPinned,
  Store,
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import {
  buildBreadcrumbSchema,
  useStructuredData,
} from "@/hooks/useStructuredData";
import { trackNewcomerJourneyAction } from "@/lib/mixpanel";
import {
  buildNewcomerSteps,
  NEWCOMER_PROGRESS_KEY,
  parseNewcomerProgress,
  type NewcomerStepId,
} from "@/lib/newcomerJourney";

const STEP_ICONS = [MapPinned, Compass, Store, CalendarDays, Check];

export default function NewcomerPlan() {
  useSEO({
    title: "Your Charlotte Newcomer Plan — A Guided Move Checklist",
    description:
      "Build your Charlotte move plan: find and compare neighborhoods, save local services and events, and track discoveries with Passport.",
    keywords:
      "Charlotte newcomer checklist, moving to Charlotte plan, Charlotte relocation guide, first week Charlotte NC",
    path: "/newcomer-plan",
  });
  useStructuredData([
    {
      "@context": "https://schema.org",
      ...buildBreadcrumbSchema([
        { name: "Home", url: "https://settleclt.com" },
        {
          name: "Newcomer Plan",
          url: "https://settleclt.com/newcomer-plan",
        },
      ]),
    },
  ]);

  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const source = params.get("source") || "direct";
  const steps = useMemo(() => buildNewcomerSteps(params.get("ids")), [params]);
  const [completed, setCompleted] = useState<NewcomerStepId[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCompleted(
      parseNewcomerProgress(localStorage.getItem(NEWCOMER_PROGRESS_KEY))
    );
    setReady(true);
    trackNewcomerJourneyAction("start", { surface: source });
  }, [source]);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(NEWCOMER_PROGRESS_KEY, JSON.stringify(completed));
    }
  }, [completed, ready]);

  const toggleStep = (id: NewcomerStepId) => {
    setCompleted(current =>
      current.includes(id)
        ? current.filter(stepId => stepId !== id)
        : [...current, id]
    );
  };

  const percent = Math.round((completed.length / steps.length) * 100);

  return (
    <PageLayout>
      <section className="bg-gradient-to-br from-clt-navy via-clt-navy to-clt-teal-dark py-14 md:py-20 text-white">
        <div className="container max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-clt-gold">
            <Compass className="h-4 w-4" /> Free · no signup required
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Your guided plan for settling into Charlotte
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Move from neighborhood research to a practical first week. Check off
            each stage here; your progress stays on this device.
          </p>
        </div>
      </section>

      <section className="container max-w-4xl py-10 md:py-14">
        <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {completed.length} of {steps.length} stages complete
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start anywhere and return whenever you need the next step.
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-clt-teal">
              {percent}%
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Newcomer plan progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-clt-teal to-clt-gold transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <ol className="space-y-4">
          {steps.map((step, index) => {
            const done = completed.includes(step.id);
            const Icon = STEP_ICONS[index];
            return (
              <li
                key={step.id}
                className={`rounded-2xl border bg-card p-5 transition-colors md:p-6 ${
                  done ? "border-clt-teal/40" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clt-teal/10 text-clt-teal">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-clt-teal">
                      Step {index + 1} · {step.stage}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                      {step.title}
                    </h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={step.href}>
                        <Button
                          className="gap-2 bg-clt-teal text-white hover:bg-clt-teal-dark"
                          onClick={() =>
                            trackNewcomerJourneyAction("step_click", {
                              step_id: step.id,
                              step_number: index + 1,
                              destination: step.href,
                              surface: source,
                            })
                          }
                        >
                          {step.action} <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        aria-pressed={done}
                        onClick={() => {
                          toggleStep(step.id);
                          trackNewcomerJourneyAction("progress_toggle", {
                            step_id: step.id,
                            completed: !done,
                            surface: source,
                          });
                        }}
                      >
                        {done ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                        {done ? "Completed" : "Mark complete"}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          This first version stores checklist progress locally. Saved
          businesses, event stamps, and Passport history continue to use their
          existing Settle CLT features.
        </p>
      </section>
    </PageLayout>
  );
}
