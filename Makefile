.PHONY: preview help

PORT ?= 8000

preview: ## Serve docs/ locally for testing
	@echo "Serving docs/ at http://localhost:$(PORT)"
	@cd docs && python3 -m http.server $(PORT)

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
