# =======================================================
#  FINPASSER MAKEFILE (Router + Uploader + Frontend)
# =======================================================

DOCKER_COMPOSE = docker compose

POSTGRES_CONTAINER = finpasser-postgres-1
MINIO_CONTAINER = finpasser-minio-1
KAFKA_CONTAINER = finpasser-kafka-1

MINIO_ALIAS = local
MINIO_BUCKET = router-inbound
PARENT_POM = pom.xml

FRONTEND_DIR = finpasser-frontend
FRONTEND_E2E_PORT ?= 3000
UPLOAD_ENDPOINT ?= http://localhost:8081/api/upload

.DEFAULT_GOAL := help

# --------------------------------------------
# HELP
# --------------------------------------------
help:
	@echo ""
	@echo " FinPasser - Developer Commands"
	@echo "--------------------------------------------"
	@echo " make up                 - Start ALL services (backend + frontend + DB + Kafka)"
	@echo " make down               - Stop all services"
	@echo " make rebuild            - Rebuild shared events + router + uploader (Docker)"
	@echo " make logs               - Tail all logs"
	@echo " make clean              - Remove containers + volumes"
	@echo ""
	@echo " Backend:"
	@echo " make router-build       - Build router backend"
	@echo " make uploader-build     - Build uploader backend"
	@echo " make shared-events-build- Build shared events jar"
	@echo " make shared-security-build- Build shared security jar"
	@echo " make e2e-full           - Run Playwright E2E test against live stack"
	@echo ""
	@echo " (set RUN_TESTS=1 before any build target above to include tests)"
	@echo ""
	@echo " Frontend:"
	@echo " make frontend-dev       - Start Vite dev server"
	@echo " make frontend-build     - Build Vite frontend"
	@echo " make frontend-docker-build - Build frontend Docker image"
	@echo " make frontend-up        - Start/restart only the frontend container"
	@echo ""
	@echo " Database:"
	@echo " make db-router-reset    - Reset Router DB"
	@echo " make db-uploader-reset  - Reset Uploader DB"
	@echo ""
	@echo " MinIO:"
	@echo " make minio-setup        - Configure mc alias"
	@echo " make minio-clean        - Clear bucket"
	@echo " make minio-reset        - Recreate bucket"
	@echo ""

# --------------------------------------------
# DOCKER LIFECYCLE
# --------------------------------------------
up: ensure-parent
	$(DOCKER_COMPOSE) up --build -d

down:
	$(DOCKER_COMPOSE) down

rebuild: ensure-parent
	$(DOCKER_COMPOSE) down
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running shared-kafka-events build with tests"; \
		mvn -f common/shared-kafka-events/pom.xml clean install; \
	else \
		mvn -f common/shared-kafka-events/pom.xml clean install -DskipTests; \
	fi
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running shared-security build with tests"; \
		mvn -f common/shared-security/pom.xml clean install; \
	else \
		mvn -f common/shared-security/pom.xml clean install -DskipTests; \
	fi
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running router build with tests"; \
		mvn -f router/pom.xml clean install; \
	else \
		mvn -f router/pom.xml clean install -DskipTests; \
	fi
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running uploader build with tests"; \
		mvn -f uploader/pom.xml clean install; \
	else \
		mvn -f uploader/pom.xml clean install -DskipTests; \
	fi
	$(DOCKER_COMPOSE) up --build -d

logs:
	$(DOCKER_COMPOSE) logs -f

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f

# --------------------------------------------
# BACKEND BUILD
# --------------------------------------------
router-build: ensure-parent
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running router build with tests"; \
		mvn -f router/pom.xml clean package; \
	else \
		mvn -f router/pom.xml clean package -DskipTests; \
	fi

uploader-build: ensure-parent
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running uploader build with tests"; \
		mvn -f uploader/pom.xml clean package; \
	else \
		mvn -f uploader/pom.xml clean package -DskipTests; \
	fi

shared-events-build:
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running shared-kafka-events build with tests"; \
		mvn -f common/shared-kafka-events/pom.xml clean package; \
	else \
		mvn -f common/shared-kafka-events/pom.xml clean package -DskipTests; \
	fi

shared-security-build:
	@if [ "$${RUN_TESTS:-0}" = "1" ]; then \
		echo "Running shared-security build with tests"; \
		mvn -f common/shared-security/pom.xml clean package; \
	else \
		mvn -f common/shared-security/pom.xml clean package -DskipTests; \
	fi

# --------------------------------------------
# FRONTEND (finpasser-frontend)
# --------------------------------------------
frontend-dev:
	cd finpasser-frontend && npm install && npm run dev

frontend-build:
	cd finpasser-frontend && npm install && npm run build

frontend-docker-build:
	$(DOCKER_COMPOSE) build frontend

frontend-up: frontend-docker-build
	$(DOCKER_COMPOSE) up -d frontend

e2e-full:
	@bash -c 'set -euo pipefail; \
	STACK_STARTED=0; \
	FRONTEND_PATH="$(CURDIR)/$(FRONTEND_DIR)"; \
	if ! $(DOCKER_COMPOSE) ps --services --filter status=running | grep -q "^uploader$$"; then \
		echo "Starting backend stack via docker compose..."; \
		$(DOCKER_COMPOSE) up --build -d; \
		STACK_STARTED=1; \
	else \
		echo "Backend stack already running, reusing existing containers."; \
	fi; \
	pushd "$$FRONTEND_PATH" >/dev/null; \
	npm install >/dev/null; \
	npx playwright install --with-deps >/dev/null; \
	LOG_FILE=$$(mktemp); \
	echo "Starting Vite dev server on port $(FRONTEND_E2E_PORT)..."; \
	VITE_PORT=$(FRONTEND_E2E_PORT) \
	VITE_UPLOAD_ENDPOINT=$(UPLOAD_ENDPOINT) \
	VITE_KEYCLOAK_URL=http://keycloak:8085 \
	VITE_KEYCLOAK_REALM=finpasser \
	VITE_KEYCLOAK_CLIENT_ID=finpasser-frontend \
	npm run dev -- --host 0.0.0.0 >$$LOG_FILE 2>&1 & \
	DEV_PID=$$!; \
	popd >/dev/null; \
	READY=0; \
	for i in $$(seq 1 30); do \
		if curl -fsS "http://localhost:$(FRONTEND_E2E_PORT)" >/dev/null 2>&1; then READY=1; break; fi; \
		sleep 1; \
	done; \
	if [ $$READY -ne 1 ]; then \
		echo "Vite dev server failed to start; check $$LOG_FILE"; \
		kill $$DEV_PID 2>/dev/null || true; wait $$DEV_PID 2>/dev/null || true; \
		if [ $$STACK_STARTED -eq 1 ]; then $(DOCKER_COMPOSE) down; fi; \
		exit 1; \
	fi; \
	echo "Running Playwright against real backend..."; \
	STATUS=0; \
	pushd "$$FRONTEND_PATH" >/dev/null; \
	PLAYWRIGHT_BASE_URL=http://localhost:$(FRONTEND_E2E_PORT) \
	E2E_REAL_BACKEND=1 \
	UPLOAD_ENDPOINT=$(UPLOAD_ENDPOINT) \
	KEYCLOAK_PUBLIC_URL=http://keycloak:8085 \
	KEYCLOAK_REALM=finpasser \
	KEYCLOAK_CLIENT_ID=finpasser-frontend \
	npm run test:e2e || STATUS=$$?; \
	popd >/dev/null; \
	kill $$DEV_PID 2>/dev/null || true; wait $$DEV_PID 2>/dev/null || true; \
	rm -f $$LOG_FILE; \
	if [ $$STACK_STARTED -eq 1 ]; then \
		echo "Stopping docker compose stack..."; \
		$(DOCKER_COMPOSE) down; \
	fi; \
	exit $$STATUS'

# --------------------------------------------
# DATABASE
# --------------------------------------------
db-router-reset:
	@echo "Resetting routerdb..."
	$(DOCKER_COMPOSE) exec -T postgres psql -U postgres -d routerdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

db-uploader-reset:
	@echo "Resetting uploaderdb..."
	$(DOCKER_COMPOSE) exec -T postgres psql -U postgres -d uploaderdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# --------------------------------------------
# MINIO
# --------------------------------------------
minio-setup:
	$(DOCKER_COMPOSE) exec -T minio mc alias set $(MINIO_ALIAS) http://localhost:9000 minio minio123

minio-clean:
	$(DOCKER_COMPOSE) exec -T minio mc rm --recursive --force $(MINIO_ALIAS)/$(MINIO_BUCKET) || true

minio-reset:
	$(DOCKER_COMPOSE) exec -T minio mc rm --recursive --force $(MINIO_ALIAS)/$(MINIO_BUCKET) || true
	$(DOCKER_COMPOSE) exec -T minio mc rb --force $(MINIO_ALIAS)/$(MINIO_BUCKET) || true
	$(DOCKER_COMPOSE) exec -T minio mc mb $(MINIO_ALIAS)/$(MINIO_BUCKET)

# --------------------------------------------
# INTERNAL UTILS
# --------------------------------------------
.PHONY: ensure-parent
ensure-parent:
	@echo "Ensuring finpasser parent POM is installed..."
	@mvn -f $(PARENT_POM) -N install >/dev/null
