"""
Management command: wait_for_db
Retries DB connection until it's available (used in Docker entrypoint).
"""
import time
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "Wait for the database to be available before proceeding."

    def add_arguments(self, parser):
        parser.add_argument("--timeout", type=int, default=60, help="Max wait seconds")
        parser.add_argument("--interval", type=float, default=2.0, help="Retry interval seconds")

    def handle(self, *args, **options):
        timeout = options["timeout"]
        interval = options["interval"]
        elapsed = 0
        self.stdout.write("⏳ Waiting for database...")
        while elapsed < timeout:
            try:
                conn = connections["default"]
                conn.ensure_connection()
                self.stdout.write(self.style.SUCCESS("✅ Database is ready."))
                return
            except OperationalError:
                self.stdout.write(f"   DB not ready — retrying in {interval}s... ({elapsed}s elapsed)")
                time.sleep(interval)
                elapsed += interval

        self.stderr.write(self.style.ERROR(f"❌ Database not available after {timeout}s. Exiting."))
        raise SystemExit(1)
