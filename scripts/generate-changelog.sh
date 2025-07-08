#!/bin/bash

# SuperClaude Changelog Generator
# Based on gitok changelog system
# Usage: ./scripts/generate-changelog.sh [--release-notes]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "0.0.0")
CURRENT_VERSION=$(echo "$CURRENT_VERSION" | tr -d '\n\r' | xargs)

# Get the last tag, if any
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# If no last tag, use initial commit
if [[ -z "$LAST_TAG" ]]; then
    COMMIT_RANGE=$(git rev-list --max-parents=0 HEAD)..HEAD
    RANGE_DESC="since initial commit"
else
    COMMIT_RANGE="$LAST_TAG..HEAD"
    RANGE_DESC="since $LAST_TAG"
fi

# Get commits
COMMITS=$(git log --oneline --no-merges "$COMMIT_RANGE" 2>/dev/null || echo "")

if [[ -z "$COMMITS" ]]; then
    echo -e "${YELLOW}No new commits found $RANGE_DESC${NC}"
    if [[ "$1" == "--release-notes" ]]; then
        echo "No significant changes in this release."
    fi
    exit 0
fi

# Function to categorize commits
categorize_commits() {
    local commits="$1"
    local features=""
    local improvements=""
    local fixes=""
    local docs=""
    local technical=""
    local breaking=""
    local other=""
    
    while IFS= read -r commit; do
        if [[ -z "$commit" ]]; then continue; fi
        
        # Extract commit hash and message
        hash=$(echo "$commit" | cut -d' ' -f1)
        message=$(echo "$commit" | cut -d' ' -f2-)
        
        # Categorize based on conventional commits and keywords
        if [[ "$message" =~ ^(feat|feature)(\(.+\))?:.*$ ]]; then
            features+="- $message ([${hash}])\n"
        elif [[ "$message" =~ ^(fix|bug)(\(.+\))?:.*$ ]]; then
            fixes+="- $message ([${hash}])\n"
        elif [[ "$message" =~ ^(docs?)(\(.+\))?:.*$ ]]; then
            docs+="- $message ([${hash}])\n"
        elif [[ "$message" =~ ^(chore|refactor|style|test|ci|build|perf)(\(.+\))?:.*$ ]]; then
            technical+="- $message ([${hash}])\n"
        elif [[ "$message" =~ ^(improve|enhance|update|upgrade).*$ ]]; then
            improvements+="- $message ([${hash}])\n"
        elif [[ "$message" =~ ^(BREAKING|breaking).*$ ]]; then
            breaking+="- $message ([${hash}])\n"
        elif [[ "$message" =~ (add|new|implement|create).*$ ]]; then
            features+="- $message ([${hash}])\n"
        elif [[ "$message" =~ (fix|resolve|solve).*$ ]]; then
            fixes+="- $message ([${hash}])\n"
        else
            other+="- $message ([${hash}])\n"
        fi
    done <<< "$commits"
    
    # Return categorized commits
    echo -e "FEATURES\n$features"
    echo -e "IMPROVEMENTS\n$improvements"
    echo -e "FIXES\n$fixes"
    echo -e "DOCS\n$docs"
    echo -e "TECHNICAL\n$technical"
    echo -e "BREAKING\n$breaking"
    echo -e "OTHER\n$other"
}

# Generate release notes format
generate_release_notes() {
    local categories="$1"
    local output=""
    
    # Parse categories
    local in_section=""
    local section_content=""
    
    while IFS= read -r line; do
        if [[ "$line" =~ ^(FEATURES|IMPROVEMENTS|FIXES|DOCS|TECHNICAL|BREAKING|OTHER)$ ]]; then
            # Process previous section
            if [[ -n "$in_section" && -n "$section_content" ]]; then
                case "$in_section" in
                    "FEATURES")
                        output+="## ✨ New Features\n$section_content\n"
                        ;;
                    "IMPROVEMENTS")
                        output+="## 🚀 Improvements\n$section_content\n"
                        ;;
                    "FIXES")
                        output+="## 🐛 Bug Fixes\n$section_content\n"
                        ;;
                    "DOCS")
                        output+="## 📚 Documentation\n$section_content\n"
                        ;;
                    "TECHNICAL")
                        output+="## 🔧 Technical Changes\n$section_content\n"
                        ;;
                    "BREAKING")
                        output+="## ⚠️ Breaking Changes\n$section_content\n"
                        ;;
                    "OTHER")
                        output+="## 📦 Other Changes\n$section_content\n"
                        ;;
                esac
            fi
            
            # Start new section
            in_section="$line"
            section_content=""
        elif [[ "$line" =~ ^-.*$ ]]; then
            section_content+="$line\n"
        fi
    done <<< "$categories"
    
    # Process last section
    if [[ -n "$in_section" && -n "$section_content" ]]; then
        case "$in_section" in
            "FEATURES")
                output+="## ✨ New Features\n$section_content\n"
                ;;
            "IMPROVEMENTS")
                output+="## 🚀 Improvements\n$section_content\n"
                ;;
            "FIXES")
                output+="## 🐛 Bug Fixes\n$section_content\n"
                ;;
            "DOCS")
                output+="## 📚 Documentation\n$section_content\n"
                ;;
            "TECHNICAL")
                output+="## 🔧 Technical Changes\n$section_content\n"
                ;;
            "BREAKING")
                output+="## ⚠️ Breaking Changes\n$section_content\n"
                ;;
            "OTHER")
                output+="## 📦 Other Changes\n$section_content\n"
                ;;
        esac
    fi
    
    echo -e "$output"
}

# Get categorized commits
CATEGORIZED=$(categorize_commits "$COMMITS")

# If --release-notes flag is provided, output release notes format
if [[ "$1" == "--release-notes" ]]; then
    generate_release_notes "$CATEGORIZED"
    exit 0
fi

# Otherwise, update CHANGELOG.md
echo -e "${BLUE}Updating CHANGELOG.md...${NC}"

# Create backup of current changelog
if [[ -f "CHANGELOG.md" ]]; then
    cp CHANGELOG.md CHANGELOG.md.bak
fi

# Generate new changelog entry
CHANGELOG_ENTRY="## [${CURRENT_VERSION}] - $(date +%Y-%m-%d)

$(generate_release_notes "$CATEGORIZED")"

# Create new changelog content
if [[ -f "CHANGELOG.md" ]]; then
    # Read existing changelog
    EXISTING_CHANGELOG=$(cat CHANGELOG.md)
    
    # Find the position after the header
    if [[ "$EXISTING_CHANGELOG" =~ ^(# Changelog.*$) ]]; then
        # Insert new entry after header
        {
            echo "# Changelog"
            echo ""
            echo "All notable changes to this project will be documented in this file."
            echo ""
            echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),"
            echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)."
            echo ""
            echo -e "$CHANGELOG_ENTRY"
            echo ""
            # Add rest of existing changelog (skip header)
            tail -n +7 CHANGELOG.md 2>/dev/null || echo ""
        } > CHANGELOG.md.new
    else
        # Prepend to existing file
        {
            echo -e "$CHANGELOG_ENTRY"
            echo ""
            cat CHANGELOG.md
        } > CHANGELOG.md.new
    fi
    
    mv CHANGELOG.md.new CHANGELOG.md
else
    # Create new changelog
    {
        echo "# Changelog"
        echo ""
        echo "All notable changes to this project will be documented in this file."
        echo ""
        echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),"
        echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)."
        echo ""
        echo -e "$CHANGELOG_ENTRY"
    } > CHANGELOG.md
fi

echo -e "${GREEN}✅ Changelog updated successfully!${NC}"
echo -e "${BLUE}📋 Changes included:${NC}"
echo -e "$(echo "$COMMITS" | wc -l) commits $RANGE_DESC"