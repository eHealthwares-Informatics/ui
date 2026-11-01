/**
 * Identity roles config re-exported from the Admin Module shared schema.
 *
 * Both /identity/roles and /rxsoft/roles now use the same shared
 * `rolesConfig` from `@/features/admin/schema/roles`. This file is kept as a
 * backward-compatible re-export so existing imports (e.g. the model registry)
 * continue to resolve.
 */
export { rolesConfig as identityRolesConfig } from '@/features/admin/schema/roles';
