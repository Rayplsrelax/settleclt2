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
import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";
import {
  buildNewcomerSteps,
  NEWCOMER_PROGRESS_KEY,
  parseNewcomerProgress,
  type NewcomerStepId,
} from "@/lib/newcomerJourney";

const STEP_ICONS = [MapPinned, Compass, Store, CalendarDays, Check];

const STEP_COPY: Record<
  NewcomerStepId,
  {
    stage: TranslationKey;
    title: TranslationKey;
    description: TranslationKey;
    action: TranslationKey;
  }
> = {
  quiz: {
    stage: "newcomerPlan.steps.quiz.stage",
    title: "newcomerPlan.steps.quiz.title",
    description: "newcomerPlan.steps.quiz.description",
    action: "newcomerPlan.steps.quiz.action",
  },
  compare: {
    stage: "newcomerPlan.steps.compare.stage",
    title: "newcomerPlan.steps.compare.title",
    description: "newcomerPlan.steps.compare.description",
    action: "newcomerPlan.steps.compare.action",
  },
  services: {
    stage: "newcomerPlan.steps.services.stage",
    title: "newcomerPlan.steps.services.title",
    description: "newcomerPlan.steps.services.description",
    action: "newcomerPlan.steps.services.action",
  },
  events: {
    stage: "newcomerPlan.steps.events.stage",
    title: "newcomerPlan.steps.events.title",
    description: "newcomerPlan.steps.events.description",
    action: "newcomerPlan.steps.events.action",
  },
  passport: {
    stage: "newcomerPlan.steps.passport.stage",
    title: "newcomerPlan.steps.passport.title",
    description: "newcomerPlan.steps.passport.description",
    action: "newcomerPlan.steps.passport.action",
  },
};

export default function NewcomerPlan() {
  const { t } = useI18n();
  useSEO({
    title: t("newcomerPlan.seoTitle"),
    description: t("newcomerPlan.seoDescription"),
    keywords: t("newcomerPlan.seoKeywords"),
    path: "/newcomer-plan",
  });
  useStructuredData([
    {
      "@context": "https://schema.org",
      ...buildBreadcrumbSchema([
        {
          name: t("newcomerPlan.breadcrumbHome"),
          url: "https://settleclt.com",
        },
        {
          name: t("newcomerPlan.breadcrumbCurrent"),
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
            <Compass className="h-4 w-4" /> {t("newcomerPlan.badge")}
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            {t("newcomerPlan.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            {t("newcomerPlan.subtitle")}
          </p>
        </div>
      </section>

      <section className="container max-w-4xl py-10 md:py-14">
        <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {completed.length === 1
                  ? t("newcomerPlan.progressSingular", {
                      completed: completed.length,
                      total: steps.length,
                    })
                  : t("newcomerPlan.progressPlural", {
                      completed: completed.length,
                      total: steps.length,
                    })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("newcomerPlan.progressHint")}
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-clt-teal">
              {percent}%
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t("newcomerPlan.progressAria")}
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
            const copy = STEP_COPY[step.id];
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
                      {t("newcomerPlan.step", { number: index + 1 })} ·{" "}
                      {t(copy.stage)}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                      {t(copy.title)}
                    </h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {t(copy.description)}
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
                          {t(copy.action)} <ArrowRight className="h-4 w-4" />
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
                        {done
                          ? t("newcomerPlan.completed")
                          : t("newcomerPlan.markComplete")}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("newcomerPlan.footerNote")}
        </p>
      </section>
    </PageLayout>
  );
}
