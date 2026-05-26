# Migrating From meshguard-openclaw To AGT + MeshGuard

The OpenClaw extension remains supported for existing deployments. New cross-framework governance features move through AGT-compatible policy and MeshGuard control-plane enforcement.

## Recommended Path

1. Keep the OpenClaw extension enabled for current agents.
2. Store policies in AGT-compatible YAML.
3. Use MeshGuard policy-as-code checks before promotion.
4. For new agents, prefer the AGT adapter or language-neutral sidecar/egress enforcement.

