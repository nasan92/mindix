HOST ?= 127.0.0.1
PORT ?= 8080
DOCROOT ?= .
PID_FILE ?= .php-server.pid

.PHONY: help check-php serve serve-bg stop test-svg-export test test-e2e test-all install-playwright

help:
	@echo "Available targets:"
	@echo "  make serve      - Run PHP built-in server in foreground"
	@echo "  make serve-bg   - Run PHP built-in server in background"
	@echo "  make stop       - Stop background PHP server"
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

test-svg-export:
	node tests/export-map-svg.test.js

# Run all Node.js unit tests (no server required)
test:
	node tests/export-map-svg.test.js
	node tests/undo-manager.test.js
	node tests/import-markdown.test.js
	node tests/export-markdown.test.js
	node tests/node-map.test.js
	@echo ""
	@echo "All unit tests passed."

# Run Playwright E2E tests (requires: make serve-bg first)
test-e2e:
	npx playwright test

# Run all tests: unit + E2E (requires: make serve-bg first)
test-all: test test-e2e

# Install Playwright browsers (run once after npm install)
install-playwright:
	npx playwright install --with-deps chromium
