#!/bin/bash

# Script to create and push a new git tag
# Usage: ./push_tag.sh <version>

# Check if version is provided
if [ -z "$1" ]; then
    echo "Error: Version not provided"
    echo "Usage: $0 <version>"
    exit 1
fi

VERSION=$1

# Validate version format (basic check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format '$VERSION'. Expected format: X.Y.Z"
    exit 1
fi

# Check if tag already exists
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    echo "Error: Tag v$VERSION already exists"
    exit 1
fi

# Create annotated tag
echo "Creating tag v$VERSION..."
if ! git tag -a "v$VERSION" -m "Release version $VERSION"; then
    echo "Error: Failed to create tag"
    exit 1
fi

# Push tag to remote
echo "Pushing tag v$VERSION to remote..."
if ! git push origin "v$VERSION"; then
    echo "Error: Failed to push tag to remote"
    echo "Tag was created locally. You can manually push it later with:"
    echo "  git push origin v$VERSION"
    exit 1
fi

echo "Successfully created and pushed tag v$VERSION"