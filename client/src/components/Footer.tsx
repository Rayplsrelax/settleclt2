import { Link } from "wouter";
import SocialFollowLinks from "@/components/SocialFollowLinks";
import { useI18n } from "@/i18n/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="font-display font-extrabold text-lg text-foreground">
              Settle<span className="text-primary">CLT</span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-foreground">
                {t("footer.follow")}
              </p>
              <SocialFollowLinks surface="footer" />
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">
              {t("footer.explore")}
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/neighborhoods"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.neighborhoods")}
              </Link>
              <Link
                href="/directory"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.servicesDirectory")}
              </Link>
              <Link
                href="/events"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.events")}
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.blogGuides")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">
              {t("footer.community")}
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/passport"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.cltPassport")}
              </Link>
              <Link
                href="/bingo"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.cltBingoCards")}
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.leaderboard")}
              </Link>
              <Link
                href="/list-your-business"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.listYourBusiness")}
              </Link>
              <Link
                href="/business-pricing"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.businessPricing")}
              </Link>
              <Link
                href="/referrals"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.requestReferral")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">
              {t("footer.getStarted")}
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/quiz"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.neighborhoodQuiz")}
              </Link>
              <Link
                href="/neighborhoods"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.findYourNeighborhood")}
              </Link>
              <Link
                href="/find-your-home"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.findYourHome")}
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.movingGuides")}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                {t("footer.contactUs")}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline"
            >
              {t("footer.privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline"
            >
              {t("footer.termsOfService")}
            </Link>
            <Link
              href="/contact"
              className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline"
            >
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
