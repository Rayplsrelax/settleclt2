import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const leadServiceSource = readFileSync(new URL("./premium-lead-service.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("premium lead owner notification routing", () => {
  it("resolves active business owners from the canonical service key", () => {
    expect(dbSource).toContain("getActiveOwnerMembership");
    expect(dbSource).toContain('eq(businessMemberships.serviceKey, serviceKey)');
    expect(dbSource).toContain('eq(businessMemberships.role, "owner")');
    expect(dbSource).toContain('eq(businessMemberships.status, "active")');
  });

  it("notifies the active owner instead of looking up the lead submitter membership", () => {
    expect(routerSource).toContain("getOwner: getActiveOwnerMembership");
    expect(routerSource).toContain("notify: notifyUser");
    expect(leadServiceSource).toContain("dependencies.getOwner(input.serviceKey)");
    expect(leadServiceSource).toContain("dependencies.notify({");
    expect(leadServiceSource).toContain('category: "system"');
    expect(routerSource).not.toContain("getBusinessMembershipsForUser(ctx.user?.id ?? 0, input.serviceKey)");
  });
});
