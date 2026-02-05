# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-04

### Added

- Initial release of MeshGuard OpenClaw extension
- `before_tool_call` hook for policy enforcement
- `after_tool_call` hook for audit logging
- Policy evaluation with local caching
- Batched audit event submission
- Support for enforce, audit, and bypass modes
- Automatic sensitive data redaction
- Configurable fail-open/fail-closed behavior

### Configuration

- `apiKey`: MeshGuard API key (required)
- `agentId`: MeshGuard agent ID (required)
- `gatewayUrl`: MeshGuard gateway URL (default: https://dashboard.meshguard.app)
- `mode`: Governance mode - enforce, audit, or bypass (default: enforce)
- `auditLevel`: Log verbosity - minimal, standard, or verbose (default: standard)
- `cacheTimeoutMs`: Policy cache duration in ms (default: 60000)
- `failOpen`: Allow actions when MeshGuard is unreachable (default: false)
