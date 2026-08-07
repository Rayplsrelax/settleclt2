import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MessageSquare, X, Send, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BusinessChatWidgetProps {
  serviceKey: string;
  businessName: string;
  businessPhone?: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  bookingIntent?: boolean;
}

const QUICK_SUGGESTIONS = [
  "What are your hours?",
  "Do you offer free estimates?",
  "How can I contact you?",
];

export function BusinessChatWidget({ serviceKey, businessName, businessPhone }: BusinessChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm the AI assistant for ${businessName}. Ask me anything about our services, hours, or how to get in touch!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingContact, setBookingContact] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: status } = trpc.businessAssistant.getStatus.useQuery(
    { serviceKey },
    { enabled: false },
  );

  const askMutation = trpc.businessAssistant.ask.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, bookingIntent: data.bookingIntent }]);
      if (data.bookingIntent) setShowBookingForm(true);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I'm having trouble right now. Please call ${businessPhone || "us"} directly!`,
      }]);
    },
  });

  const trackLead = trpc.premium.trackLead.useMutation({
    onSuccess: () => {
      toast.success("Your request has been sent! The business will be in touch.");
      setShowBookingForm(false);
      setBookingName("");
      setBookingContact("");
      setBookingDate("");
      setBookingMessage("");
    },
    onError: () => toast.error("Failed to send request. Please try calling instead."),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: question }]);
    askMutation.mutate({
      serviceKey,
      question,
      history: messages.map(m => ({ role: m.role, content: m.content })),
    });
    setIsLoading(false);
  }, [input, isLoading, askMutation, serviceKey, messages]);

  const handleQuickSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const event = { key: "Enter", preventDefault: () => {} } as any;
      // Trigger send
      setMessages(prev => [...prev, { role: "user", content: suggestion }]);
      askMutation.mutate({
        serviceKey,
        question: suggestion,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });
      setInput("");
    }, 100);
  }, [askMutation, serviceKey, messages]);

  const handleBookingSubmit = useCallback(() => {
    if (!bookingName || !bookingContact) {
      toast.error("Please provide your name and contact info.");
      return;
    }
    trackLead.mutate({
      serviceKey,
      name: bookingName,
      email: bookingContact.includes("@") ? bookingContact : "not-provided@example.com",
      phone: bookingContact.includes("@") ? undefined : bookingContact,
      message: `Booking request for ${bookingDate}: ${bookingMessage || "No additional details."}`,
    });
  }, [trackLead, serviceKey, bookingName, bookingContact, bookingDate, bookingMessage]);

  if (!status?.enabled) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          aria-label="Open AI assistant"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-background shadow-2xl flex flex-col" style={{ maxHeight: "70vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-sm font-semibold">{businessName} AI</p>
                <p className="text-xs text-white/80">Available 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: "200px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleQuickSuggestion(s)}
                    className="text-xs border rounded-full px-3 py-1.5 hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Booking form */}
            {showBookingForm && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Schedule a request
                </div>
                <Input placeholder="Your name" value={bookingName} onChange={e => setBookingName(e.target.value)} />
                <Input placeholder="Email or phone" value={bookingContact} onChange={e => setBookingContact(e.target.value)} />
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                <Textarea placeholder="What do you need?" rows={2} value={bookingMessage} onChange={e => setBookingMessage(e.target.value)} />
                <Button size="sm" className="w-full" onClick={handleBookingSubmit} disabled={trackLead.isPending}>
                  {trackLead.isPending ? "Sending..." : "Send Request"}
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your question..."
              disabled={askMutation.isPending}
            />
            <Button size="icon" onClick={handleSend} disabled={askMutation.isPending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
