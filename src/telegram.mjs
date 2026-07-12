import { assertTelegramRequest } from "./contracts.mjs";

export function normalizeTelegramUpdate(update, { now = () => new Date().toISOString() } = {}) {
  const message = update?.message ?? update?.edited_message;
  const text = message?.text?.trim();

  if (!message || !text) {
    throw new TypeError("Telegram update must contain a text message");
  }

  return assertTelegramRequest({
    channel: "telegram",
    externalUserId: String(message.from?.id ?? "unknown"),
    externalChatId: String(message.chat?.id ?? "unknown"),
    messageId: String(message.message_id),
    text,
    receivedAt: new Date((message.date ?? Date.parse(now()) / 1000) * 1000).toISOString(),
  });
}

export function telegramRequestToTask(request, { id = crypto.randomUUID } = {}) {
  assertTelegramRequest(request);
  const workflowId = `workflow-${id()}`;

  return {
    contractVersion: "v1alpha1",
    taskId: `task-${id()}`,
    workflowId,
    parentTaskId: null,
    sender: `telegram:${request.externalUserId}`,
    recipient: "orin",
    objective: request.text,
    inputs: { telegram: request },
    contextReferences: [],
    risk: "low",
    approvalId: null,
    requestedAt: request.receivedAt,
  };
}

export function formatTelegramAcknowledgement(result) {
  const workflow = result.outputs?.workflow;
  if (!workflow) return result.summary;

  const next = workflow.currentAgent === "orin" ? "the kingdom" : workflow.currentAgent;
  return `Got it. I created ${workflow.id} and routed it to ${next}.`;
}
