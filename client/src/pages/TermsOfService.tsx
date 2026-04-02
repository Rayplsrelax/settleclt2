import PageLayout from "@/components/PageLayout";
import { useSEO } from "@/hooks/useSEO";
import { FileText } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  useSEO({
    title: "Terms of Service — Settle CLT",
    description: "Read the Terms of Service for using the Settle CLT platform, including user responsibilities, referral disclosures, and content policies.",
    path: "/terms",
  });

  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: April 1, 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <div className="prose prose-neutral max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Settle CLT ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. Settle CLT reserves the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Settle CLT is a community platform designed to help people discover, explore, and settle into Charlotte, North Carolina. The Platform provides neighborhood guides, a local business directory, event listings, gamification features (CLT Passport, Bingo), a neighborhood quiz, blog content, and housing referral services. The Platform is provided "as is" and may be updated, modified, or discontinued at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Some features require creating an account. By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activity under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">4. User Content</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may submit content to the Platform, including reviews, event submissions, and business listings. By submitting content, you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Grant Settle CLT a non-exclusive, royalty-free license to display, distribute, and use your content on the Platform</li>
              <li>Represent that your content is original, accurate, and does not infringe on any third-party rights</li>
              <li>Agree not to submit content that is defamatory, obscene, harassing, or otherwise objectionable</li>
              <li>Acknowledge that Settle CLT may moderate, edit, or remove content at its discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Housing Referral Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Settle CLT offers a housing referral service ("Find Your Home") that connects users with licensed real estate professionals and apartment locators. By using this service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You understand that Settle CLT is operated by a licensed North Carolina real estate broker</li>
              <li>You acknowledge that Settle CLT may receive referral fees from professionals you are matched with</li>
              <li>You understand that referral fees do not increase your cost as a buyer or renter</li>
              <li>You are under no obligation to work with any referred professional</li>
              <li>Settle CLT does not guarantee the quality of service provided by referred professionals</li>
              <li>All real estate transactions are subject to applicable North Carolina laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Business Listings</h2>
            <p className="text-muted-foreground leading-relaxed">
              Business information in the directory is provided for informational purposes only. While we strive for accuracy, Settle CLT does not guarantee that business hours, addresses, contact information, or other details are current or correct. Business owners may request corrections or removal of their listing by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">7. Event Listings</h2>
            <p className="text-muted-foreground leading-relaxed">
              Event information is sourced from public sources and community submissions. Settle CLT does not organize or host the listed events (unless explicitly stated) and is not responsible for event cancellations, changes, or the accuracy of event details. Always verify event information with the official organizer before attending.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Settle CLT name, logo, design, and original content are the property of Settle CLT. You may not reproduce, distribute, or create derivative works from the Platform's content without written permission. Third-party trademarks and content belong to their respective owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Settle CLT is provided "as is" without warranties of any kind, express or implied. To the fullest extent permitted by law, Settle CLT shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to reliance on business listings, event information, neighborhood data, or housing referrals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">10. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Scrape, crawl, or harvest data from the Platform without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Submit false reviews or misleading business information</li>
              <li>Attempt to gain unauthorized access to the Platform or its systems</li>
              <li>Interfere with or disrupt the Platform's operation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of the State of North Carolina, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Mecklenburg County, North Carolina.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us through the Settle CLT platform. For our data practices, please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

        </div>
      </div>
    </PageLayout>
  );
}
