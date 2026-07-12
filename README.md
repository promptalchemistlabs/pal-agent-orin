# Orin

> Community intelligence and coordination for Kingdom of PAL.

Orin understands recurring community needs, selects the minimum permitted
context, translates founder intent into structured tasks, and coordinates
multi-agent workflows.

## Status

Contract scaffold only. The runtime is not implemented yet.

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

## Development

The language, framework and runtime entrypoint are deliberately undecided. Add
implementation code only after the kingdom contracts and runtime architecture
are approved.

## Licence

No licence has been selected yet.
