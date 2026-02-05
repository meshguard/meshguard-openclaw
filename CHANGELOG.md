# Changelog

## 0.2.0 (2026-02-05)

### Breaking Changes
- **Package renamed** from `@meshguard/openclaw` to `@meshguard/meshguard`
  - Fixes plugin installation issue where directory name didn't match plugin ID
  - Update your install command: `openclaw plugins install @meshguard/meshguard`

### Fixed
- Plugin ID mismatch error during installation

## 0.1.3 (2026-02-04)

- Added `openclaw.extensions` field to package.json
- Fixed plugin discovery

## 0.1.0 (2026-02-04)

- Initial release
- Policy enforcement hooks (before/after tool execution)
- Audit logging to MeshGuard cloud
- Configurable modes: enforce, audit, bypass
