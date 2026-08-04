type LeadInput = {
  serviceKey: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  userId: number | null;
};

type LeadOwner = { userId: number } | null | undefined;

type LeadDependencies = {
  createLead: (input: LeadInput) => Promise<number | undefined>;
  getOwner: (serviceKey: string) => Promise<LeadOwner>;
  notify: (input: {
    userId: number;
    category: "system";
    title: string;
    body: string;
    actionUrl: string;
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
        title: "New lead from your Premium listing",
        body: `${input.name} (${input.email}) sent an inquiry: ${input.message.substring(0, 200)}`,
        actionUrl: "/my-business?tab=analytics",
      });
    }
  } catch (error) {
    console.error("[PremiumLead] Lead persisted but owner notification failed", { leadId, error });
  }
  return leadId;
}
