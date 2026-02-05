/**
 * Before Tool Call Hook
 * 
 * Evaluates policy and submits audit for ALL tool calls.
 * Note: after_tool_call is not invoked by OpenClaw, so we do everything here.
 */

import { MeshGuardConfig, PolicyDecision } from "../types.js";
import { evaluatePolicy } from "../client/policy.js";
import { submitAuditEvent } from "../client/audit.js";

interface BeforeToolEvent {
  toolName: string;
  params: Record<string, unknown>;
}

interface HookContext {
  sessionKey?: string;
  agentId?: string;
}

/**
 * Redact sensitive parameters for logging
 */
function redactParams(params: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    "password", "secret", "token", "api_key", "apiKey", 
    "credential", "authorization", "bearer"
  ];
  
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params || {})) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
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
    ctx?: HookContext
  ): Promise<{ block: boolean; blockReason?: string } | void> {
    console.log(`[meshguard] before_tool_call: ${event?.toolName}`);
    
    if (!config.enabled || config.mode === "bypass") {
      return;
    }
    
    const action = `tool:${event.toolName}`;
    const redactedParams = redactParams(event.params);
    const timestamp = new Date().toISOString();
    
    try {
      // Evaluate policy
      const response = await evaluatePolicy(config, {
        agentId: config.agentId,
        action,
        context: { params: redactedParams, sessionKey: ctx?.sessionKey },
        timestamp,
      });
      
      const effect = response.decision?.effect || "allow";
      console.log(`[meshguard] Policy decision for ${action}: ${effect}`);
      
      // Build decision object for audit
      const decision: PolicyDecision = {
        effect,
        rule: response.decision?.rule,
        reason: response.decision?.reason,
      };
      
      // Submit audit event for ALL decisions (allow and deny)
      await submitAuditEvent(config, {
        agentId: config.agentId,
        action,
        result: effect === "deny" ? "blocked" : "success",
        decision,
        context: { params: redactedParams },
        timestamp,
      });
      console.log(`[meshguard] Audit submitted for ${action}`);
      
      // Block if deny and enforce mode
      if (effect === "deny" && config.mode === "enforce") {
        return { 
          block: true, 
          blockReason: `🛡️ MeshGuard: ${response.decision?.reason || "Action denied by policy"}` 
        };
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[meshguard] Error:`, errMsg);
      if (!config.failOpen) {
        return { block: true, blockReason: "🛡️ MeshGuard: Policy evaluation failed" };
      }
    }
  };
}
