#!/bin/bash

# Script to get the next version tag based on increment type
# Usage: ./get_next_tag.sh [patch|minor|major]

INCREMENT_TYPE=${1:-patch}

# Function to get the latest git tag
get_latest_tag() {
    # Try to get the latest tag from git
    local latest_tag=$(git describe --tags --abbrev=0 2>/dev/null)
    
    # If no tags exist, start with 0.0.0
    if [ -z "$latest_tag" ]; then
        echo "0.0.0"
    else
        echo "$latest_tag"
    fi
}

# Function to increment version
increment_version() {
    local version=$1
    local increment_type=$2

    # Remove 'v' prefix if it exists
    version=${version#v}

    # Split version into parts
    IFS='.' read -ra VERSION_PARTS <<< "$version"
    
    # Ensure we have 3 parts (major.minor.patch)
    major=${VERSION_PARTS[0]:-0}
    minor=${VERSION_PARTS[1]:-0}
    patch=${VERSION_PARTS[2]:-0}
    
    # Increment based on type
    case $increment_type in
    major)
            major=$((major + 1))
        minor=0
        patch=0
        ;;
    minor)
            minor=$((minor + 1))
        patch=0
        ;;
        patch|*)
            patch=$((patch + 1))
        ;;
esac

    echo "${major}.${minor}.${patch}"
}

# Main logic
latest_tag=$(get_latest_tag)
next_version=$(increment_version "$latest_tag" "$INCREMENT_TYPE")

echo "$next_version" 