import http from "node:http";
import { createOrin } from "./orin.mjs";
import { formatTelegramAcknowledgement, normalizeTelegramUpdate, telegramRequestToTask } from "./telegram.mjs";

export function createOrinServer({ orin = createOrin(), id = crypto.randomUUID } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader("content-type", "application/json; charset=utf-8");

    if (request.method === "GET" && request.url === "/health") {
      return response.end(JSON.stringify(orin.health()));
    }
    if (request.method === "GET" && request.url === "/capabilities") {
      return response.end(JSON.stringify(orin.capabilities()));
    }
    if (request.method === "POST" && ["/tasks", "/channels/telegram"].includes(request.url)) {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        const task = request.url === "/channels/telegram"
          ? telegramRequestToTask(normalizeTelegramUpdate(body), { id })
          : body;
        const result = await orin.handleTask(task);
        response.statusCode = result.status === "failed" ? 400 : 200;
        return response.end(JSON.stringify({
          result,
          ...(request.url === "/channels/telegram"
            ? { telegramReply: formatTelegramAcknowledgement(result) }
            : {}),
        }));
      } catch (error) {
        response.statusCode = 400;
        return response.end(JSON.stringify({ error: error.message }));
      }
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Not found" }));
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.env.ORIN_PORT ?? 4101);
  const server = createOrinServer({ orin: createOrin({ mode: process.env.ORIN_MODE ?? "mock" }) });
  server.listen(port, () => console.log(`Orin listening on http://127.0.0.1:${port}`));
}
