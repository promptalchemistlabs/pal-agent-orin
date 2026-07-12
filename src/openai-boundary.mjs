/**
 * Thin boundary for the official OpenAI Agents SDK. The caller supplies a runner
 * shaped like the SDK's `run(agent, input)` API, keeping mock/test execution free
 * from credentials and from a hard SDK dependency.
 */
export function createOpenAIAgentsSdkBoundary({ runner, agent }) {
  if (typeof runner !== "function") throw new TypeError("runner must be a function");

  return {
    mode: "openai-agents-sdk",
    async refineRoute({ objective, deterministicRoute }) {
      const response = await runner(agent, JSON.stringify({
        objective,
        allowedRecipients: ["scribe", "rick", "bastion"],
        deterministicRoute,
      }));

      const output = response?.finalOutput ?? response;
      if (!output || !["scribe", "rick", "bastion"].includes(output.recipient)) {
        throw new TypeError("Agents SDK output must contain an allowed recipient");
      }

      return {
        recipient: output.recipient,
        reason: String(output.reason ?? "Selected by the Orin model boundary"),
      };
    },
  };
}
