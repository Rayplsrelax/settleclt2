import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, CheckCircle2, Clock, Shield } from "lucide-react";

interface ClaimBusinessDialogProps {
  serviceKey: string;
  businessName: string;
  children?: React.ReactNode;
}

export default function ClaimBusinessDialog({ serviceKey, businessName, children }: ClaimBusinessDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    claimantName: "",
    claimantEmail: "",
    claimantPhone: "",
    claimantRole: "",
    verificationMethod: "" as "" | "owner" | "manager" | "employee" | "authorized_rep",
    message: "",
  });

  const claimStatus = trpc.claims.checkClaimed.useQuery(
    { serviceKey },
    { enabled: open }
  );

  const submitClaim = trpc.claims.submit.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSubmitted(true);
        toast.success("Claim submitted! We'll review it within 2-3 business days.");
      } else {
        toast.error(data.error || "Failed to submit claim");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit claim");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.verificationMethod) {
      toast.error("Please select your role at this business");
      return;
    }
    submitClaim.mutate({
      serviceKey,
      businessName,
      claimantName: form.claimantName,
      claimantEmail: form.claimantEmail,
      claimantPhone: form.claimantPhone || undefined,
      claimantRole: form.claimantRole || form.verificationMethod,
      verificationMethod: form.verificationMethod,
      message: form.message || undefined,
    });
  };

  const alreadyClaimed = claimStatus.data?.claimed;
  const pendingClaim = claimStatus.data?.pending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(false); }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" />
            Claim This Business
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">Claim Submitted!</DialogTitle>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              We've received your claim for <span className="font-semibold text-foreground">{businessName}</span>.
              Our team will review it within 2-3 business days and reach out to verify your ownership.
            </p>
            <Button onClick={() => setOpen(false)} className="mt-4">Done</Button>
          </div>
        ) : alreadyClaimed ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Already Claimed</DialogTitle>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              <span className="font-semibold text-foreground">{businessName}</span> has already been claimed
              by its owner. If you believe this is an error, please contact us at{" "}
              <a href="mailto:hello@settleclt.com" className="text-primary hover:underline">hello@settleclt.com</a>.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)} className="mt-4">Close</Button>
          </div>
        ) : pendingClaim ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Claim Pending</DialogTitle>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              A claim for <span className="font-semibold text-foreground">{businessName}</span> is already
              under review. We'll process it within 2-3 business days.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Claim {businessName}
              </DialogTitle>
              <DialogDescription>
                Are you the owner or manager of this business? Claiming your listing lets you update
                your information, respond to reviews, and access premium features.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimantName">Your Full Name *</Label>
                  <Input
                    id="claimantName"
                    required
                    placeholder="Jane Smith"
                    value={form.claimantName}
                    onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantEmail">Email Address *</Label>
                  <Input
                    id="claimantEmail"
                    type="email"
                    required
                    placeholder="jane@business.com"
                    value={form.claimantEmail}
                    onChange={(e) => setForm({ ...form, claimantEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimantPhone">Phone Number</Label>
                  <Input
                    id="claimantPhone"
                    type="tel"
                    placeholder="(704) 555-0123"
                    value={form.claimantPhone}
                    onChange={(e) => setForm({ ...form, claimantPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationMethod">Your Role *</Label>
                  <Select
                    value={form.verificationMethod}
                    onValueChange={(v) => setForm({ ...form, verificationMethod: v as any, claimantRole: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="authorized_rep">Authorized Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Details</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us how you're connected to this business, or any details that help us verify your claim..."
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">What happens next?</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>We'll verify your identity and connection to the business</li>
                  <li>You'll receive an email confirmation within 2-3 business days</li>
                  <li>Once approved, you can update your listing details and respond to reviews</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitClaim.isPending}>
                  {submitClaim.isPending ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
