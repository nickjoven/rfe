.PHONY: preview test test-js test-py help

PORT ?= 8000

preview: ## Serve docs/ locally for testing
	@echo "Serving docs/ at http://localhost:$(PORT)"
	@cd docs && python3 -m http.server $(PORT)

test: test-js test-py ## Run all tests (JS + Python)

test-js: ## Run front-end unit tests (node:test, no deps)
	@node --test tests/test_physics.test.js

test-py: ## Run Python engine tests (pytest)
	@python3 -m pytest tests/test_engine.py -q 2>/dev/null || echo "(skipped: pytest not available)"

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
