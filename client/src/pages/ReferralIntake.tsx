import { useState } from "react";
import { Link } from "wouter";
import { Users, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n/I18nContext";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";

export default function ReferralIntake() {
  const { locale, t } = useI18n();
  useSEO({
    title: t("referral.seoTitle"),
    description: t("referral.seoDescription"),
    path: "/referrals",
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    need: "",
  });
  const [matches, setMatches] = useState<
    Array<{
      serviceKey: string;
      name: string;
      category: string;
      area: string;
      reason: string;
    }>
  >([]);
  const submit = trpc.premium.submitBizReferral.useMutation({
    onSuccess: result => {
      setMatches(result.matches);
      setForm({ name: "", email: "", phone: "", category: "", need: "" });
      toast.success(t("referral.success"));
    },
    onError: () => toast.error(t("referral.error")),
  });

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-8 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-3xl font-bold">
          {t("referral.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("referral.subtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("referral.request")}</CardTitle>
          <CardDescription>
            {t("referral.privacy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              submit.mutate({ ...form, source: "referral_intake", locale });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ref-name">{t("referral.name")}</Label>
                <Input
                  id="ref-name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ref-email">{t("referral.email")}</Label>
                <Input
                  id="ref-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ref-phone">{t("referral.phone")}</Label>
                <Input
                  id="ref-phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ref-category">
                  {t("referral.category")}
                </Label>
                <Input
                  id="ref-category"
                  placeholder={t("referral.categoryPlaceholder")}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref-need">{t("referral.need")}</Label>
              <Textarea
                id="ref-need"
                rows={4}
                maxLength={500}
                placeholder={t("referral.needPlaceholder")}
                value={form.need}
                onChange={e => setForm({ ...form, need: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? t("referral.submitting") : t("referral.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {matches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("referral.recommendations")}</CardTitle>
            <CardDescription>
              {t("referral.recommendationsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.map(match => (
              <div
                key={match.serviceKey}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div>
                  <Link
                    href={`/directory/${match.serviceKey}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {match.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {match.category} · {match.area}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {match.reason}
                  </p>
                </div>
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
