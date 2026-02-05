/**
 * MeshGuard Policy Evaluation Client
 */

import type {
  MeshGuardConfig,
  PolicyEvaluationRequest,
  PolicyEvaluationResponse,
  CachedPolicy,
} from "../types.js";

// Simple in-memory cache
const policyCache = new Map<string, CachedPolicy>();

/**
 * Build a cache key for a policy evaluation
 */
function buildCacheKey(request: PolicyEvaluationRequest): string {
  return `${request.agentId}:${request.action}:${JSON.stringify(request.context || {})}`;
}

/**
 * Check if a cached policy is still valid
 */
function isValidCache(cached: CachedPolicy): boolean {
  return Date.now() < cached.expiresAt;
}

/**
 * Evaluate a policy against MeshGuard
 */
export async function evaluatePolicy(
  config: MeshGuardConfig,
  request: PolicyEvaluationRequest
): Promise<PolicyEvaluationResponse> {
  // Check cache first
  const cacheKey = buildCacheKey(request);
  const cached = policyCache.get(cacheKey);
  if (cached && isValidCache(cached)) {
    return cached.policy;
  }

  // Call MeshGuard API
  const url = `${config.gatewayUrl}/api/v1/evaluate`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MeshGuard-API-Key": config.apiKey,
        "X-MeshGuard-Agent-Id": config.agentId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MeshGuard API error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as PolicyEvaluationResponse;

    // Cache the result
    policyCache.set(cacheKey, {
      policy: result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + config.cacheTimeoutMs,
    });

    return result;
  } catch (error) {
    // Handle network errors based on failOpen setting
    if (config.failOpen) {
      console.warn(`[meshguard] Policy evaluation failed, failing open: ${error}`);
      return {
        decision: { effect: "allow", reason: "MeshGuard unreachable, fail-open enabled" },
        evaluationId: "fail-open",
        evaluatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * Clear the policy cache (useful for testing or forced refresh)
 */
export function clearPolicyCache(): void {
  policyCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: policyCache.size,
    entries: Array.from(policyCache.keys()),
  };
}
