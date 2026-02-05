/**
 * After Tool Call Hook
 * 
 * Logs tool execution results to MeshGuard audit.
 */

import type { MeshGuardConfig } from "../types.js";
import { submitAuditEvent } from "../client/audit.js";

export interface AfterToolEvent {
  toolName: string;
  params: Record<string, unknown>;
  result?: unknown;
  error?: string;
  durationMs?: number;
}

export interface AfterToolContext {
  agentId?: string;
  sessionKey?: string;
  toolName: string;
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
 * Summarize tool result for audit log
 */
function summarizeResult(result: unknown, level: "minimal" | "standard" | "verbose"): unknown {
  if (level === "minimal") {
    return typeof result === "object" ? "[object]" : typeof result;
  }

  if (level === "standard") {
    if (typeof result === "string") {
      return result.length > 200 ? result.substring(0, 200) + "..." : result;
    }
    if (typeof result === "object" && result !== null) {
      const str = JSON.stringify(result);
      return str.length > 500 ? str.substring(0, 500) + "..." : result;
    }
    return result;
  }

  // verbose - include full result (up to reasonable limit)
  if (typeof result === "string" && result.length > 10000) {
    return result.substring(0, 10000) + "...[truncated]";
  }
  if (typeof result === "object" && result !== null) {
    const str = JSON.stringify(result);
    if (str.length > 50000) {
      return "[result too large to log]";
    }
  }
  return result;
}

/**
 * Create the after_tool_call hook handler
 */
export function createAfterToolHandler(config: MeshGuardConfig) {
  return async function afterToolHandler(
    event: AfterToolEvent,
    ctx: AfterToolContext
  ): Promise<void> {
    // Skip if disabled or bypass mode
    if (!config.enabled || config.mode === "bypass") {
      return;
    }

    const action = `tool:${event.toolName}`;
    const redactedParams = redactParams(event.params);

    submitAuditEvent(config, {
      agentId: config.agentId,
      action,
      context: {
        params: config.auditLevel === "verbose" ? redactedParams : undefined,
        result: summarizeResult(event.result, config.auditLevel),
        sessionKey: ctx.sessionKey,
      },
      result: event.error ? "failure" : "success",
      error: event.error,
      durationMs: event.durationMs,
      timestamp: new Date().toISOString(),
    });
  };
}
