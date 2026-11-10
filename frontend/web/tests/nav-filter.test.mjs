import test from 'node:test';
import assert from 'node:assert';
import { ENTERPRISE_NAV_MANIFEST } from '../src/components/navigation/navManifest.ts';
import { filterNavManifest } from '../src/components/navigation/navFilter.ts';

test('Nav Manifest Structure: Contains all 10 standard modules in exact order', () => {
  const expectedModules = [
    'dashboard',
    'orders',
    'production',
    'inventory',
    'quality',
    'delivery',
    'hr',
    'finance',
    'reports',
    'admin',
  ];
  const actualModules = ENTERPRISE_NAV_MANIFEST.map((g) => g.module);
  assert.deepStrictEqual(actualModules, expectedModules, 'Modules must strictly match specified order');
});

test('Owner / Super Admin: Sees all 10 modules with complete child items', () => {
  const ownerUser = {
    id: 'usr-owner-01',
    email: 'owner@lahorefashion.com',
    name: 'Mian Tariq Saigol',
    role: 'owner',
    permissions: ['*'],
  };
  const filtered = filterNavManifest(ENTERPRISE_NAV_MANIFEST, ownerUser, 'owner', 'owner');
  assert.strictEqual(filtered.length, 10, 'Owner must see all 10 top-level module groups');

  const hrGroup = filtered.find((g) => g.module === 'hr');
  assert.ok(hrGroup, 'HR group must be present for owner');
  assert.strictEqual(hrGroup.children.length, 12, 'HR group must contain all 12 child links');

  const prodGroup = filtered.find((g) => g.module === 'production');
  assert.ok(prodGroup, 'Production group must be present for owner');
  assert.strictEqual(prodGroup.children.length, 12, 'Production group must contain all 12 stages + floor entry');
});

test('HR Role / Portal Scoping: Sees ONLY Dashboard and HR group', () => {
  const hrUser = {
    id: 'usr-hr-01',
    email: 'hr@lahorefashion.com',
    name: 'Rabia Siddiqui',
    role: 'hr_manager',
    permissions: ['hr.read', 'hr.write'],
  };
  const filtered = filterNavManifest(ENTERPRISE_NAV_MANIFEST, hrUser, 'hr_manager', 'hr');
  const visibleModules = filtered.map((g) => g.module);
  assert.deepStrictEqual(visibleModules, ['dashboard', 'hr'], 'HR user must see ONLY Dashboard and HR group');
  assert.strictEqual(filtered[1].children.length, 12, 'HR group children must be preserved');
});

test('Empty Groups Dropping: Groups with zero allowed children are omitted', () => {
  const restrictedManifest = [
    {
      id: 'group-orders',
      module: 'orders',
      label: 'Orders',
      icon: 'ShoppingBag',
      children: [
        { id: 'o-1', key: 'o1', label: 'Order 1', route: 'orders', required_permission: 'special.perm' },
      ],
    },
  ];
  const ordinaryUser = {
    id: 'usr-guest',
    email: 'guest@lahorefashion.com',
    name: 'Guest User',
    role: 'worker',
    permissions: ['entry.create'],
  };
  const filtered = filterNavManifest(restrictedManifest, ordinaryUser, 'worker');
  assert.strictEqual(filtered.length, 0, 'Group with no allowed children must be completely omitted');
});
