import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessDetail = readFileSync(
  new URL("../client/src/pages/BusinessDetail.tsx", import.meta.url),
  "utf8",
);
const myBusiness = readFileSync(
  new URL("../client/src/pages/MyBusiness.tsx", import.meta.url),
  "utf8",
);
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("paid business portal UI contract", () => {
  it("renders owner-managed public profile data and premium lead capture", () => {
    expect(routerSource).toContain("getPublicProfile: publicProcedure");
    expect(businessDetail).toContain("businessPortal.getPublicProfile.useQuery");
    expect(businessDetail).toContain("publicProfile?.photoUrls");
    expect(businessDetail).toContain("combinedPhotos");
    expect(businessDetail).toContain("premium.trackLead.useMutation");
    expect(businessDetail).toContain('premiumData?.tier === "premium"');
    expect(businessDetail).toContain("leadFormState.scopeKey !== slug");
    expect(businessDetail).toContain("setLeadFormState({ scopeKey: slug");
    expect(businessDetail).toContain('t("businessDetail.inquiry")');
    expect(businessDetail).toContain("leadForm");
  });

  it("gives owners tier-aware photo, lead, and report controls", () => {
    expect(myBusiness).toContain("premium.getPhotoLimit.useQuery");
    expect(myBusiness).toContain("businessPortal.uploadPhoto.useMutation");
    expect(myBusiness).toContain("businessPortal.removePhoto.useMutation");
    expect(myBusiness).toContain("premium.getLeads.useQuery");
    expect(myBusiness).toContain("premium.updateLeadStatus.useMutation");
    expect(myBusiness).toContain("premium.getReport.useQuery");
    expect(myBusiness).toContain("photoUrlState.scopeKey !== selectedMembership.serviceKey");
    expect(myBusiness).toContain("setPhotoUrlState({ scopeKey: selectedMembership?.serviceKey");
    expect(myBusiness).toContain("uploadPhotoFile");
    expect(myBusiness).toContain("PhotoUploader");
    expect(myBusiness).toContain("AnalyticsChart");
    expect(myBusiness).toContain("Download Monthly Report");
    expect(myBusiness).toContain("Photo Gallery");
    expect(myBusiness).toContain("Lead Inbox");
  });
});
