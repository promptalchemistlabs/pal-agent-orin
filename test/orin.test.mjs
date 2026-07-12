import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createOrin } from "../src/orin.mjs";
import { createOrinServer } from "../src/server.mjs";
import { normalizeTelegramUpdate, telegramRequestToTask } from "../src/telegram.mjs";

const NOW = "2026-07-12T12:00:00.000Z";
let sequence = 0;
const id = () => `fixed-${++sequence}`;

function task(objective) {
  return {
    contractVersion: "v1alpha1",
    taskId: "inbound-1",
    workflowId: "workflow-1",
    parentTaskId: null,
    sender: "telegram:42",
    recipient: "orin",
    objective,
    inputs: {},
    contextReferences: [],
    risk: "low",
    approvalId: null,
    requestedAt: NOW,
  };
}

test("normalizes a Telegram text message into a channel-neutral task", () => {
  sequence = 0;
  const request = normalizeTelegramUpdate({
    message: { message_id: 7, date: 1783857600, from: { id: 42 }, chat: { id: 99 }, text: "Write a terrarium blog" },
  });
  const result = telegramRequestToTask(request, { id });

  assert.equal(result.recipient, "orin");
  assert.equal(result.inputs.telegram.externalChatId, "99");
  assert.equal(result.objective, "Write a terrarium blog");
});

test("mock Orin deterministically routes content to Scribe", async () => {
  sequence = 0;
  let dispatched;
  const orin = createOrin({ id, now: () => NOW, dispatch: async (outbound) => (dispatched = outbound) });
  const result = await orin.handleTask(task("Write a blog about a beginner terrarium workshop"));

  assert.equal(result.status, "completed");
  assert.equal(dispatched.recipient, "scribe");
  assert.equal(dispatched.parentTaskId, "inbound-1");
  assert.equal(dispatched.inputs.business.name, "Tembusu Circle");
  assert.equal(dispatched.inputs.contentType, "blog");
  assert.equal(result.outputs.workflow.currentAgent, "scribe");
});

test("routes governance and operational diagnosis to bounded specialists", async () => {
  const orin = createOrin({ id, now: () => NOW });
  const review = await orin.handleTask(task("Review privacy and approve publishing"));
  const diagnosis = await orin.handleTask(task("Diagnose why the website build failed"));

  assert.equal(review.outputs.routedTask.recipient, "rick");
  assert.equal(diagnosis.outputs.routedTask.recipient, "bastion");
});

test("rejects tasks addressed to another agent", async () => {
  const orin = createOrin({ now: () => NOW });
  const result = await orin.handleTask({ ...task("hello"), recipient: "scribe" });
  assert.equal(result.status, "failed");
  assert.match(result.error, /addressed to orin/);
});

test("exposes health, capabilities, and Telegram webhook HTTP endpoints", async () => {
  sequence = 0;
  const server = createOrinServer({ orin: createOrin({ id, now: () => NOW }), id });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  after(() => server.close());
  const origin = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${origin}/health`).then((response) => response.json());
  assert.deepEqual(health, { status: "ok", agentId: "orin", mode: "mock", contractVersion: "v1alpha1" });

  const webhook = await fetch(`${origin}/channels/telegram`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: { message_id: 1, date: 1783857600, from: { id: 42 }, chat: { id: 99 }, text: "Draft website copy" } }),
  }).then((response) => response.json());
  assert.equal(webhook.result.outputs.routedTask.recipient, "scribe");
  assert.match(webhook.telegramReply, /routed it to scribe/);
});
