# Orin

> Community intelligence and coordination for Kingdom of PAL.

Orin understands recurring community needs, selects the minimum permitted
context, translates founder intent into structured tasks, and coordinates
multi-agent workflows.

## Status

Development runtime implemented with deterministic mock routing, a Telegram
channel adapter, HTTP health/capability endpoints, and an optional OpenAI Agents
SDK boundary. Mock mode is the default and does not require credentials.

## Core responsibilities

- Analyse community conversations and recurring questions
- Retrieve permitted community and shared-memory context
- Route contract-valid tasks to specialised agents
- Coordinate workflow state and collect results
- Escalate sensitive or consequential decisions to the founder

## Boundaries

Orin cannot make major business decisions, expose private community data,
publish consequential output without approval, or expand its own permissions.

See [`agent.yaml`](agent.yaml) for the machine-readable contract and
[`docs/ROLE.md`](docs/ROLE.md) for detailed operating rules.

## Kingdom integration

- Registry: `promptalchemistlabs/sleeping-prince/agent-registry.yaml`
- Contracts: `promptalchemistlabs/sleeping-prince/shared-contracts/`
- Workflow: `community-campaign`

## Runtime contract

Telegram is an adapter, not part of Orin's core contract. `POST
/channels/telegram` normalises a Telegram update into the existing `v1alpha1`
task request. Orin then creates a child task addressed to Scribe, Rick, or
Bastion and returns a dashboard-ready workflow projection.

Routes:

- `GET /health`
- `GET /capabilities`
- `POST /tasks`
- `POST /channels/telegram`

## Development

All configuration resolves from the kingdom root `.env`; do not add an agent
specific environment file.

```sh
cd agents/orin
npm test
npm start
```

The server defaults to deterministic `ORIN_MODE=mock` on port `4101`. Live mode
must be assembled by the kingdom runtime with the official OpenAI Agents SDK
and the boundary in `src/openai-boundary.mjs`; this package never reads an API
key directly.

## Licence

No licence has been selected yet.
