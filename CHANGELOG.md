# Changelog

## 0.5.0 (2026-02-05)

### Changed
- **Config now optional by default**: `enabled` defaults to `false`
- `apiKey` and `agentId` only required when `enabled: true`
- Allows global plugin installation without requiring config for every agent
- Per-agent config in workspace `openclaw.json` enables governance selectively

### Fixed
- Plugin no longer fails validation when installed but not configured

## 0.4.0 (2026-02-05)

### Fixed
- Hook registration now uses `api.on()` instead of `api.registerHook()`
- All auditing moved to `before_tool_call` (workaround for OpenClaw hook bug)

## 0.3.0 (2026-02-05)

### Breaking Changes
- **Package renamed** to `meshguard-openclaw`
  - Clear naming: MeshGuard extension for OpenClaw
  - Install: `openclaw plugins install meshguard-openclaw`

## 0.2.0 (2026-02-05)

- Attempted rename to `@meshguard/meshguard` (superseded)

## 0.1.3 (2026-02-04)

- Added `openclaw.extensions` field to package.json

## 0.1.0 (2026-02-04)

- Initial release
- Policy enforcement hooks
- Audit logging to MeshGuard cloud
