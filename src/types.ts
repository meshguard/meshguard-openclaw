/**
 * MeshGuard OpenClaw Extension Types
 */

export interface MeshGuardConfig {
  enabled: boolean;
  apiKey: string;
  agentId: string;
  gatewayUrl: string;
  mode: "enforce" | "audit" | "bypass";
  auditLevel: "minimal" | "standard" | "verbose";
  cacheTimeoutMs: number;
  failOpen: boolean;
}

export interface PolicyDecision {
  effect: "allow" | "deny" | "approval_required";
  rule?: string;
  ruleDescription?: string;
  alert?: "info" | "warning" | "critical";
  reason?: string;
}

export interface PolicyEvaluationRequest {
  agentId: string;
  action: string;
  resource?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface PolicyEvaluationResponse {
  decision: PolicyDecision;
  evaluationId: string;
  evaluatedAt: string;
  policyVersion?: string;
}

export interface AuditEvent {
  agentId: string;
  action: string;
  resource?: string;
  context?: Record<string, unknown>;
  result: "success" | "failure" | "blocked";
  decision?: PolicyDecision;
  durationMs?: number;
  error?: string;
  timestamp: string;
}

export interface CachedPolicy {
  policy: PolicyEvaluationResponse;
  cachedAt: number;
  expiresAt: number;
}
