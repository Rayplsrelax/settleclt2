type LeadInput = {
  serviceKey: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  userId: number | null;
  source?: string;
};

type LeadOwner = { userId: number } | null | undefined;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

type LeadDependencies = {
  createLead: (input: LeadInput) => Promise<number | undefined>;
  getOwner: (serviceKey: string) => Promise<LeadOwner>;
  notify: (input: {
    userId: number;
    category: "system";
    title: string;
    body: string;
    actionUrl: string;
    metadata?: Record<string, unknown>;
    emailTemplate?: { subject: string; html: string };
  }) => Promise<unknown>;
};

export async function createPremiumLeadWithNotification(
  input: LeadInput,
  dependencies: LeadDependencies,
): Promise<number> {
  const leadId = await dependencies.createLead(input);
  if (leadId === undefined) {
    throw new Error("Failed to persist Premium lead");
  }
  try {
    const owner = await dependencies.getOwner(input.serviceKey);
    if (owner) {
      await dependencies.notify({
        userId: owner.userId,
        category: "system",
        title: "New business inquiry",
        body: `${input.name} (${input.email}) sent a ${input.source || "listing"} inquiry: ${input.message.substring(0, 200)}`,
        actionUrl: "/my-business?tab=analytics&leadId=" + leadId,
        metadata: { serviceKey: input.serviceKey, leadId, source: input.source || "listing_inquiry" },
        emailTemplate: {
          subject: `New inquiry from ${input.name}`,
          html: `<h2>New business inquiry</h2><p><strong>${escapeHtml(input.name)}</strong> sent an inquiry through your Settle CLT listing.</p><p>${escapeHtml(input.message.substring(0, 500))}</p><p><a href="https://settleclt.com/my-business?tab=analytics&leadId=${leadId}">View and follow up</a></p>`,
        },
      });
    }
  } catch (error) {
    console.error("[PremiumLead] Lead persisted but owner notification failed", { leadId, error });
  }
  return leadId;
}
