HOST ?= 127.0.0.1
PORT ?= 8080
DOCROOT ?= .
PID_FILE ?= .php-server.pid

.PHONY: help check-php serve serve-bg stop test test-e2e test-all install-playwright

help:
	@echo "Available targets:"
	@echo "  make serve      - Run PHP built-in server in foreground"
	@echo "  make serve-bg   - Run PHP built-in server in background"
	@echo "  make stop       - Stop background PHP server"
	@echo "  make test       - Run all unit tests"
	@echo "  make test-e2e   - Run Playwright E2E tests (server auto-started)"
	@echo "  make test-all   - Run unit + E2E tests"
	@echo ""
	@echo "Variables (override like: make serve PORT=9000):"
	@echo "  HOST=$(HOST)"
	@echo "  PORT=$(PORT)"
	@echo "  DOCROOT=$(DOCROOT)"

check-php:
	@command -v php >/dev/null 2>&1 || { \
		echo "php not found in PATH. Install PHP first."; \
		exit 127; \
	}

serve: check-php
	php -S $(HOST):$(PORT) -t $(DOCROOT)

serve-bg: check-php
	@if [ -f "$(PID_FILE)" ] && kill -0 $$(cat "$(PID_FILE)") 2>/dev/null; then \
		echo "PHP server already running (PID $$(cat $(PID_FILE)))."; \
		exit 0; \
	fi
	nohup php -S $(HOST):$(PORT) -t $(DOCROOT) >/tmp/mind-map-maker-php.log 2>&1 & echo $$! > "$(PID_FILE)"
	@echo "Started PHP server on http://$(HOST):$(PORT) (PID $$(cat $(PID_FILE)))."
	@echo "Logs: /tmp/mind-map-maker-php.log"

stop:
	@if [ ! -f "$(PID_FILE)" ]; then \
		echo "No PID file found; server may not be running."; \
		exit 0; \
	fi
	@if kill -0 $$(cat "$(PID_FILE)") 2>/dev/null; then \
		kill $$(cat "$(PID_FILE)"); \
		echo "Stopped PHP server (PID $$(cat $(PID_FILE)))."; \
	else \
		echo "Process in $(PID_FILE) is not running."; \
	fi
	@rm -f "$(PID_FILE)"

test:
	npm test

# Run Playwright E2E tests — PHP server is started automatically via playwright.config.js
test-e2e:
	npm run test:e2e

# Run all tests: unit + E2E
test-all:
	npm run test:all

# Install Playwright browsers (run once after npm install)
install-playwright:
	npx playwright install --with-deps chromium
