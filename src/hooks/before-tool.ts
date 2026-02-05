/**
 * Before Tool Call Hook
 * 
 * Intercepts tool invocations to evaluate policies before execution.
 * Can block tools that violate governance policies.
 */

import type { MeshGuardConfig, PolicyDecision } from "../types.js";
import { evaluatePolicy } from "../client/policy.js";
import { submitAuditEventImmediate } from "../client/audit.js";

export interface BeforeToolEvent {
  toolName: string;
  params: Record<string, unknown>;
}

export interface BeforeToolContext {
  agentId?: string;
  sessionKey?: string;
  toolName: string;
}

export interface BeforeToolResult {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
}

/**
 * Redact sensitive parameters for logging
 */
function redactParams(params: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "api_key",
    "apiKey",
    "credential",
    "authorization",
    "bearer",
  ];

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 500) {
      redacted[key] = value.substring(0, 500) + "...[truncated]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Create the before_tool_call hook handler
 */
export function createBeforeToolHandler(config: MeshGuardConfig) {
  return async function beforeToolHandler(
    event: BeforeToolEvent,
    ctx: BeforeToolContext
  ): Promise<BeforeToolResult | void> {
    // Skip if disabled or bypass mode
    if (!config.enabled || config.mode === "bypass") {
      return;
    }

    const action = `tool:${event.toolName}`;
    const redactedParams = redactParams(event.params);

    try {
      // Evaluate policy
      const response = await evaluatePolicy(config, {
        agentId: config.agentId,
        action,
        context: {
          params: redactedParams,
          sessionKey: ctx.sessionKey,
        },
        timestamp: new Date().toISOString(),
      });

      const decision = response.decision;

      // Handle decision
      if (decision.effect === "deny") {
        // Log the violation immediately
        await submitAuditEventImmediate(config, {
          agentId: config.agentId,
          action,
          context: { params: redactedParams },
          result: "blocked",
          decision,
          timestamp: new Date().toISOString(),
        });

        // In audit mode, log but don't block
        if (config.mode === "audit") {
          console.warn(
            `[meshguard] Policy violation (audit mode): ${action} - ${decision.reason || decision.ruleDescription || "Policy denied"}`
          );
          return;
        }

        // In enforce mode, block the tool
        return {
          block: true,
          blockReason: `🛡️ MeshGuard: ${decision.reason || decision.ruleDescription || "Action blocked by policy"}`,
        };
      }

      if (decision.effect === "approval_required") {
        // For now, treat as deny - future: implement approval flow
        return {
          block: true,
          blockReason: `🛡️ MeshGuard: Action requires approval (not yet implemented)`,
        };
      }

      // Allow - no need to block
      return;
    } catch (error) {
      console.error(`[meshguard] Policy evaluation failed:`, error);

      // Handle based on failOpen setting
      if (config.failOpen) {
        console.warn(`[meshguard] Failing open for ${action}`);
        return;
      }

      // Fail closed - block the action
      return {
        block: true,
        blockReason: `🛡️ MeshGuard: Unable to evaluate policy - action blocked for safety`,
      };
    }
  };
}
