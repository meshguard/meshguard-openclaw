# Using AGT With meshguard-openclaw

MeshGuard supports OpenClaw extension governance, AGT-native governance, guardian sidecar enforcement, and egress enforcement in the same control plane. AGT is an additional policy enforcement path for teams that use Microsoft Agent Governance Toolkit in part of their fleet.

## OpenClaw Extension Pattern

```json
{
  "plugins": ["meshguard-openclaw"],
  "meshguard": {
    "apiKey": "${MESHGUARD_API_KEY}",
    "agentId": "agent_xxx",
    "mode": "enforce"
  }
}
```

## AGT-Compatible Path

1. Keep the OpenClaw extension enabled for OpenClaw agents.
2. Add AGT instrumentation where it fits a new or existing agent workflow.
3. Use AGT-compatible policy YAML when you want shared policy files across OpenClaw, AGT, sidecar, and egress paths.
4. Point all paths at the same MeshGuard PDP, audit log, and operator console.
5. Choose the enforcement path per agent, framework, and deployment architecture.
