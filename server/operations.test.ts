import { describe, it, expect } from "vitest";
import { hashPayload } from "./operations";

describe("Operations System", () => {
  describe("hashPayload", () => {
    it("produces a deterministic SHA-256 hash for a given payload", () => {
      const payload = { name: "Test Business", category: "movers", area: "Charlotte" };
      const hash1 = hashPayload(payload);
      const hash2 = hashPayload(payload);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]+$/);
    });

    it("produces different hashes for different payloads", () => {
      const payload1 = { name: "Business A", action: "publish" };
      const payload2 = { name: "Business B", action: "publish" };
      expect(hashPayload(payload1)).not.toBe(hashPayload(payload2));
    });

    it("produces different hashes when the same keys have different values", () => {
      const payload1 = { action: "publish", target: "business-a" };
      const payload2 = { action: "remove", target: "business-a" };
      expect(hashPayload(payload1)).not.toBe(hashPayload(payload2));
    });

    it("handles null and undefined payloads without throwing", () => {
      expect(() => hashPayload(null)).not.toThrow();
      expect(() => hashPayload(undefined)).not.toThrow();
      // null and undefined both serialize to "null" in JSON — same hash is expected
      expect(hashPayload(null)).toBe(hashPayload(undefined));
    });

    it("handles empty objects", () => {
      const hash = hashPayload({});
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe("Operations router shape", () => {
    it("exports operationsRouter with expected procedures", async () => {
      const { operationsRouter } = await import("./operationsRouter");
      const procedures = Object.keys(operationsRouter._def.procedures);
      expect(procedures).toContain("summary");
      expect(procedures).toContain("listTasks");
      expect(procedures).toContain("getTask");
      expect(procedures).toContain("pendingApprovals");
      expect(procedures).toContain("createTask");
      expect(procedures).toContain("updateTaskStatus");
      expect(procedures).toContain("requestApproval");
      expect(procedures).toContain("decideApproval");
      expect(procedures).toContain("executeApproved");
      expect(procedures).toContain("listAuditEvents");
    });
  });

  describe("App router integration", () => {
    it("appRouter includes operations router", async () => {
      const { appRouter } = await import("./routers");
      // tRPC flattens nested routers with dot notation
      expect(appRouter._def.procedures).toHaveProperty("operations.summary");
      expect(appRouter._def.procedures).toHaveProperty("operations.listTasks");
      expect(appRouter._def.procedures).toHaveProperty("operations.pendingApprovals");
      expect(appRouter._def.procedures).toHaveProperty("operations.createTask");
      expect(appRouter._def.procedures).toHaveProperty("operations.requestApproval");
      expect(appRouter._def.procedures).toHaveProperty("operations.decideApproval");
      expect(appRouter._def.procedures).toHaveProperty("operations.executeApproved");
      expect(appRouter._def.procedures).toHaveProperty("operations.listAuditEvents");
    });
  });

  describe("Schema exports", () => {
    it("agent_tasks, approval_records, audit_events tables are exported from schema", async () => {
      const schema = await import("../drizzle/schema");
      // Runtime exports (table definitions)
      expect(schema.agentTasks).toBeDefined();
      expect(schema.approvalRecords).toBeDefined();
      expect(schema.auditEvents).toBeDefined();
      // Type exports are compile-time only; verify table objects have expected shape
      expect(schema.agentTasks.agentRole).toBeDefined();
      expect(schema.agentTasks.riskLevel).toBeDefined();
      expect(schema.approvalRecords.payloadHash).toBeDefined();
      expect(schema.auditEvents.outcome).toBeDefined();
    });
  });

  describe("Migration exists", () => {
    it("0019_operations_system.sql migration file exists", async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const migrationPath = path.join(process.cwd(), "drizzle", "0019_operations_system.sql");
      const content = await fs.readFile(migrationPath, "utf-8");
      expect(content).toContain("CREATE TABLE `agent_tasks`");
      expect(content).toContain("CREATE TABLE `approval_records`");
      expect(content).toContain("CREATE TABLE `audit_events`");
      expect(content).toContain("agentRole");
      expect(content).toContain("riskLevel");
      expect(content).toContain("payloadHash");
    });
  });
});
