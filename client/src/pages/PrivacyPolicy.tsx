import PageLayout from "@/components/PageLayout";
import {
  LEGAL_EFFECTIVE_DATE,
  legalContent,
  type LegalPageContent,
} from "@/content/legal";
import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/i18n/I18nContext";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const { locale } = useI18n();
  const content: LegalPageContent = legalContent[locale].privacy;

  useSEO({
    title: content.seo.title,
    description: content.seo.description,
    path: "/privacy",
    noSuffix: true,
  });

  return (
    <PageLayout>
      <header className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {content.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                <time dateTime={LEGAL_EFFECTIVE_DATE}>{content.updatedLabel}</time>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-12">
        <div className="prose prose-neutral max-w-none space-y-8">
          {content.sections.map(section => {
            const headingId = `privacy-${section.id}`;
            return (
              <section key={section.id} aria-labelledby={headingId}>
                <h2 id={headingId} className="mb-3 text-xl font-display font-bold text-foreground">
                  {section.heading}
                </h2>
                {section.blocks.map((block, blockIndex) =>
                  block.type === "paragraph" ? (
                    <p
                      key={`${section.id}-paragraph-${blockIndex}`}
                      className="mb-3 leading-relaxed text-muted-foreground last:mb-0"
                    >
                      {block.text}
                    </p>
                  ) : (
                    <ul
                      key={`${section.id}-list-${blockIndex}`}
                      className="list-disc space-y-2 pl-6 text-muted-foreground"
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={`${section.id}-item-${itemIndex}`}>
                          {item.label && (
                            <strong className="text-foreground">{item.label}</strong>
                          )}{" "}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </section>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
