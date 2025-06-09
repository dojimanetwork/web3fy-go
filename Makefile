# Variables
BRANCH?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/prod/mainnet/g;s/develop/testnet/g;')
BUILDTAG?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/prod/mainnet/g;s/develop/testnet/g;')
GITREF=$(shell git rev-parse --short HEAD)
VERSION=$(shell bash ./get_next_tag.sh ${INCREMENT_TYPE})
TAG=$(shell date +%Y-%m-%d)
DATE=$(shell date +%Y-%m-%d)

# CI/CD overrides
ifdef CI_COMMIT_BRANCH
	BRANCH=$(shell echo ${CI_COMMIT_BRANCH} | sed 's/prod/mainnet/g')
	BUILDTAG=$(shell echo ${CI_COMMIT_BRANCH} | sed -e 's/prod/mainnet/g;s/develop/testnet/g;s/testnet-multichain/testnet/g')
endif

# Help target
.PHONY: help
help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk -F ':|##' '/^[^\t].+?:.*?##/ { printf "  %-20s %s\n", $$1, $$NF }' $(MAKEFILE_LIST)

# Git operations
.PHONY: pull
pull: ## Git pull repository
	@git clean -idf
	@git pull origin $(shell git rev-parse --abbrev-ref HEAD)

# Environment checks
.PHONY: region-check
region-check: ## Check if REGION environment variable is set
	@if [ -z "${REGION}" ]; then\
		echo "Error: REGION environment variable is required";\
		exit 1;\
	fi

.PHONY: ecr-check
ecr-check: ## Check if GCR or AZURE environment variables are set
	@if [ -z "${GCR}" ] && [ -z "${AZURE}" ]; then\
		echo "Error: Either GCR or AZURE environment variable is required";\
		exit 1;\
	fi

.PHONY: azure-check
azure-check: ## Check if AZURE environment variable is set
	@if [ -z "${AZURE}" ]; then\
		echo "Error: AZURE environment variable is required";\
		exit 1;\
	fi

# Docker operations
.PHONY: docker-push
docker-push: ecr-check ## Push Docker image to GCR
	docker push ${GCR}/${IMAGENAME}:${GITREF}_${VERSION}

.PHONY: azure-push
azure-push: ## Push Docker image to Azure
	docker push ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION}

.PHONY: docker-build
docker-build: ecr-check pull ## Build Docker image for GCR and Azure
	docker build -f ./Dockerfile -t ${GCR}/${IMAGENAME}:${GITREF}_${VERSION} -t ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION} .

.PHONY: azure-build
azure-build: azure-check pull ## Build Docker image for Azure only
	docker build -f ./Dockerfile -t ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION} .

# Release operations
.PHONY: push-tag
push-tag: ## Push git tag
	bash ./push_tag.sh ${VERSION}

.PHONY: release
release: docker-build docker-push push-tag ## Full release process for GCR

.PHONY: azure-release
azure-release: azure-build azure-push ## Full release process for Azure

.PHONY: push-only-image
push-only-image: docker-build docker-push ## Build and push image without tagging

# Debug operations
.PHONY: print-vars
print-vars: ## Print current variable values
	@echo "GITREF=$(GITREF)"
	@echo "VERSION=$(VERSION)"
	@echo "BRANCH=$(BRANCH)"
	@echo "BUILDTAG=$(BUILDTAG)"
	@echo "TAG=$(TAG)"
	@echo "DATE=$(DATE)" 