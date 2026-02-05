/**
 * MeshGuard OpenClaw Extension
 * 
 * Official governance integration for OpenClaw AI agents.
 * Provides policy enforcement, audit logging, and compliance monitoring.
 * 
 * @see https://meshguard.app
 * @see https://docs.meshguard.app/integrations/openclaw
 */

import type { MeshGuardConfig } from "./types.js";
import { createBeforeToolHandler } from "./hooks/before-tool.js";
import { createAfterToolHandler } from "./hooks/after-tool.js";
import { flushAuditQueue } from "./client/audit.js";
import { clearPolicyCache, getCacheStats } from "./client/policy.js";

// Re-export types
export * from "./types.js";

/**
 * Plugin definition for OpenClaw
 */
const plugin = {
  id: "meshguard",
  name: "MeshGuard Governance",
  description: "AI agent governance, policy enforcement, and audit logging",
  
  /**
   * Register the plugin with OpenClaw
   */
  register(api: {
    id: string;
    pluginConfig?: Record<string, unknown>;
    registerHook: (events: string | string[], handler: unknown) => void;
    logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
  }) {
    const rawConfig = api.pluginConfig || {};
    
    // Build config with defaults
    const config: MeshGuardConfig = {
      enabled: rawConfig.enabled !== false,
      apiKey: rawConfig.apiKey as string || "",
      agentId: rawConfig.agentId as string || "",
      gatewayUrl: (rawConfig.gatewayUrl as string) || "https://dashboard.meshguard.app",
      mode: (rawConfig.mode as MeshGuardConfig["mode"]) || "enforce",
      auditLevel: (rawConfig.auditLevel as MeshGuardConfig["auditLevel"]) || "standard",
      cacheTimeoutMs: (rawConfig.cacheTimeoutMs as number) || 60000,
      failOpen: rawConfig.failOpen === true,
    };

    // Validate required config
    if (!config.apiKey) {
      api.logger.warn("[meshguard] No API key configured - governance disabled");
      return;
    }
    if (!config.agentId) {
      api.logger.warn("[meshguard] No agent ID configured - governance disabled");
      return;
    }

    api.logger.info(
      `[meshguard] Initializing governance for agent ${config.agentId} (mode: ${config.mode})`
    );

    // Register before_tool_call hook for policy enforcement
    api.registerHook("before_tool_call", createBeforeToolHandler(config));

    // Register after_tool_call hook for audit logging
    api.registerHook("after_tool_call", createAfterToolHandler(config));

    // Register gateway_stop hook to flush audit queue
    api.registerHook("gateway_stop", async () => {
      api.logger.info("[meshguard] Flushing audit queue before shutdown...");
      await flushAuditQueue(config);
    });

    api.logger.info("[meshguard] Governance hooks registered successfully");
  },
};

export default plugin;

/**
 * Utility: Clear policy cache (for testing or forced refresh)
 */
export { clearPolicyCache };

/**
 * Utility: Get cache statistics
 */
export { getCacheStats };

/**
 * Utility: Manually flush audit queue
 */
export { flushAuditQueue };
