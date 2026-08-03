import { eq, and, desc, asc, sql, inArray, gte, lte, isNull } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb } from "./db";
import {
  agentTasks,
  approvalRecords,
  auditEvents,
  type InsertAgentTask,
  type InsertApprovalRecord,
  type InsertAuditEvent,
  type AgentTask,
  type ApprovalRecord,
  type AuditEvent,
} from "../drizzle/schema";

// ─── Agent Tasks ───

export async function createAgentTask(task: InsertAgentTask): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(agentTasks).values(task);
  return result.insertId;
}

export async function getAgentTasks(opts: {
  status?: string;
  agentRole?: string;
  targetType?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<AgentTask[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.status) conditions.push(eq(agentTasks.status, opts.status as any));
  if (opts.agentRole) conditions.push(eq(agentTasks.agentRole, opts.agentRole as any));
  if (opts.targetType) conditions.push(eq(agentTasks.targetType, opts.targetType as any));
  if (opts.priority) conditions.push(eq(agentTasks.priority, opts.priority as any));
  const query = db.select().from(agentTasks);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(agentTasks.priority), desc(agentTasks.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

export async function getAgentTaskById(id: number): Promise<AgentTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, id));
  return task;
}

export async function updateAgentTaskStatus(
  id: number,
  status: string,
  resolutionNotes?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status };
  if (resolutionNotes) update.resolutionNotes = resolutionNotes;
  if (["approved", "rejected", "executed", "failed", "archived"].includes(status)) {
    update.resolvedAt = new Date();
  }
  await db.update(agentTasks).set(update).where(eq(agentTasks.id, id));
}

export async function getPendingApprovalTasks(): Promise<AgentTask[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(agentTasks)
    .where(eq(agentTasks.status, "pending_approval"))
    .orderBy(desc(agentTasks.priority), desc(agentTasks.createdAt));
}

// ─── Approval Records ───

export function hashPayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload ?? null, Object.keys(payload ?? {}).sort()))
    .digest("hex");
}

export async function createApprovalRequest(
  approval: Omit<InsertApprovalRecord, "id" | "payloadHash" | "payloadSnapshot" | "decision" | "createdAt" | "decidedAt" | "executionId" | "executionOutcome" | "executionNotes" | "rollbackRef" | "approverUserId" | "expiresAt">,
  payload: unknown,
  expiryHours: number = 24,
): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const payloadHash = hashPayload(payload);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  const [result] = await db.insert(approvalRecords).values({
    ...approval,
    payloadHash,
    payloadSnapshot: payload as any,
    decision: "approved" as const,
    expiresAt,
  });
  // Update the task to pending_approval
  await db.update(agentTasks).set({ status: "pending_approval" }).where(eq(agentTasks.id, approval.taskId));
  return result.insertId;
}

export async function decideApproval(
  approvalId: number,
  approverUserId: number,
  decision: "approved" | "rejected",
): Promise<ApprovalRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [existing] = await db
    .select()
    .from(approvalRecords)
    .where(eq(approvalRecords.id, approvalId));
  if (!existing) throw new Error("Approval not found");
  if (existing.decision !== "approved") throw new Error(`Approval already decided: ${existing.decision}`);
  if (new Date() > existing.expiresAt) {
    await db
      .update(approvalRecords)
      .set({ decision: "expired", decidedAt: new Date() })
      .where(eq(approvalRecords.id, approvalId));
    throw new Error("Approval has expired");
  }
  await db
    .update(approvalRecords)
    .set({ decision, approverUserId, decidedAt: new Date() })
    .where(eq(approvalRecords.id, approvalId));
  // Update the task status
  const taskStatus = decision === "approved" ? "approved" : "rejected";
  await db
    .update(agentTasks)
    .set({ status: taskStatus, approverUserId })
    .where(eq(agentTasks.id, existing.taskId));
  const [updated] = await db
    .select()
    .from(approvalRecords)
    .where(eq(approvalRecords.id, approvalId));
  return updated;
}

export async function recordExecution(
  approvalId: number,
  executionId: string,
  outcome: "success" | "failed",
  notes?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(approvalRecords)
    .set({ executionId, executionOutcome: outcome, executionNotes: notes })
    .where(eq(approvalRecords.id, approvalId));
  if (outcome === "success") {
    const [approval] = await db
      .select()
      .from(approvalRecords)
      .where(eq(approvalRecords.id, approvalId));
    if (approval) {
      await db
        .update(agentTasks)
        .set({ status: "executed" })
        .where(eq(agentTasks.id, approval.taskId));
    }
  }
}

export async function verifyApprovalForExecution(
  approvalId: number,
  payload: unknown,
): Promise<ApprovalRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [approval] = await db
    .select()
    .from(approvalRecords)
    .where(eq(approvalRecords.id, approvalId));
  if (!approval) throw new Error("Approval not found");
  if (approval.decision !== "approved") throw new Error(`Approval not approved: ${approval.decision}`);
  if (new Date() > approval.expiresAt) throw new Error("Approval has expired");
  const currentHash = hashPayload(payload);
  if (currentHash !== approval.payloadHash) {
    throw new Error("Payload hash mismatch — approval is void due to payload change");
  }
  if (approval.executionOutcome === "success") {
    throw new Error("Approval already executed — cannot reuse");
  }
  return approval;
}

// ─── Audit Events ───

export async function recordAuditEvent(event: InsertAuditEvent): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(auditEvents).values(event);
  return result.insertId;
}

export async function getAuditEvents(opts: {
  agentRole?: string;
  targetType?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEvent[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.agentRole) conditions.push(eq(auditEvents.agentRole, opts.agentRole as any));
  if (opts.targetType) conditions.push(eq(auditEvents.targetType, opts.targetType as any));
  if (opts.outcome) conditions.push(eq(auditEvents.outcome, opts.outcome as any));
  const query = db.select().from(auditEvents);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(auditEvents.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

// ─── Cockpit Summary ───

export async function getCockpitSummary(): Promise<{
  pendingApprovals: number;
  discoveredTasks: number;
  draftReadyTasks: number;
  totalTasks: number;
  recentAuditEvents: AuditEvent[];
  tasksByRole: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      pendingApprovals: 0,
      discoveredTasks: 0,
      draftReadyTasks: 0,
      totalTasks: 0,
      recentAuditEvents: [],
      tasksByRole: {},
    };
  }
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentTasks)
    .where(eq(agentTasks.status, "pending_approval"));
  const [discoveredCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentTasks)
    .where(eq(agentTasks.status, "discovered"));
  const [draftCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentTasks)
    .where(eq(agentTasks.status, "draft_ready"));
  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(agentTasks);
  const recentEvents = await db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(10);
  const roleCounts = await db
    .select({ role: agentTasks.agentRole, count: sql<number>`count(*)` })
    .from(agentTasks)
    .groupBy(agentTasks.agentRole);
  const tasksByRole: Record<string, number> = {};
  for (const row of roleCounts as { role: string; count: number }[]) {
    tasksByRole[row.role] = row.count;
  }
  return {
    pendingApprovals: pendingCount?.count ?? 0,
    discoveredTasks: discoveredCount?.count ?? 0,
    draftReadyTasks: draftCount?.count ?? 0,
    totalTasks: totalCount?.count ?? 0,
    recentAuditEvents: recentEvents,
    tasksByRole,
  };
}
