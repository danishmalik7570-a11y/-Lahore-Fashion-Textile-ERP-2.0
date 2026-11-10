import type { RoleCode } from '../types';

/**
 * Enterprise RBAC helper for checking resource and action-level permissions.
 * Follows principle of least privilege and strict role-based access control.
 */
export const ROLE_PERMISSIONS: Record<RoleCode, Record<string, string[]>> = {
  owner: {
    '*': ['*'],
    entry: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    production: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    floor: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  super_admin: {
    '*': ['*'],
    entry: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    production: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    floor: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  production_manager: {
    entry: ['view', 'create', 'edit', 'approve', 'export'],
    production: ['view', 'create', 'edit', 'approve', 'export'],
    floor: ['view', 'create', 'edit', 'approve', 'export'],
    orders: ['view', 'export'],
    inventory: ['view', 'create', 'edit', 'export'],
    quality: ['view', 'create', 'edit', 'approve', 'export'],
  },
  supervisor: {
    entry: ['view', 'create', 'edit'],
    floor: ['view', 'create', 'edit'],
    production: ['view', 'create'],
    quality: ['view', 'create'],
    labour: ['view'],
  },
  worker: {
    entry: ['view', 'create'],
    floor: ['view', 'create'],
    production: ['view'],
    labour: ['view'],
  },
  accountant: {
    entry: ['view'],
    finance: ['view', 'create', 'edit', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'approve', 'export'],
  },
  store_keeper: {
    entry: ['view'],
    inventory: ['view', 'create', 'edit', 'export'],
    production: ['view'],
  },
  qc_inspector: {
    entry: ['view'],
    quality: ['view', 'create', 'edit', 'approve', 'export'],
    production: ['view'],
  },
  hr_manager: {
    entry: ['view'],
    labour: ['view', 'create', 'edit', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'approve', 'export'],
  },
  branch_admin: {
    entry: ['view', 'create', 'edit', 'approve', 'export'],
    production: ['view', 'create', 'edit', 'approve', 'export'],
    floor: ['view', 'create', 'edit', 'approve', 'export'],
  },
};

/**
 * Checks if a user with a given role has permission to perform an action on a resource.
 * Example: hasPermission('supervisor', 'entry', 'create') -> true
 *          hasPermission('accountant', 'entry', 'create') -> false
 */
export function hasPermission(
  role: RoleCode | undefined | null,
  resource: string,
  action: string
): boolean {
  if (!role) return false;
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  // Wildcard admin check
  if (rolePerms['*']?.includes('*') || rolePerms['*']?.includes(action)) {
    return true;
  }

  const resourceActions = rolePerms[resource];
  if (!resourceActions) return false;

  return resourceActions.includes('*') || resourceActions.includes(action);
}

/**
 * Helper specifically for floor data entry creation permission (entry.create).
 */
export function canCreateFloorEntry(role: RoleCode | undefined | null): boolean {
  return hasPermission(role, 'entry', 'create');
}
