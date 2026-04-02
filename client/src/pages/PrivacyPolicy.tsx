import PageLayout from "@/components/PageLayout";
import { useSEO } from "@/hooks/useSEO";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy — Settle CLT",
    description: "Learn how Settle CLT collects, uses, and protects your personal information. Read our full privacy policy.",
    path: "/privacy",
  });

  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: April 1, 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <div className="prose prose-neutral max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you use Settle CLT, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Account Information:</strong> When you create an account, we collect your name and email address through our authentication provider.</li>
              <li><strong className="text-foreground">Profile Data:</strong> Information you voluntarily provide, such as neighborhood preferences, quiz responses, and passport stamps.</li>
              <li><strong className="text-foreground">Referral Form Data:</strong> If you submit a housing referral request, we collect your name, email, phone number, housing preferences, budget range, and timeline.</li>
              <li><strong className="text-foreground">Usage Data:</strong> We collect anonymous analytics data including page views, search queries, and feature usage to improve the platform.</li>
              <li><strong className="text-foreground">Reviews:</strong> Content you submit as neighborhood or business reviews, including star ratings and text.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and personalize the Settle CLT platform experience</li>
              <li>Connect you with real estate professionals and apartment locators when you submit a referral request</li>
              <li>Send you newsletter updates about Charlotte (if you opted in)</li>
              <li>Track your CLT Passport stamps, bingo progress, and leaderboard ranking</li>
              <li>Improve our services through anonymous usage analytics</li>
              <li>Display your reviews to help other users make informed decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Referral Partners:</strong> When you submit a housing referral request, your contact information and preferences are shared with licensed real estate professionals or apartment locators to fulfill your request.</li>
              <li><strong className="text-foreground">Service Providers:</strong> We use third-party services for authentication, analytics (Mixpanel), and hosting that may process your data on our behalf.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">4. Real Estate Referral Disclosures</h2>
            <p className="text-muted-foreground leading-relaxed">
              Settle CLT is operated by a licensed North Carolina real estate broker. When you submit a housing referral request, you may be connected with a licensed real estate agent or apartment locator. Settle CLT may receive a referral fee from the agent or locator you are matched with. This referral fee does not increase your cost. All referral arrangements comply with the North Carolina Real Estate Commission regulations. You are under no obligation to work with any referred professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We also use Mixpanel for anonymous usage analytics. You can disable cookies in your browser settings, though this may affect some features of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable security measures to protect your personal information, including encrypted connections (HTTPS), secure authentication, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of newsletter communications at any time through your profile settings</li>
              <li>Withdraw consent for data processing where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Settle CLT is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify users of material changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your personal data, please contact us through the Settle CLT platform or at the email address provided in your account settings.
            </p>
          </section>

        </div>
      </div>
    </PageLayout>
  );
}
