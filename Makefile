# ─────────────────────────────────────────────────────────────────────────────
# Lahore Fashion Textile ERP — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help build up down logs shell test migrate seed lint format typecheck clean

# Default shell (Windows-compatible targets use docker compose)
COMPOSE = docker compose
DJANGO  = $(COMPOSE) exec django
MANAGE  = $(DJANGO) python manage.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Docker ────────────────────────────────────────────────────────────────────
build: ## Build all Docker images
	$(COMPOSE) build --no-cache

up: ## Start all services (detached)
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

logs-django: ## Tail Django logs
	$(COMPOSE) logs -f django

logs-celery: ## Tail Celery worker logs
	$(COMPOSE) logs -f celery-worker

ps: ## Show running containers
	$(COMPOSE) ps

# ── Django Management ─────────────────────────────────────────────────────────
shell: ## Open Django shell_plus
	$(MANAGE) shell_plus --ipython

migrate: ## Run all pending migrations
	$(MANAGE) migrate --noinput

makemigrations: ## Create new migrations
	$(MANAGE) makemigrations

collectstatic: ## Collect static files
	$(MANAGE) collectstatic --noinput

createsuperuser: ## Create Django superuser
	$(MANAGE) createsuperuser

seed: ## Seed demo data (matches screenshots)
	$(MANAGE) seed_demo --reset

wait-db: ## Wait for DB to be ready
	$(MANAGE) wait_for_db

# ── Testing ────────────────────────────────────────────────────────────────────
test: ## Run all tests with coverage
	$(DJANGO) pytest --cov=apps --cov-report=term-missing --cov-fail-under=85 -x -v

test-fast: ## Run tests without coverage (fast)
	$(DJANGO) pytest -x -v --no-cov

test-services: ## Run service-layer tests only
	$(DJANGO) pytest apps/*/tests/test_services.py -v

# ── Code Quality ──────────────────────────────────────────────────────────────
lint: ## Run ruff linter
	$(DJANGO) ruff check backend/ --fix

format: ## Run black formatter
	$(DJANGO) black backend/

typecheck: ## Run mypy type checker
	$(DJANGO) mypy backend/ --config-file=pyproject.toml

quality: lint format typecheck ## Run all quality checks

# ── Local dev (without Docker) ─────────────────────────────────────────────────
install-dev: ## Install dev requirements locally
	pip install -r requirements/dev.txt

run-local: ## Run Django dev server locally (needs local .env)
	cd backend && python manage.py runserver 0.0.0.0:8000

# ── Database ──────────────────────────────────────────────────────────────────
dbshell: ## Open PostgreSQL shell
	$(COMPOSE) exec postgres psql -U lfuser -d lahorefashion

dump-db: ## Dump database to file
	$(COMPOSE) exec postgres pg_dump -U lfuser lahorefashion > backup_$(shell date +%Y%m%d_%H%M%S).sql

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean: ## Remove all containers, volumes, and images
	$(COMPOSE) down -v --rmi local

clean-pyc: ## Remove Python cache files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete

# ── Flower (Celery monitor) ───────────────────────────────────────────────────
flower: ## Open Celery Flower monitor at localhost:5555
	$(COMPOSE) exec celery-worker celery -A config.celery_app flower --port=5555

# ── Initial setup ─────────────────────────────────────────────────────────────
setup: ## First-time setup: copy .env, build, migrate, seed
	@cp -n .env.example .env || true
	$(COMPOSE) build
	$(COMPOSE) up -d postgres redis minio
	@sleep 5
	$(MANAGE) migrate --noinput
	$(MANAGE) seed_demo --reset
	@echo "✅ Setup complete. Run 'make up' to start all services."
