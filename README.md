# @meshguard/openclaw

Official MeshGuard extension for [OpenClaw](https://openclaw.ai) — AI agent governance, policy enforcement, and audit logging.

[![npm version](https://badge.fury.io/js/%40meshguard%2Fopenclaw.svg)](https://www.npmjs.com/package/@meshguard/openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

MeshGuard provides enterprise-grade governance for AI agents:

- **Policy Enforcement**: Define what actions your agents can and cannot perform
- **Audit Logging**: Complete trail of all agent actions for compliance
- **Trust Tiers**: Role-based access control for multi-agent systems
- **Alerting**: Real-time notifications for policy violations

This extension integrates MeshGuard with OpenClaw agents, enabling governance without code changes.

## Installation

```bash
# npm
npm install @meshguard/openclaw

# pnpm
pnpm add @meshguard/openclaw

# Or via OpenClaw CLI
openclaw plugins install @meshguard/openclaw
```

## Quick Start

### 1. Get MeshGuard Credentials

Sign up at [meshguard.app](https://meshguard.app) and create an agent to get:
- **API Key** (`msk_xxx`)
- **Agent ID** (`agent_xxx`)

### 2. Configure OpenClaw

Add to your `openclaw.json`:

```json
{
  "plugins": ["@meshguard/openclaw"],
  "meshguard": {
    "apiKey": "${MESHGUARD_API_KEY}",
    "agentId": "agent_xxx",
    "mode": "enforce"
  }
}
```

Or use environment variables:

```bash
export MESHGUARD_API_KEY=msk_xxx
export MESHGUARD_AGENT_ID=agent_xxx
```

### 3. Define Policies

Create policies in the MeshGuard dashboard or via API:

```yaml
name: my-agent-policy
version: "1.0"
appliesTo:
  agentIds:
    - agent_xxx
rules:
  - effect: allow
    actions:
      - "tool:read"
      - "tool:web_search"
    description: Allow read operations
    
  - effect: deny
    actions:
      - "tool:exec"
    conditions:
      command_pattern: "rm -rf /*"
    description: Block destructive commands
    alert: critical
```

### 4. Run Your Agent

That's it! MeshGuard will now:
- Evaluate policies before each tool call
- Block actions that violate policies (in enforce mode)
- Log all actions to the audit trail

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable governance |
| `apiKey` | string | required | MeshGuard API key |
| `agentId` | string | required | MeshGuard agent ID |
| `gatewayUrl` | string | `https://dashboard.meshguard.app` | MeshGuard gateway URL |
| `mode` | string | `"enforce"` | `enforce`, `audit`, or `bypass` |
| `auditLevel` | string | `"standard"` | `minimal`, `standard`, or `verbose` |
| `cacheTimeoutMs` | number | `60000` | Policy cache duration (ms) |
| `failOpen` | boolean | `false` | Allow actions if MeshGuard is unreachable |

## Modes

- **enforce**: Block policy violations, log all actions
- **audit**: Log all actions, but don't block violations (shadow mode)
- **bypass**: Disable governance entirely

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw Agent                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Tool Invocation                       ││
│  └────────────────────────┬────────────────────────────────┘│
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              before_tool_call hook                       ││
│  │         ┌─────────────────────────────┐                 ││
│  │         │   MeshGuard Extension       │                 ││
│  │         │   - Evaluate policy         │                 ││
│  │         │   - Check cache             │                 ││
│  │         │   - Block if denied         │                 ││
│  │         └─────────────────────────────┘                 ││
│  └────────────────────────┬────────────────────────────────┘│
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               Tool Execution (if allowed)               ││
│  └────────────────────────┬────────────────────────────────┘│
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               after_tool_call hook                       ││
│  │         ┌─────────────────────────────┐                 ││
│  │         │   MeshGuard Extension       │                 ││
│  │         │   - Log to audit trail      │                 ││
│  │         │   - Record duration         │                 ││
│  │         │   - Capture result/error    │                 ││
│  │         └─────────────────────────────┘                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MeshGuard Cloud                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Policy    │  │   Audit     │  │  Dashboard  │         │
│  │   Engine    │  │   Store     │  │     UI      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

- **Sensitive data redaction**: Passwords, tokens, and API keys are automatically redacted from audit logs
- **Local caching**: Policies are cached locally to minimize latency and network dependency
- **Fail-safe defaults**: By default, actions are blocked if MeshGuard is unreachable (`failOpen: false`)

## Documentation

- [MeshGuard Docs](https://docs.meshguard.app)
- [OpenClaw Integration Guide](https://docs.meshguard.app/integrations/openclaw)
- [Policy Reference](https://docs.meshguard.app/policies)
- [API Reference](https://docs.meshguard.app/api)

## Support

- **Issues**: [GitHub Issues](https://github.com/meshguard/meshguard-openclaw/issues)
- **Email**: support@meshguard.app
- **Discord**: [MeshGuard Community](https://discord.gg/meshguard)

## License

MIT © [MeshGuard](https://meshguard.app)
