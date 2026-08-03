import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import {
  createAgentTask,
  getAgentTasks,
  getAgentTaskById,
  updateAgentTaskStatus,
  getPendingApprovalTasks,
  createApprovalRequest,
  decideApproval,
  recordExecution,
  verifyApprovalForExecution,
  recordAuditEvent,
  getAuditEvents,
  getCockpitSummary,
  hashPayload,
} from "./operations";

export const operationsRouter = router({
  /** Cockpit summary: queue counts, recent audit events, tasks by role. */
  summary: adminProcedure.query(async () => {
    return getCockpitSummary();
  }),

  /** List agent tasks with filters. */
  listTasks: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        agentRole: z.string().optional(),
        targetType: z.string().optional(),
        priority: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      return getAgentTasks(input);
    }),

  /** Get a single task by ID. */
  getTask: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getAgentTaskById(input.id);
    }),

  /** Get all tasks pending approval. */
  pendingApprovals: adminProcedure.query(async () => {
    return getPendingApprovalTasks();
  }),

  /** Create a new agent task (used by agents or operators). */
  createTask: adminProcedure
    .input(
      z.object({
        agentRole: z.enum([
          "manager",
          "directory_curator",
          "events_editor",
          "content_editor",
          "community_moderator",
          "business_success",
          "analyst",
          "reliability_watchdog",
        ]),
        taskType: z.string().min(1),
        riskLevel: z.enum(["R0", "R1", "R2", "R3", "R4"]),
        targetEntity: z.string().optional(),
        targetType: z.enum([
          "business",
          "event",
          "blog",
          "claim",
          "review",
          "comment",
          "submission",
          "infrastructure",
          "seo",
          "other",
        ]),
        title: z.string().min(1).max(500),
        payload: z.any().optional(),
        evidence: z.any().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        confidence: z.number().min(0).max(100).default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const id = await createAgentTask(input);
      await recordAuditEvent({
        agentRole: input.agentRole,
        actionType: "create_task",
        riskLevel: input.riskLevel,
        targetEntity: input.targetEntity ?? null,
        targetType: input.targetType,
        outcome: "success",
        summary: `Created task: ${input.title}`,
        details: { taskId: id, taskType: input.taskType } as any,
        taskId: id ?? null,
      });
      return { id };
    }),

  /** Update task status (operator action). */
  updateTaskStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "discovered",
          "source_identified",
          "verified",
          "draft_ready",
          "pending_approval",
          "approved",
          "rejected",
          "executed",
          "failed",
          "archived",
        ]),
        resolutionNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await updateAgentTaskStatus(input.id, input.status, input.resolutionNotes);
      await recordAuditEvent({
        agentRole: "manager",
        actionType: "update_task_status",
        riskLevel: "R1",
        targetEntity: null,
        targetType: "other",
        outcome: "success",
        summary: `Task ${input.id} status → ${input.status}`,
        details: { taskId: input.id, newStatus: input.status, userId: ctx.user.id } as any,
        taskId: input.id,
      });
      return { success: true as const };
    }),

  /** Request approval for an agent task (R2-R4). */
  requestApproval: adminProcedure
    .input(
      z.object({
        taskId: z.number(),
        actionType: z.string().min(1),
        targetEntity: z.string().min(1),
        targetType: z.enum([
          "business",
          "event",
          "blog",
          "claim",
          "review",
          "comment",
          "submission",
          "infrastructure",
          "seo",
          "other",
        ]),
        riskLevel: z.enum(["R2", "R3", "R4"]),
        payload: z.any(),
        evidence: z.any().optional(),
        expiryHours: z.number().min(1).max(168).default(24),
      }),
    )
    .mutation(async ({ input }) => {
      const id = await createApprovalRequest(
        {
          taskId: input.taskId,
          targetEntity: input.targetEntity,
          targetType: input.targetType,
          actionType: input.actionType,
          riskLevel: input.riskLevel,
          evidence: input.evidence as any,
        },
        input.payload,
        input.expiryHours,
      );
      return { id };
    }),

  /** Approve or reject a pending approval. */
  decideApproval: adminProcedure
    .input(
      z.object({
        approvalId: z.number(),
        decision: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await decideApproval(input.approvalId, ctx.user.id, input.decision);
      await recordAuditEvent({
        agentRole: "manager",
        actionType: "decide_approval",
        riskLevel: result?.riskLevel ?? "R3",
        targetEntity: result?.targetEntity ?? null,
        targetType: result?.targetType ?? "other",
        outcome: "success",
        summary: `Approval ${input.approvalId} → ${input.decision}`,
        details: { approvalId: input.approvalId, decision: input.decision, userId: ctx.user.id } as any,
        approvalId: input.approvalId,
        taskId: result?.taskId ?? null,
      });
      return result;
    }),

  /** Verify and execute an approved action (with payload binding). */
  executeApproved: adminProcedure
    .input(
      z.object({
        approvalId: z.number(),
        payload: z.any(),
        executionId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const approval = await verifyApprovalForExecution(input.approvalId, input.payload);
      await recordExecution(input.approvalId, input.executionId, "success");
      await recordAuditEvent({
        agentRole: "manager",
        actionType: "execute_approved",
        riskLevel: approval.riskLevel,
        targetEntity: approval.targetEntity,
        targetType: approval.targetType,
        outcome: "success",
        summary: `Executed approved action: ${approval.actionType}`,
        details: { approvalId: input.approvalId, executionId: input.executionId } as any,
        approvalId: input.approvalId,
        taskId: approval.taskId,
      });
      return { success: true as const };
    }),

  /** List audit events. */
  listAuditEvents: adminProcedure
    .input(
      z.object({
        agentRole: z.string().optional(),
        targetType: z.string().optional(),
        outcome: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      return getAuditEvents(input);
    }),
});
