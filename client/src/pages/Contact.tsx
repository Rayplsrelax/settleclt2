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

export default function Contact() {
  useSEO({
    title: "Contact Us — Settle CLT",
    description: "Get in touch with the Settle CLT team. Questions about Charlotte, business listings, partnerships, or feedback — we'd love to hear from you.",
    keywords: "contact Settle CLT, Charlotte guide contact, Settle CLT feedback, Charlotte business listing inquiry",
    path: "/contact",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const notifyMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try emailing us directly.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    notifyMutation.mutate({
      title: `Contact Form: ${subject || "General Inquiry"}`,
      content: `From: ${name} (${email})\nSubject: ${subject || "General Inquiry"}\n\n${message}`,
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
              Get in Touch
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Have a question about Charlotte, want to list your business, or just want to say hi? We'd love to hear from you.
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
                      <p className="font-medium text-sm text-foreground">Email</p>
                      <a href="mailto:hello@settleclt.com" className="text-sm text-primary hover:underline">
                        hello@settleclt.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Location</p>
                      <p className="text-sm text-muted-foreground">Charlotte, North Carolina</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Response Time</p>
                      <p className="text-sm text-muted-foreground">We typically respond within 24-48 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-foreground mb-2">Common Topics</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Listing or claiming your business</li>
                    <li>Submitting events to the calendar</li>
                    <li>Partnership and advertising inquiries</li>
                    <li>Reporting incorrect information</li>
                    <li>General feedback and suggestions</li>
                    <li>Account and data deletion requests</li>
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
                    <h2 className="font-display font-bold text-xl text-foreground mb-2">Message Sent!</h2>
                    <p className="text-muted-foreground mb-4">
                      Thanks for reaching out. We'll get back to you within 24-48 hours.
                    </p>
                    <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}>
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h2 className="font-display font-semibold text-lg text-foreground mb-4">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="What's this about?"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Tell us what's on your mind..."
                          rows={6}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={notifyMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                        {notifyMutation.isPending ? "Sending..." : "Send Message"}
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
