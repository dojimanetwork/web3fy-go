# Variables
BRANCH?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/master/mainnet/g;s/develop/testnet/g;')
BUILDTAG?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/master/mainnet/g;s/develop/testnet/g;')
GITREF=$(shell git rev-parse --short HEAD)

# pull branch name from CI, if available
ifdef CI_COMMIT_BRANCH
	BRANCH=$(shell echo ${CI_COMMIT_BRANCH} | sed 's/prod/mainnet/g')
	BUILDTAG=$(shell echo ${CI_COMMIT_BRANCH} | sed -e 's/prod/mainnet/g;s/develop/testnet/g;s/testnet-multichain/testnet/g')
endif

# Default to patch version increment if not specified
INCREMENT_TYPE ?= patch

# Ensure get_next_tag.sh is executable
$(shell chmod +x ./get_next_tag.sh)

# Get version with fallback
VERSION=$(shell ./get_next_tag.sh ${INCREMENT_TYPE} 2>/dev/null || echo "0.0.1")
TAG=$(shell date +%Y-%m-%d)
DATE=$(shell date +%Y-%m-%d)

# Environment variables
export OPENAI_API_KEY ?= $(shell echo $$OPENAI_API_KEY)
export NODE_ENV ?= production

# Image name and tag
IMAGENAME ?= web3fygo
IMAGETAG ?= ${GITREF}_${VERSION}

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
	@echo "Pulling latest changes..."
	@if ! git fetch --tags 2>/dev/null; then\
		echo "Warning: Could not fetch tags. Using local tags only.";\
	fi
	@if ! git pull origin $(shell git rev-parse --abbrev-ref HEAD) 2>/dev/null; then\
		echo "Warning: Could not pull changes. Using local changes only.";\
	fi

# Environment checks
.PHONY: region-check
region-check: ## Check if REGION environment variable is set
	@if [ -z "${REGION}" ]; then\
        	echo "Error: REGION environment variable is not set";\
        	exit 1;\
    fi

.PHONY: ecr-check
ecr-check: ## Check if GCR or AZURE environment variables are set
	@if [ -z "${GCR}" ] && [ -z "${AZURE}"]; then\
    		echo "Error: Neither GCR nor AZURE registry is set";\
    		echo "Please set either GCR or AZURE environment variable";\
    		exit 1;\
    fi

.PHONY: azure-check
azure-check: ## Check if AZURE environment variable is set
	@if [ -z "${AZURE}"]; then\
		echo "Error: AZURE registry is not set";\
		echo "Please set the AZURE environment variable";\
		exit 1;\
	fi

# Docker operations
.PHONY: docker-push
docker-push: ecr-check ## Push Docker image to GCR
	@if [ -n "${GCR}" ]; then\
		echo "Pushing to GCR: ${GCR}/${IMAGENAME}:${IMAGETAG}";\
		docker push ${GCR}/${IMAGENAME}:${IMAGETAG};\
	fi

.PHONY: azure-push
azure-push: ## Push Docker image to Azure
	@if [ -n "${AZURE}" ]; then\
		echo "Pushing to Azure: ${AZURE}/${IMAGENAME}:${IMAGETAG}";\
		docker push ${AZURE}/${IMAGENAME}:${IMAGETAG};\
	fi

.PHONY: docker-build
docker-build: ecr-check pull ## Build Docker image for GCR and Azure
	@echo "Building Docker image..."
	@echo "Image name: ${IMAGENAME}"
	@echo "Image tag: ${IMAGETAG}"
	@echo "Version: ${VERSION}"
	@echo "GCR: ${GCR}"
	@echo "AZURE: ${AZURE}"
	@if [ -n "${GCR}" ] && [ -n "${AZURE}" ]; then\
		docker build --no-cache \
			--build-arg OPENAI_API_KEY=${OPENAI_API_KEY} \
			-f ./Dockerfile \
			-t ${GCR}/${IMAGENAME}:${IMAGETAG} \
			-t ${AZURE}/${IMAGENAME}:${IMAGETAG} .;\
	elif [ -n "${GCR}" ]; then\
		docker build --no-cache \
			--build-arg OPENAI_API_KEY=${OPENAI_API_KEY} \
			-f ./Dockerfile \
			-t ${GCR}/${IMAGENAME}:${IMAGETAG} .;\
	elif [ -n "${AZURE}" ]; then\
		docker build --no-cache \
			--build-arg OPENAI_API_KEY=${OPENAI_API_KEY} \
			-f ./Dockerfile \
			-t ${AZURE}/${IMAGENAME}:${IMAGETAG} .;\
	else\
		echo "Error: Neither GCR nor AZURE registry is set";\
		exit 1;\
	fi

.PHONY: azure-build
azure-build: azure-check pull ## Build Docker image for Azure only
	@echo "Building Docker image for Azure..."
	@echo "Image name: ${IMAGENAME}"
	@echo "Image tag: ${IMAGETAG}"
	@echo "Version: ${VERSION}"
	@echo "AZURE: ${AZURE}"
	docker build --no-cache \
		--build-arg OPENAI_API_KEY=${OPENAI_API_KEY} \
		-f ./Dockerfile \
		-t ${AZURE}/${IMAGENAME}:${IMAGETAG} .

# Release operations
.PHONY: push-tag
push-tag: ## Push git tag
	@echo "Pushing new tag: ${VERSION}"
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
	@echo "IMAGETAG=$(IMAGETAG)"
	@echo "OPENAI_API_KEY=$(if $(OPENAI_API_KEY),set,not set)"
	@echo "NODE_ENV=$(NODE_ENV)"
	@echo "GCR=$(GCR)"
	@echo "AZURE=$(AZURE)"
	@echo "INCREMENT_TYPE=$(INCREMENT_TYPE)" 