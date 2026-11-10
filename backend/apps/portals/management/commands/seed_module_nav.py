import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.portals.models import Portal, PortalNavItem


class Command(BaseCommand):
    help = "Seed module navigation tree from fixtures/module_nav.json and show tree for roles"

    def add_arguments(self, parser):
        parser.add_arguments = None

    def handle(self, *args, **options):
        # Look for fixture at root or backend
        fixture_path = Path(settings.BASE_DIR).parent / "fixtures" / "module_nav.json"
        if not fixture_path.exists():
            fixture_path = Path(settings.BASE_DIR) / "fixtures" / "module_nav.json"

        if not fixture_path.exists():
            self.stderr.write(self.style.ERROR(f"Fixture file not found: {fixture_path}"))
            return

        with open(fixture_path, "r", encoding="utf-8") as f:
            nav_data = json.load(f)

        self.stdout.write(self.style.SUCCESS(f"Loaded {len(nav_data)} modules from {fixture_path}"))

        # Seed into database for active portals if present
        portals = list(Portal.objects.all())
        if portals:
            for portal in portals:
                for item in nav_data:
                    parent_item = PortalNavItem.objects.filter(
                        portal=portal,
                        module=item["module"],
                        parent=None,
                        route=item.get("route", f"/{item['module']}"),
                    ).first()
                    if not parent_item:
                        parent_item = PortalNavItem.objects.create(
                            portal=portal,
                            module=item["module"],
                            parent=None,
                            label=item["label"],
                            icon=item.get("icon", "Layers"),
                            route=item.get("route", f"/{item['module']}"),
                            order=item.get("order", 0),
                            required_permission=item.get("required_permission", ""),
                        )
                    else:
                        parent_item.label = item["label"]
                        parent_item.icon = item.get("icon", "Layers")
                        parent_item.order = item.get("order", 0)
                        parent_item.required_permission = item.get("required_permission", "")
                        parent_item.save()

                    for tab in item.get("tabs", []):
                        tab_item = PortalNavItem.objects.filter(
                            portal=portal,
                            module=item["module"],
                            route=tab.get("route", ""),
                        ).first()
                        if not tab_item:
                            PortalNavItem.objects.create(
                                portal=portal,
                                module=item["module"],
                                route=tab.get("route", ""),
                                parent=parent_item,
                                label=tab["label"],
                                icon="ChevronRight",
                                order=tab.get("order", 0),
                                required_permission=tab.get("required_permission", ""),
                            )
                        else:
                            tab_item.label = tab["label"]
                            tab_item.parent = parent_item
                            tab_item.order = tab.get("order", 0)
                            tab_item.required_permission = tab.get("required_permission", "")
                            tab_item.save()
            self.stdout.write(self.style.SUCCESS(f"Synced navigation items for {len(portals)} portal(s)."))
        else:
            self.stdout.write("No Portal instances in DB; verified fixture structure.")

        # Show resulting tree for 3 roles: Owner, HR Manager, Store Keeper
        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(self.style.MIGRATE_HEADING("NAVIGATION TREE REPORT FOR 3 ROLES (PROMPT 10)"))
        self.stdout.write("=" * 65 + "\n")

        roles_to_test = [
            ("Owner / Super Admin", ["owner", "super_admin"]),
            ("HR Manager", ["hr_manager"]),
            ("Store Keeper", ["store_keeper"]),
        ]

        for role_name, role_codes in roles_to_test:
            self.stdout.write(self.style.WARNING(f"\n[ROLE]: {role_name}"))
            visible_modules = []
            for mod in nav_data:
                allowed = mod.get("allowed_roles", [])
                if any(r in allowed for r in role_codes) or "owner" in role_codes or "super_admin" in role_codes:
                    visible_modules.append(mod)

            for m in visible_modules:
                self.stdout.write(f"  * {m['label']} OS ({m['route']}) - {m.get('subtitle', '')}")
                tabs = m.get("tabs", [])
                if tabs:
                    tab_names = " | ".join(t["label"] for t in tabs)
                    self.stdout.write(f"     Tabs: {tab_names}")
            self.stdout.write(f"  Total visible modules: {len(visible_modules)}")
