"""
Seed RBAC Matrix — Populates complete Role × Module × Action permission table.
Maintains backward compatibility across accounts.ModulePermission and rbac.RolePermission.
Ensures existing users across all roles (Super Admin, Manager, Finance, Stores, HR, etc.)
retain access to everything they legitimately need.
"""
from __future__ import annotations

from typing import Dict, List, Set
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Role as LegacyRole, ModulePermission as LegacyModulePermission
from apps.rbac.models import Permission, Role as RBACRole, RolePermission


ROLE_MODULE_PERMISSIONS: Dict[str, Dict[str, List[str]]] = {
    # 0. Owner: full enterprise access across all portals, modules and actions
    "owner": {
        "*": ["view", "create", "edit", "delete", "approve", "reject", "export", "print", "lock", "configure"],
    },
    # 1. Super Admin: full access to everything
    "super_admin": {
        "*": ["view", "create", "edit", "delete", "approve", "reject", "export", "print", "lock", "configure"],
    },
    # 2. Branch Admin: operational administration within branch
    "branch_admin": {
        "dashboard": ["view", "export"],
        "branches": ["view"],
        "clients": ["view", "create", "edit"],
        "orders": ["view", "create", "edit", "approve", "export"],
        "production": ["view", "create", "edit", "approve", "export"],
        "inventory": ["view", "create", "edit", "approve", "export"],
        "quality": ["view", "create", "edit", "approve", "export"],
        "labour": ["view", "create", "edit", "export"],
        "attendance": ["view", "create", "edit", "approve", "export"],
        "hr_employee": ["view"],
        "delivery": ["view", "create", "edit", "approve", "export"],
        "finance": ["view", "export"],
        "ledger": ["view", "export"],
        "reports": ["view", "export"],
        "settings": ["view"],
        "print": ["view", "create"],
    },
    # 3. Production Manager: planning, scheduling, floor WIP, lots, line operations
    "production_manager": {
        "dashboard": ["view", "export"],
        "clients": ["view"],
        "orders": ["view", "create", "edit", "approve", "export"],
        "production": ["view", "create", "edit", "delete", "approve", "export", "lock"],
        "planning": ["view", "create", "edit", "approve", "export"],
        "inventory": ["view", "export"],
        "quality": ["view", "export"],
        "labour": ["view", "export"],
        "attendance": ["view"],
        "reports": ["view", "export"],
        "print": ["view", "create"],
    },
    # 4. Accountant / Finance: general ledger, invoices, payments, costing, aging
    "accountant": {
        "dashboard": ["view", "export"],
        "finance": ["view", "create", "edit", "delete", "approve", "export"],
        "ledger": ["view", "create", "edit", "delete", "approve", "export"],
        "costing": ["view", "create", "edit", "approve", "export"],
        "clients": ["view", "create", "edit"],
        "orders": ["view", "export"],
        "payroll": ["view", "approve", "export"],
        "advances": ["view", "create", "edit", "approve", "export"],
        "reports": ["view", "export"],
        "print": ["view", "create"],
    },
    # 5. Store Keeper / Inventory: stock balances, GRN, transfers, issues
    "store_keeper": {
        "dashboard": ["view"],
        "inventory": ["view", "create", "edit", "delete", "approve", "export"],
        "delivery": ["view", "create", "edit", "approve", "export"],
        "orders": ["view"],
        "reports": ["view", "export"],
        "print": ["view", "create"],
    },
    # 6. QC Inspector / Quality: inspections, AQL audits, 4-point fabric tests
    "qc_inspector": {
        "dashboard": ["view"],
        "quality": ["view", "create", "edit", "delete", "approve", "export"],
        "production": ["view"],
        "reports": ["view", "export"],
        "print": ["view", "create"],
    },
    # 7. HR / Labour Manager: employee master, recruitment, payroll, attendance, EOBI/statutory
    "hr_manager": {
        "dashboard": ["view", "export"],
        "hr_employee": ["view", "create", "edit", "delete", "approve", "export"],
        "hr_recruitment": ["view", "create", "edit", "approve", "export"],
        "labour": ["view", "create", "edit", "delete", "approve", "export"],
        "attendance": ["view", "create", "edit", "approve", "export"],
        "leave": ["view", "create", "edit", "approve", "export"],
        "payroll": ["view", "create", "edit", "approve", "export"],
        "advances": ["view", "create", "edit", "approve", "export"],
        "contractors": ["view", "create", "edit", "approve", "export"],
        "performance": ["view", "create", "edit", "approve", "export"],
        "training": ["view", "create", "edit", "approve", "export"],
        "discipline": ["view", "create", "edit", "approve", "export"],
        "separation": ["view", "create", "edit", "approve", "export"],
        "compliance": ["view", "create", "edit", "approve", "export"],
        "reports": ["view", "export"],
        "print": ["view", "create"],
    },
    # 8. Floor Supervisor: line live board, hourly log, section attendance
    "supervisor": {
        "dashboard": ["view"],
        "production": ["view", "create", "edit"],
        "attendance": ["view", "create"],
        "quality": ["view"],
        "inventory": ["view"],
        "print": ["view", "create"],
    },
    # 9. Worker: terminal scanning, attendance punch, piece-rate earnings
    "worker": {
        "dashboard": ["view"],
        "attendance": ["view", "create"],
        "production": ["create"],  # badge scans / bundle completions
    },
}

ALL_MODULES = [
    "dashboard", "orders", "production", "planning", "inventory", "quality",
    "labour", "attendance", "leave", "payroll", "advances", "contractors",
    "hr_employee", "hr_recruitment", "performance", "training", "discipline",
    "separation", "compliance", "finance", "ledger", "costing", "delivery",
    "clients", "branches", "reports", "settings", "audit", "print",
]


class Command(BaseCommand):
    help = "Seeds and synchronizes the full Role × Module permission matrix for both Legacy and Enhanced RBAC."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("[*] Seeding Role × Module permission matrix..."))

        # 1. Ensure atomic permissions exist
        all_actions = ["view", "create", "edit", "delete", "approve", "reject", "export", "print", "lock", "configure"]
        for mod in ALL_MODULES:
            for act in all_actions:
                Permission.objects.get_or_create(
                    module=mod,
                    action=act,
                    scope=Permission.Scope.BRANCH,
                    defaults={"description": f"{act.capitalize()} on {mod}"},
                )
            # Global view/approve for super admin
            Permission.objects.get_or_create(
                module=mod,
                action="view",
                scope=Permission.Scope.ALL,
                defaults={"description": f"Global view on {mod}"},
            )
            Permission.objects.get_or_create(
                module=mod,
                action="approve",
                scope=Permission.Scope.ALL,
                defaults={"description": f"Global approve on {mod}"},
            )

        # 2. Seed permissions per role
        for role_code, mod_dict in ROLE_MODULE_PERMISSIONS.items():
            # Get or create RBAC Role
            rbac_role, _ = RBACRole.objects.get_or_create(
                code=role_code,
                defaults={
                    "name": role_code.replace("_", " ").title(),
                    "hierarchy_level": 1 if role_code in ["super_admin", "owner"] else 50,
                    "is_system_role": True,
                },
            )
            # Get or create Legacy Role
            legacy_role, _ = LegacyRole.objects.get_or_create(
                code=role_code,
                defaults={
                    "name": role_code.replace("_", " ").title(),
                    "is_system_role": True,
                },
            )
            rbac_role.legacy_role = legacy_role
            rbac_role.save(update_fields=["legacy_role"])

            is_super = role_code in ["super_admin", "owner"]

            for mod in ALL_MODULES:
                if is_super:
                    allowed_actions = all_actions
                else:
                    allowed_actions = mod_dict.get(mod, [])

                # Sync RBAC RolePermission
                for act in allowed_actions:
                    perm = Permission.objects.filter(
                        module=mod, action=act, scope=Permission.Scope.BRANCH
                    ).first()
                    if perm:
                        RolePermission.objects.get_or_create(
                            role=rbac_role, permission=perm, defaults={"granted": True}
                        )

                # Sync Legacy ModulePermission
                if hasattr(LegacyModulePermission.Module, mod.upper()):
                    mod_enum = getattr(LegacyModulePermission.Module, mod.upper())
                    LegacyModulePermission.objects.update_or_create(
                        role=legacy_role,
                        module=mod_enum,
                        defaults={
                            "can_view": "view" in allowed_actions or is_super,
                            "can_create": "create" in allowed_actions or is_super,
                            "can_edit": "edit" in allowed_actions or is_super,
                            "can_delete": "delete" in allowed_actions or is_super,
                            "can_approve": "approve" in allowed_actions or is_super,
                            "can_export": "export" in allowed_actions or is_super,
                        },
                    )

        self.stdout.write(self.style.SUCCESS("[OK] Successfully seeded Role × Module permission table for all 9 roles!"))
