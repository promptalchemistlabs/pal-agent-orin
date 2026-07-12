import { assertTaskRequest, taskResult } from "./contracts.mjs";

const DEFAULT_BUSINESS = Object.freeze({
  name: "Tembusu Circle",
  description: "A community for people building and running terrarium businesses.",
});

const DIAGNOSTIC_TERMS = /\b(health|down|error|fail(?:ed|ure)?|diagnos(?:e|is)|incident|broken)\b/i;
const GOVERNANCE_TERMS = /\b(approve|approval|permission|privacy|security|publish|policy|risk)\b/i;
const WEBSITE_TERMS = /\b(website|landing page|web page|homepage|copy)\b/i;

export function deterministicRoute(objective) {
  if (DIAGNOSTIC_TERMS.test(objective)) {
    return { recipient: "bastion", reason: "The request asks for operational diagnosis." };
  }
  if (GOVERNANCE_TERMS.test(objective)) {
    return { recipient: "rick", reason: "The request requires policy, permission, or publication review." };
  }
  return { recipient: "scribe", reason: "The request is a content task for the demo business." };
}

function buildSpecialistInputs(task, recipient) {
  const objective = task.objective;
  const contentType = WEBSITE_TERMS.test(objective) ? "website" : "blog";

  return {
    ...task.inputs,
    business: task.inputs?.business ?? DEFAULT_BUSINESS,
    topic: objective,
    requestedAction:
      recipient === "scribe"
        ? "draft-markdown"
        : recipient === "rick"
          ? "review-request"
          : "diagnose-workflow",
    ...(recipient === "scribe" ? { contentType } : {}),
  };
}

function createWorkflow(task, routedTask, route, now) {
  return {
    id: task.workflowId,
    title: task.objective,
    request: {
      channel: task.inputs?.telegram?.channel ?? "api",
      text: task.objective,
      externalChatId: task.inputs?.telegram?.externalChatId ?? null,
    },
    status: "running",
    currentAgent: route.recipient,
    createdAt: task.requestedAt ?? now(),
    updatedAt: now(),
    steps: [
      {
        id: task.taskId,
        agent: "orin",
        status: "completed",
        title: "Understand and route request",
        summary: route.reason,
        timestamp: now(),
      },
      {
        id: routedTask.taskId,
        agent: route.recipient,
        status: "pending",
        title: routedTask.objective,
      },
    ],
  };
}

export function createOrin({
  mode = "mock",
  modelBoundary = null,
  dispatch = async () => null,
  id = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
} = {}) {
  if (!new Set(["mock", "openai"]).has(mode)) throw new TypeError("mode must be mock or openai");
  if (mode === "openai" && !modelBoundary) throw new TypeError("openai mode requires modelBoundary");

  return {
    id: "orin",
    mode,
    health() {
      return { status: "ok", agentId: "orin", mode, contractVersion: "v1alpha1" };
    },
    capabilities() {
      return {
        agentId: "orin",
        capabilities: [
          "community-question-analysis",
          "context-selection",
          "workflow-routing",
          "multi-agent-coordination",
          "telegram-channel-adapter",
        ],
        channels: ["telegram", "api"],
      };
    },
    async handleTask(input) {
      let task;
      try {
        task = assertTaskRequest(input);
        if (task.recipient !== "orin") throw new TypeError("Orin only accepts tasks addressed to orin");
      } catch (error) {
        return taskResult({
          taskId: input?.taskId ?? "invalid-task",
          status: "failed",
          summary: "Orin rejected an invalid task request.",
          error: error.message,
          now,
        });
      }

      const fallback = deterministicRoute(task.objective);
      const route = mode === "openai"
        ? await modelBoundary.refineRoute({ objective: task.objective, deterministicRoute: fallback })
        : fallback;

      const routedTask = {
        contractVersion: "v1alpha1",
        taskId: `task-${id()}`,
        workflowId: task.workflowId,
        parentTaskId: task.taskId,
        sender: "orin",
        recipient: route.recipient,
        objective: task.objective,
        inputs: buildSpecialistInputs(task, route.recipient),
        contextReferences: task.contextReferences ?? [],
        risk: task.risk,
        approvalId: task.approvalId ?? null,
        requestedAt: now(),
      };

      const workflow = createWorkflow(task, routedTask, route, now);

      try {
        const dispatchedResult = await dispatch(routedTask);
        return taskResult({
          taskId: task.taskId,
          status: "completed",
          summary: `Orin routed the workflow to ${route.recipient}.`,
          outputs: { route, routedTask, workflow, dispatchedResult },
          now,
        });
      } catch (error) {
        workflow.status = "failed";
        workflow.steps[1].status = "failed";
        return taskResult({
          taskId: task.taskId,
          status: "failed",
          summary: `Orin could not dispatch the task to ${route.recipient}.`,
          outputs: { route, routedTask, workflow },
          error: error.message,
          now,
        });
      }
    },
  };
}
