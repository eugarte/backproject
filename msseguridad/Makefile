.PHONY: help install build test security lint format clean docker helm deploy

# Colors for output
BLUE:=\033[36m
GREEN:=\033[32m
RED:=\033[31m
YELLOW:=\033[33m
NC:=\033[0m

help: ## Show this help message
	@echo "$(BLUE)msseguridad - Available Commands$(NC)"
	@echo "===================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-25s$(NC) %s\n", $$1, $$2}'

# ═══════════════════════════════════════════════════════════
# DEVELOPMENT
# ═══════════════════════════════════════════════════════════

install: ## Install dependencies
	npm ci

install-dev: ## Install dev dependencies
	npm install
	npx husky install || true

build: ## Build TypeScript
	npm run build

start: ## Start development server
	npm run start:dev

start-prod: ## Start production server
	npm start

# ═══════════════════════════════════════════════════════════
# TESTING
# ═══════════════════════════════════════════════════════════

test: ## Run all tests
	npm test

test-unit: ## Run unit tests
	npm run test:unit

test-integration: ## Run integration tests (requires DB)
	@if [ -z "$(DB_HOST)" ]; then \
		echo "$(YELLOW)⚠️  Warning: Running with default test DB settings$(NC)"; \
	fi
	npm run test:integration

test-e2e: ## Run E2E tests
	npm run test:e2e

test-coverage: ## Run tests with coverage
	npm run test:coverage

test-watch: ## Run tests in watch mode
	npx jest --watch

# ═══════════════════════════════════════════════════════════
# CODE QUALITY
# ═══════════════════════════════════════════════════════════

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

typecheck: ## Run TypeScript type checking
	npm run typecheck

# ═══════════════════════════════════════════════════════════
# SECURITY - SAST + SCA
# ═══════════════════════════════════════════════════════════

security: security-npm security-sast security-secrets ## Run all security scans
	@echo "$(GREEN)✅ All security scans completed$(NC)"

security-npm: ## npm audit - Check dependencies
	@echo "$(BLUE)🔍 Running npm audit...$(NC)"
	npm audit --audit-level=moderate

security-npm-fix: ## npm audit fix
	@echo "$(BLUE)🔧 Fixing npm audit issues...$(NC)"
	npm audit fix

security-sast: semgrep eslint-security ## Run SAST scans

semgrep: ## Semgrep SAST scan
	@echo "$(BLUE)🔍 Running Semgrep...$(NC)"
	@if ! which semgrep > /dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Semgrep not found. Installing...$(NC)"; \
		pip3 install semgrep; \
	fi
	semgrep --config=auto \
		--config=p/security-audit \
		--config=p/owasp-top-ten \
		--config=p/cwe-top-25 \
		--config=p/nodejs \
		--config=p/typescript \
		--config=p/express \
		src/

semgrep-json: ## Semgrep with JSON output
	semgrep --config=auto \
		--config=p/security-audit \
		--json --output=semgrep-report.json \
		src/

eslint-security: ## ESLint with security plugin
	@echo "$(BLUE)🔍 Running ESLint security checks...$(NC)"
	npx eslint src/**/*.ts --ext .ts --plugin security || true

security-secrets: gitleaks ## Scan for secrets

gitleaks: ## GitLeaks secret scan
	@echo "$(BLUE)🔍 Running GitLeaks...$(NC)"
	@if ! which gitleaks > /dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  GitLeaks not found. Install from: https://github.com/gitleaks/gitleaks$(NC)"; \
		exit 1; \
	fi
	gitleaks detect --source . --verbose

gitleaks-protect: ## GitLeaks pre-commit protection
	@if ! which gitleaks > /dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  GitLeaks not found$(NC)"; \
		exit 1; \
	fi
	gitleaks protect --staged --source .

# ═══════════════════════════════════════════════════════════
# SONARQUBE
# ═══════════════════════════════════════════════════════════

sonar: ## Run SonarQube analysis (requires local SonarQube)
	@echo "$(BLUE)🔍 Running SonarQube analysis...$(NC)"
	npx sonar-scanner \
		-Dsonar.projectKey=msseguridad \
		-Dsonar.sources=src \
		-Dsonar.host.url=http://localhost:9000 \
		-Dsonar.login=$(SONAR_TOKEN)

sonar-local: ## Start local SonarQube with Docker
	@echo "$(BLUE)🚀 Starting SonarQube locally...$(NC)"
	docker-compose -f docker-compose.sonarqube.yml up -d
	@echo "$(GREEN)✅ SonarQube available at: http://localhost:9000$(NC)"
	@echo "$(YELLOW)⏳ Wait ~2 minutes for SonarQube to fully start$(NC)"

sonar-stop: ## Stop local SonarQube
	docker-compose -f docker-compose.sonarqube.yml down

# ═══════════════════════════════════════════════════════════
# DOCKER
# ═══════════════════════════════════════════════════════════

docker-build: ## Build Docker image
	docker build -t msseguridad:local .

docker-run: ## Run Docker container locally
	docker run -p 3000:3000 --env-file .env msseguridad:local

docker-scan: docker-build ## Scan Docker image with Trivy
	@echo "$(BLUE)🔍 Scanning Docker image...$(NC)"
	@if ! which trivy > /dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Trivy not found. Install from: https://aquasecurity.github.io/trivy/$(NC)"; \
		exit 1; \
	fi
	trivy image --severity HIGH,CRITICAL msseguridad:local

docker-scan-full: docker-build ## Full Docker scan (all severities)
	trivy image msseguridad:local

docker-push: ## Push Docker image to registry
	docker push $(REGISTRY)/msseguridad:$(TAG)

# ═══════════════════════════════════════════════════════════
# SBOM
# ═══════════════════════════════════════════════════════════

sbom: ## Generate SBOM with Syft
	@echo "$(BLUE)📋 Generating SBOM...$(NC)"
	@if ! which syft > /dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Syft not found. Install from: https://github.com/anchore/syft$(NC)"; \
		exit 1; \
	fi
	syft packages dir:. -o spdx-json > sbom.spdx.json
	syft packages dir:. -o cyclonedx-json > sbom.cyclonedx.json
	@echo "$(GREEN)✅ SBOM generated: sbom.spdx.json, sbom.cyclonedx.json$(NC)"

sbom-docker: docker-build ## Generate SBOM for Docker image
	syft packages docker:msseguridad:local -o spdx-json > sbom-docker.spdx.json

# ═══════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════

db-migrate: ## Run database migrations
	npm run db:migrate

db-migrate-revert: ## Revert last migration
	npm run db:migrate:revert

db-generate: ## Generate new migration
	npm run db:generate

db-seed: ## Seed database
	npm run db:seed

db-reset: ## Reset database (caution!)
	@echo "$(RED)⚠️  This will reset the database!$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ $$confirm = y ] || exit 1
	npm run db:migrate:revert
	npm run db:migrate
	npm run db:seed

# ═══════════════════════════════════════════════════════════
# KUBERNETES / HELM
# ═══════════════════════════════════════════════════════════

helm-deps: ## Update Helm dependencies
	cd k8s/helm && helm dependency update

helm-lint: ## Lint Helm charts
	cd k8s/helm && helm lint .

helm-template: ## Render Helm templates
	cd k8s/helm && helm template msseguridad . -f values-staging.yaml

deploy-staging: ## Deploy to staging with Helm
	cd k8s/helm && helm upgrade --install msseguridad . \
		-f values-staging.yaml \
		--namespace staging \
		--create-namespace \
		--wait \
		--timeout 5m

deploy-production: ## Deploy to production with Helm
	@echo "$(RED)⚠️  Deploying to PRODUCTION$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ $$confirm = y ] || exit 1
	cd k8s/helm && helm upgrade --install msseguridad . \
		-f values-production.yaml \
		--namespace production \
		--create-namespace \
		--wait \
		--timeout 10m

k8s-secrets: ## Create Kubernetes secrets template
	@echo "$(BLUE)🔐 Creating Kubernetes secrets...$(NC)"
	@kubectl create secret generic msseguridad-db-credentials \
		--from-literal=host=mysql \
		--from-literal=database=msseguridad \
		--from-literal=username=msseguridad \
		--from-literal=password=$${DB_PASSWORD:-changeme} \
		--dry-run=client -o yaml

# ═══════════════════════════════════════════════════════════
# CI/CD SIMULATION
# ═══════════════════════════════════════════════════════════

ci-local: lint typecheck test security ## Simulate local CI pipeline
	@echo "$(GREEN)✅ Local CI pipeline completed successfully$(NC)"

ci-full: clean install lint typecheck test-coverage security sonar docker-scan sbom ## Full CI simulation
	@echo "$(GREEN)✅ Full CI pipeline completed successfully$(NC)"

# ═══════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════

clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf coverage/
	rm -rf node_modules/
	rm -f *.log
	rm -f semgrep-report.json
	rm -f snyk-report.json
	rm -f npm-audit-report.json
	rm -f sbom.*.json

clean-docker: ## Clean Docker images
	docker rmi msseguridad:local 2>/dev/null || true

docker-compose-down: ## Stop all Docker services
	docker-compose down -v

# ═══════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════

generate-keys: ## Generate JWT keys
	mkdir -p keys
	openssl genrsa -out keys/private.pem 2048
	openssl rsa -in keys/private.pem -pubout -out keys/public.pem
	chmod 600 keys/private.pem
	@echo "$(GREEN)✅ JWT keys generated in keys/ directory$(NC)"

logs: ## View application logs
	tail -f logs/app.log

health: ## Check application health
	@curl -s http://localhost:3000/health/live | jq . || echo "$(RED)❌ Health check failed$(NC)"

metrics: ## View Prometheus metrics
	@curl -s http://localhost:3000/metrics

# Variables
REGISTRY?=ghcr.io/eugarte
TAG?=latest
DB_HOST?=localhost
DB_PASSWORD?=changeme
SONAR_TOKEN?=admin
