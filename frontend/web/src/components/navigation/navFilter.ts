import type { User, RoleCode, PortalSlug } from '../../types';
import { ENTERPRISE_NAV_MANIFEST } from './navManifest.ts';
import type { NavGroupConfig, NavChildConfig } from './navManifest.ts';

export interface FilteredNavGroup {
  id: string;
  module: string;
  label: string;
  label_ur?: string;
  icon: string;
  route?: string;
  badge?: string;
  isSingleChild?: boolean;
  children: NavChildConfig[];
}

/**
 * Filter enterprise navigation manifest according to current user credentials,
 * active role, active portal, and explicit permissions.
 */
export function filterNavManifest(
  manifest: NavGroupConfig[] = ENTERPRISE_NAV_MANIFEST,
  user: User | null,
  activeRole: RoleCode,
  activePortal?: PortalSlug
): FilteredNavGroup[] {
  const isSuperUser = user?.role === 'owner' || user?.role === 'super_admin';
  const userPermissions = user?.permissions || ['*'];
  const hasWildcard = isSuperUser || userPermissions.includes('*');

  // Strict portal scoping: HR role/portal sees ONLY Dashboard + HR group
  const isHrScoped = activeRole === 'hr_manager' || activePortal === 'hr';
  const isFinanceScoped = activeRole === 'accountant' || activePortal === 'finance';
  const isStoreScoped = activeRole === 'store_keeper' || activePortal === 'stores';
  const isQcScoped = activeRole === 'qc_inspector' || activePortal === 'qc';
  const isFloorScoped = activeRole === 'supervisor' || activeRole === 'worker' || activePortal === 'floor' || activePortal === 'kiosk';

  const result: FilteredNavGroup[] = [];

  for (const group of manifest) {
    // 1. Dashboard is always visible to everyone
    if (group.module === 'dashboard') {
      result.push({
        ...group,
        children: [],
      });
      continue;
    }

    // 2. Strict portal checks
    if (!isSuperUser) {
      if (isHrScoped && group.module !== 'hr') continue;
      if (isFinanceScoped && group.module !== 'finance' && group.module !== 'reports') continue;
      if (isStoreScoped && group.module !== 'inventory' && group.module !== 'delivery') continue;
      if (isQcScoped && group.module !== 'quality') continue;
      if (isFloorScoped && group.module !== 'production') continue;

      if (group.allowed_roles && !group.allowed_roles.includes(activeRole)) {
        continue;
      }
    }

    // 3. Filter children by role and permission
    const allowedChildren: NavChildConfig[] = [];
    if (group.children && group.children.length > 0) {
      for (const child of group.children) {
        if (!isSuperUser) {
          // Check child-level required permission
          if (child.required_permission && !hasWildcard) {
            if (!userPermissions.includes(child.required_permission)) {
              continue;
            }
          }
          if (child.allowed_roles && !child.allowed_roles.includes(activeRole)) {
            continue;
          }
        }
        allowedChildren.push(child);
      }
    }

    // 4. Drop group if it has no allowed children and is not a standalone route
    if (!group.route && allowedChildren.length === 0) {
      continue;
    }

    result.push({
      id: group.id,
      module: group.module,
      label: group.label,
      label_ur: group.label_ur,
      icon: group.icon,
      route: group.route,
      badge: group.badge,
      isSingleChild: allowedChildren.length === 1,
      children: allowedChildren,
    });
  }

  return result;
}
