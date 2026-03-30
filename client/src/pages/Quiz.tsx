import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  QUIZ_QUESTIONS, scoreNeighborhoods, getMatchLabel,
  type QuizAnswers, type QuizQuestion, type NeighborhoodScore
} from "@shared/quiz";
import {
  ArrowRight, ArrowLeft, RotateCcw, MapPin, DollarSign,
  TrendingUp, Heart, Star, AlertTriangle, ChevronRight,
  Sparkles, Home as HomeIcon, GitCompare, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareButtons from "@/components/ShareButtons";
import { useSEO } from "@/hooks/useSEO";

// ─── Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current) / total) * 100;
  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Question {current + 1} of {total}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-clt-teal to-clt-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Single Question Step ─────────────────────────────────────────
function QuestionStep({
  question, answer, onAnswer, onNext, onBack, isFirst, isLast
}: {
  question: QuizQuestion;
  answer: string | string[] | undefined;
  onAnswer: (qId: string, value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const selected = question.type === 'multi'
    ? (Array.isArray(answer) ? answer : [])
    : (typeof answer === 'string' ? answer : '');

  const handleSelect = (optionId: string) => {
    if (question.type === 'single') {
      onAnswer(question.id, optionId);
    } else {
      const arr = Array.isArray(selected) ? selected : [];
      if (optionId === 'none') {
        onAnswer(question.id, ['none']);
        return;
      }
      const filtered = arr.filter(id => id !== 'none');
      if (filtered.includes(optionId)) {
        onAnswer(question.id, filtered.filter(id => id !== optionId));
      } else if (filtered.length < (question.maxSelections || 3)) {
        onAnswer(question.id, [...filtered, optionId]);
      }
    }
  };

  const isSelected = (optionId: string) => {
    if (question.type === 'single') return selected === optionId;
    return Array.isArray(selected) && selected.includes(optionId);
  };

  const canProceed = question.type === 'single'
    ? typeof selected === 'string' && selected.length > 0
    : Array.isArray(selected) && selected.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="text-center mb-8">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
          {question.title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          {question.subtitle}
        </p>
        {question.type === 'multi' && question.maxSelections && (
          <p className="text-xs text-clt-teal mt-2 font-medium">
            Select up to {question.maxSelections}
          </p>
        )}
      </div>

      <div className={`grid gap-3 max-w-lg mx-auto ${
        question.options.length > 5 ? 'grid-cols-2' : 'grid-cols-1'
      }`}>
        {question.options.map((opt) => {
          const active = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                active
                  ? 'border-clt-teal bg-clt-teal/10 shadow-md shadow-clt-teal/10'
                  : 'border-border bg-card hover:border-clt-teal/40 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{opt.emoji}</span>
                <div className="min-w-0">
                  <div className={`font-semibold text-sm ${active ? 'text-clt-teal' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  {opt.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                  )}
                </div>
                {active && (
                  <CheckCircle2 className="w-5 h-5 text-clt-teal shrink-0 ml-auto" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center max-w-lg mx-auto mt-8">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isFirst}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="gap-2 bg-clt-teal hover:bg-clt-teal-dark text-white"
        >
          {isLast ? 'See My Matches' : 'Next'} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center animate-in fade-in duration-500 max-w-xl mx-auto">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-clt-teal to-clt-gold mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
        Find Your Charlotte Neighborhood
      </h1>
      <p className="text-muted-foreground text-lg mb-2 max-w-md mx-auto">
        Answer 6 quick questions and we'll match you with the best neighborhoods based on your budget, lifestyle, and priorities.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Takes about 2 minutes. No signup required.
      </p>
      <Button
        onClick={onStart}
        size="lg"
        className="gap-2 bg-clt-teal hover:bg-clt-teal-dark text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-clt-teal/20"
      >
        Let's Go <ArrowRight className="w-5 h-5" />
      </Button>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        {[
          { icon: <MapPin className="w-5 h-5" />, label: '20 Neighborhoods', sub: 'Core + Metro' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Smart Scoring', sub: '6 dimensions' },
          { icon: <Heart className="w-5 h-5" />, label: 'Personalized', sub: 'Your priorities' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-clt-teal">
              {item.icon}
            </div>
            <div className="text-xs font-semibold text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────
function ResultCard({ result, rank }: { result: NeighborhoodScore; rank: number }) {
  const n = result.neighborhood;
  const matchInfo = getMatchLabel(result.percentage);
  const isTop = rank === 1;

  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
      isTop
        ? 'border-clt-teal shadow-lg shadow-clt-teal/10 bg-card'
        : 'border-border bg-card hover:border-clt-teal/30'
    }`}>
      {isTop && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-clt-teal to-clt-gold" />
      )}

      <div className="flex flex-col md:flex-row">
        {/* Photo */}
        <div className="relative md:w-48 h-40 md:h-auto shrink-0">
          <img
            src={n.photoUrls[0]}
            alt={n.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              isTop
                ? 'bg-clt-teal/90 text-white'
                : 'bg-black/60 text-white'
            }`}>
              #{rank}
            </span>
          </div>
          {n.metroType && n.metroType !== 'core' && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm capitalize">
                {n.metroType.replace('-', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">{n.name}</h3>
              <p className="text-xs text-muted-foreground">{n.vibe}</p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-bold ${matchInfo.color}`}>{result.percentage}%</div>
              <div className={`text-xs font-semibold ${matchInfo.color}`}>{matchInfo.label}</div>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-clt-teal to-clt-gold transition-all duration-700 ease-out"
              style={{ width: `${result.percentage}%` }}
            />
          </div>

          {/* Match reasons */}
          {result.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {result.matchReasons.map((reason, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-clt-teal/10 text-clt-teal border border-clt-teal/20">
                  <Star className="w-3 h-3" /> {reason}
                </span>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {result.warnings.map((warning, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  <AlertTriangle className="w-3 h-3" /> {warning}
                </span>
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {n.stats.avgRent}/mo</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Walk {n.stats.walkScore}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {n.stats.commuteToUptown}</span>
          </div>

          {/* CTA */}
          <Link href={`/neighborhood/${n.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              View Full Guide <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────
function ResultsScreen({ results, onRetake }: { results: NeighborhoodScore[]; onRetake: () => void }) {
  const top3 = results.slice(0, 3);
  const honorable = results.slice(3, 6);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-clt-teal to-clt-gold mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
          Your Top Matches
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Based on your answers, here are the Charlotte neighborhoods that fit you best.
        </p>
        <div className="mt-4 flex justify-center">
          <ShareButtons title={`My top Charlotte neighborhood match: ${top3[0]?.neighborhood.name || 'Charlotte'}`} description="Take the quiz and find your perfect Charlotte neighborhood!" />
        </div>
      </div>

      {/* Top 3 cards */}
      <div className="space-y-4 max-w-2xl mx-auto mb-10">
        {top3.map((result, i) => (
          <ResultCard key={result.neighborhood.id} result={result} rank={i + 1} />
        ))}
      </div>

      {/* Honorable mentions */}
      {honorable.length > 0 && (
        <div className="max-w-2xl mx-auto mb-10">
          <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-clt-teal" /> Also Worth Exploring
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {honorable.map((result, i) => {
              const n = result.neighborhood;
              const matchInfo = getMatchLabel(result.percentage);
              return (
                <Link key={n.id} href={`/neighborhood/${n.id}`}>
                  <div className="group rounded-xl border border-border bg-card p-4 hover:border-clt-teal/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 4}</span>
                      <span className={`text-sm font-bold ${matchInfo.color}`}>{result.percentage}%</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-clt-teal transition-colors">{n.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.vibe}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
        <Button variant="outline" onClick={onRetake} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Retake Quiz
        </Button>
        <Link href="/compare">
          <Button variant="outline" className="gap-2">
            <GitCompare className="w-4 h-4" /> Compare Neighborhoods
          </Button>
        </Link>
        <Link href="/neighborhoods">
          <Button variant="outline" className="gap-2">
            <HomeIcon className="w-4 h-4" /> Browse All 20
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Quiz Page ───────────────────────────────────────────────
export default function Quiz() {
  useSEO({
    title: "Neighborhood Quiz — Which Charlotte Area Fits You?",
    description: "Take our 2-minute quiz to find your perfect Charlotte neighborhood. Answer questions about budget, lifestyle, and priorities to get personalized recommendations.",
    keywords: "Charlotte neighborhood quiz, which Charlotte neighborhood, best neighborhood Charlotte NC, Charlotte relocation quiz, where to live Charlotte",
    path: "/quiz",
  });

  const [phase, setPhase] = useState<'intro' | 'questions' | 'results'>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [results, setResults] = useState<NeighborhoodScore[]>([]);

  const handleAnswer = useCallback((qId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      // Calculate results
      const scored = scoreNeighborhoods(answers);
      setResults(scored);
      setPhase('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, answers]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleRetake = useCallback(() => {
    setPhase('intro');
    setStep(0);
    setAnswers({});
    setResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentQuestion = QUIZ_QUESTIONS[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <span className="font-display font-bold text-lg text-foreground">
              Settle<span className="text-clt-teal">CLT</span>
            </span>
          </Link>
          <Link href="/neighborhoods">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <MapPin className="w-3.5 h-3.5" /> Browse All
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container py-12 md:py-16 px-4">
        {phase === 'intro' && (
          <IntroScreen onStart={() => setPhase('questions')} />
        )}

        {phase === 'questions' && currentQuestion && (
          <>
            <ProgressBar current={step} total={QUIZ_QUESTIONS.length} />
            <QuestionStep
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onBack={handleBack}
              isFirst={step === 0}
              isLast={step === QUIZ_QUESTIONS.length - 1}
            />
          </>
        )}

        {phase === 'results' && (
          <ResultsScreen results={results} onRetake={handleRetake} />
        )}
      </main>
    </div>
  );
}
