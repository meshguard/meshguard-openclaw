/**
 * MeshGuard Audit Event Client
 */

import type { MeshGuardConfig, AuditEvent } from "../types.js";

// Queue for batched audit events
const auditQueue: AuditEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MAX_BATCH_SIZE = 50;

/**
 * Submit an audit event to MeshGuard
 * Events are batched and sent asynchronously to avoid blocking tool execution
 */
export function submitAuditEvent(config: MeshGuardConfig, event: AuditEvent): void {
  if (config.mode === "bypass") {
    return; // Don't log in bypass mode
  }

  // Add to queue
  auditQueue.push(event);

  // Flush if batch is full
  if (auditQueue.length >= MAX_BATCH_SIZE) {
    void flushAuditQueue(config);
  }

  // Schedule flush if not already scheduled
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      void flushAuditQueue(config);
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush the audit queue to MeshGuard
 */
export async function flushAuditQueue(config: MeshGuardConfig): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (auditQueue.length === 0) {
    return;
  }

  // Take all events from queue
  const events = auditQueue.splice(0, auditQueue.length);

  const url = `${config.gatewayUrl}/api/v1/audit/batch`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MeshGuard-API-Key": config.apiKey,
        "X-MeshGuard-Agent-Id": config.agentId,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[meshguard] Failed to submit audit events: ${response.status} ${errorText}`);
      // Put events back in queue for retry? For now, just log
    }
  } catch (error) {
    console.error(`[meshguard] Failed to submit audit events:`, error);
    // Events are lost on network failure - could implement retry logic
  }
}

/**
 * Submit a single audit event immediately (for critical events)
 */
export async function submitAuditEventImmediate(
  config: MeshGuardConfig,
  event: AuditEvent
): Promise<void> {
  if (config.mode === "bypass") {
    return;
  }

  const url = `${config.gatewayUrl}/api/v1/audit`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MeshGuard-API-Key": config.apiKey,
        "X-MeshGuard-Agent-Id": config.agentId,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[meshguard] Failed to submit audit event: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error(`[meshguard] Failed to submit audit event:`, error);
  }
}

/**
 * Get queue statistics
 */
export function getAuditQueueStats(): { queueLength: number; flushPending: boolean } {
  return {
    queueLength: auditQueue.length,
    flushPending: flushTimer !== null,
  };
}
