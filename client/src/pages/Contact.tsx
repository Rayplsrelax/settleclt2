import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, MessageSquare, Send, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/i18n/I18nContext";

export default function Contact() {
  const { t } = useI18n();
  useSEO({
    title: t("contact.title"),
    description: t("contact.subtitle"),
    keywords:
      "contact Settle CLT, Charlotte guide contact, Settle CLT feedback, Charlotte business listing inquiry",
    path: "/contact",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("contact.toastSuccess"));
    },
    onError: () => {
      toast.error(t("contact.toastError"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t("contact.requiredError"));
      return;
    }
    contactMutation.mutate({
      name,
      email,
      subject,
      message,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="container max-w-4xl text-center">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-3">
              {t("contact.title")}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </div>
        </section>

        <section className="container max-w-5xl py-12">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {t("contact.emailLabel")}
                      </p>
                      <a
                        href="mailto:hello@settleclt.com"
                        className="text-sm text-primary hover:underline"
                      >
                        hello@settleclt.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {t("contact.location")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("contact.locationValue")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {t("contact.responseTime")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("contact.responseTimeValue")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    {t("contact.commonTopics")}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>{t("contact.topicListing")}</li>
                    <li>{t("contact.topicEvents")}</li>
                    <li>{t("contact.topicPartnerships")}</li>
                    <li>{t("contact.topicCorrections")}</li>
                    <li>{t("contact.topicFeedback")}</li>
                    <li>{t("contact.topicAccount")}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-3">
              {submitted ? (
                <Card className="border-primary/30">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="font-display font-bold text-xl text-foreground mb-2">
                      {t("contact.sentTitle")}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {t("contact.sentDescription")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setName("");
                        setEmail("");
                        setSubject("");
                        setMessage("");
                      }}
                    >
                      {t("contact.sendAnother")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                      {t("contact.formTitle")}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="contact-name"
                            className="text-sm font-medium text-foreground mb-1.5 block"
                          >
                            {t("contact.name")} *
                          </label>
                          <Input
                            id="contact-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t("contact.namePlaceholder")}
                            maxLength={120}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contact-email"
                            className="text-sm font-medium text-foreground mb-1.5 block"
                          >
                            {t("contact.email")} *
                          </label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            maxLength={254}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="text-sm font-medium text-foreground mb-1.5 block"
                        >
                          {t("contact.subject")}
                        </label>
                        <Input
                          id="contact-subject"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder={t("contact.subjectPlaceholder")}
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-message"
                          className="text-sm font-medium text-foreground mb-1.5 block"
                        >
                          {t("contact.message")} *
                        </label>
                        <Textarea
                          id="contact-message"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder={t("contact.messagePlaceholder")}
                          rows={6}
                          maxLength={4000}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={contactMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                        {contactMutation.isPending
                          ? t("contact.sending")
                          : t("contact.send")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
