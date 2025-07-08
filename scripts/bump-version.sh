#!/bin/bash

# SuperClaude Version Management Script
# Based on gitok versioning system
# Usage: ./scripts/bump-version.sh [major|minor|patch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default version type
VERSION_TYPE=${1:-patch}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Invalid version type. Use 'major', 'minor', or 'patch'${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Get current version from VERSION file
if [[ ! -f "VERSION" ]]; then
    echo -e "${RED}Error: VERSION file not found${NC}"
    exit 1
fi

CURRENT_VERSION=$(cat VERSION | tr -d '\n\r' | xargs)
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Parse version numbers
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Bump version based on type
case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update CLAUDE.md if it contains version references
if [[ -f "CLAUDE.md" ]]; then
    # Update version in CLAUDE.md footer
    sed -i "s/SuperClaude v[0-9]\+\.[0-9]\+\.[0-9]\+/SuperClaude v${NEW_VERSION}/g" CLAUDE.md
    echo -e "${GREEN}Updated version in CLAUDE.md${NC}"
fi

# Generate changelog entry
echo -e "${BLUE}Generating changelog entry...${NC}"
./scripts/generate-changelog.sh

# Commit changes
git add VERSION CLAUDE.md CHANGELOG.md
git commit -m "chore: bump version to ${NEW_VERSION}

- Version updated from ${CURRENT_VERSION} to ${NEW_VERSION}
- Changelog updated with latest changes
- Ready for release

[release]"

# Create tag
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}

$(./scripts/generate-changelog.sh --release-notes)"

echo -e "${GREEN}✅ Version bumped successfully!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "   1. Push changes: ${BLUE}git push origin main --tags${NC}"
echo -e "   2. GitHub Actions will automatically create the release"
echo -e "   3. Or manually trigger release workflow on GitHub"
echo ""
echo -e "${GREEN}🏷️  Tag created: v${NEW_VERSION}${NC}"
echo -e "${GREEN}📦 Ready for release!${NC}"