const AGENTS = new Set(["orin", "scribe", "rick", "bastion"]);
const RISKS = new Set(["low", "medium", "high"]);

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

export function assertTaskRequest(task) {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    throw new TypeError("task request must be an object");
  }

  if (task.contractVersion !== "v1alpha1") {
    throw new TypeError("contractVersion must be v1alpha1");
  }

  for (const field of ["taskId", "workflowId", "sender", "recipient", "objective"]) {
    requireString(task[field], field);
  }

  if (!AGENTS.has(task.recipient)) {
    throw new TypeError(`recipient must be one of: ${[...AGENTS].join(", ")}`);
  }

  if (!RISKS.has(task.risk)) {
    throw new TypeError("risk must be low, medium, or high");
  }

  return task;
}

export function assertTelegramRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("Telegram request must be an object");
  }

  if (request.channel !== "telegram") {
    throw new TypeError("channel must be telegram");
  }

  for (const field of ["externalUserId", "externalChatId", "messageId", "text", "receivedAt"]) {
    requireString(request[field], field);
  }

  return request;
}

export function taskResult({ taskId, status, summary, outputs = {}, error = null, now }) {
  return {
    contractVersion: "v1alpha1",
    taskId,
    agentId: "orin",
    status,
    summary,
    outputs,
    artifacts: [],
    memorySummary: null,
    completedAt: now(),
    error,
  };
}
