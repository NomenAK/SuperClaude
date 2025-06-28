#!/bin/bash

# SuperClaude Orchestrator Installer
# Adds natural language orchestration layer to SuperClaude
# Version: 1.0.0
# License: MIT
# Repository: https://github.com/loic/SuperClaudeOrchestrator

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Script version
readonly SCRIPT_VERSION="1.0.0"
readonly ORCHESTRATOR_VERSION="1.0.0"

# Constants
readonly REQUIRED_SPACE_KB=10240  # 10MB in KB
readonly MIN_BASH_VERSION=3

# Colors for output
if [[ -t 1 ]] && [[ "$(tput colors 2>/dev/null)" -ge 8 ]]; then
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly RED='\033[0;31m'
    readonly BLUE='\033[0;34m'
    readonly NC='\033[0m' # No Color
else
    readonly GREEN=''
    readonly YELLOW=''
    readonly RED=''
    readonly BLUE=''
    readonly NC=''
fi

# Orchestrator files
readonly -a ORCHESTRATOR_FILES=(
    "README.md"
    "ORCHESTRATOR.md"
    "COMMAND_MAPPING.md"
    "FLAG_COMBINATIONS.md"
    "PERSONA_GUIDE.md"
    "WORKFLOW_TEMPLATES.md"
    "INTEGRATION_GUIDE.md"
    "FILE_OVERVIEW.md"
)

# Default settings
SUPERCLAUDE_DIR="$HOME/.claude"
FORCE_INSTALL=false
UPDATE_MODE=false
UNINSTALL_MODE=false
VERBOSE=false
DRY_RUN=false

# Function: show_usage
show_usage() {
    echo "SuperClaude Orchestrator Installer v$SCRIPT_VERSION"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --claude-dir <dir>   SuperClaude installation directory (default: $HOME/.claude)"
    echo "  --force              Skip confirmation prompts"
    echo "  --update             Update existing orchestrator installation"
    echo "  --uninstall          Remove orchestrator from SuperClaude"
    echo "  --verbose            Show detailed output"
    echo "  --dry-run            Preview changes without making them"
    echo "  --version            Show version information"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                              # Install to default SuperClaude location"
    echo "  $0 --claude-dir /opt/claude     # Install to custom SuperClaude location"
    echo "  $0 --update                     # Update existing orchestrator"
    echo "  $0 --uninstall                  # Remove orchestrator"
    echo ""
    echo "Note: This installer adds orchestration capabilities to an existing SuperClaude installation."
}

# Function: log_verbose
log_verbose() {
    if [[ "$VERBOSE" = true ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1" >&2
    fi
}

# Function: log_error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function: check_superclaude_installation
check_superclaude_installation() {
    local claude_dir="$1"
    
    if [[ ! -d "$claude_dir" ]]; then
        log_error "SuperClaude not found at $claude_dir"
        echo ""
        echo "Please install SuperClaude first using:"
        echo "  git clone https://github.com/NomenAK/SuperClaude.git"
        echo "  cd SuperClaude && ./install.sh"
        return 1
    fi
    
    # Check for essential SuperClaude files
    if [[ ! -f "$claude_dir/CLAUDE.md" ]]; then
        log_error "Invalid SuperClaude installation: CLAUDE.md not found"
        return 1
    fi
    
    if [[ ! -d "$claude_dir/commands" ]]; then
        log_error "Invalid SuperClaude installation: commands directory not found"
        return 1
    fi
    
    log_verbose "Valid SuperClaude installation found at $claude_dir"
    return 0
}

# Function: check_orchestrator_files
check_orchestrator_files() {
    local missing_files=()
    local orchestrator_source=".claude/orchestrator"
    
    # Check if we're in the SuperClaude repo with orchestrator files
    if [[ -d "$orchestrator_source" ]]; then
        # Check in .claude/orchestrator/ directory
        for file in "${ORCHESTRATOR_FILES[@]}"; do
            if [[ ! -f "$orchestrator_source/$file" ]]; then
                missing_files+=("$file")
            fi
        done
    else
        # Fallback: check in current directory (for standalone orchestrator)
        for file in "${ORCHESTRATOR_FILES[@]}"; do
            if [[ ! -f "$file" ]]; then
                missing_files+=("$file")
            fi
        done
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing orchestrator files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        echo ""
        echo "Please ensure orchestrator files are in .claude/orchestrator/"
        echo "or run this script from the orchestrator directory."
        return 1
    fi
    
    return 0
}

# Function: install_orchestrator
install_orchestrator() {
    local claude_dir="$1"
    local orchestrator_dir="$claude_dir/orchestrator"
    local orchestrator_source=".claude/orchestrator"
    
    echo "Installing SuperClaude Orchestrator..."
    
    # Determine source directory
    local source_dir=""
    if [[ -d "$orchestrator_source" ]]; then
        # We're in SuperClaude repo with orchestrator files
        source_dir="$orchestrator_source"
    else
        # Standalone orchestrator directory
        source_dir="."
    fi
    
    # Create orchestrator directory
    if [[ "$DRY_RUN" = true ]]; then
        echo "Would create directory: $orchestrator_dir"
    else
        mkdir -p "$orchestrator_dir"
        log_verbose "Created directory: $orchestrator_dir"
    fi
    
    # Copy orchestrator files
    local copied=0
    for file in "${ORCHESTRATOR_FILES[@]}"; do
        local src_file="$source_dir/$file"
        if [[ "$DRY_RUN" = true ]]; then
            echo "Would copy: $src_file -> $orchestrator_dir/$file"
        else
            if cp "$src_file" "$orchestrator_dir/$file"; then
                log_verbose "Copied: $file"
                ((copied++))
            else
                log_error "Failed to copy: $file"
            fi
        fi
    done
    
    if [[ "$DRY_RUN" != true ]]; then
        echo "Copied $copied/${#ORCHESTRATOR_FILES[@]} files"
    fi
    
    # Update CLAUDE.md to include orchestrator reference
    if [[ "$DRY_RUN" = true ]]; then
        echo "Would update: $claude_dir/CLAUDE.md"
    else
        if ! grep -q "orchestrator" "$claude_dir/CLAUDE.md"; then
            # Backup CLAUDE.md
            cp "$claude_dir/CLAUDE.md" "$claude_dir/CLAUDE.md.backup"
            
            # Add orchestrator section
            cat >> "$claude_dir/CLAUDE.md" << 'EOF'

## Orchestrator Integration

This installation includes the SuperClaude Orchestrator for natural language command translation.
The orchestrator files are located in the orchestrator/ directory.

To use the orchestrator:
1. Reference orchestrator/ORCHESTRATOR.md for natural language processing
2. Say "Use the orchestrator to translate my request" in Claude Code
3. Make requests in plain English instead of memorizing commands

Example: "Review my code for security issues" → `/review --security --evidence --persona-security`

See orchestrator/README.md for more information.
EOF
            echo "Updated CLAUDE.md with orchestrator reference"
        else
            echo "CLAUDE.md already contains orchestrator reference"
        fi
    fi
    
    # Create version file
    if [[ "$DRY_RUN" != true ]]; then
        echo "$ORCHESTRATOR_VERSION" > "$orchestrator_dir/VERSION"
    fi
    
    return 0
}

# Function: uninstall_orchestrator
uninstall_orchestrator() {
    local claude_dir="$1"
    local orchestrator_dir="$claude_dir/orchestrator"
    
    echo "Uninstalling SuperClaude Orchestrator..."
    
    if [[ ! -d "$orchestrator_dir" ]]; then
        log_error "Orchestrator not found at $orchestrator_dir"
        return 1
    fi
    
    # Remove orchestrator directory
    if [[ "$DRY_RUN" = true ]]; then
        echo "Would remove directory: $orchestrator_dir"
    else
        rm -rf "$orchestrator_dir"
        echo "Removed orchestrator directory"
    fi
    
    # Restore original CLAUDE.md if backup exists
    if [[ -f "$claude_dir/CLAUDE.md.backup" ]]; then
        if [[ "$DRY_RUN" = true ]]; then
            echo "Would restore: $claude_dir/CLAUDE.md from backup"
        else
            mv "$claude_dir/CLAUDE.md.backup" "$claude_dir/CLAUDE.md"
            echo "Restored original CLAUDE.md"
        fi
    fi
    
    return 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --claude-dir)
            if [[ -z "$2" ]] || [[ "$2" == --* ]]; then
                log_error "--claude-dir requires a directory argument"
                exit 1
            fi
            SUPERCLAUDE_DIR="$2"
            shift 2
            ;;
        --force)
            FORCE_INSTALL=true
            shift
            ;;
        --update)
            UPDATE_MODE=true
            shift
            ;;
        --uninstall)
            UNINSTALL_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --version)
            echo "SuperClaude Orchestrator Installer v$SCRIPT_VERSION"
            echo "Orchestrator Version: $ORCHESTRATOR_VERSION"
            exit 0
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${GREEN}SuperClaude Orchestrator Installer${NC}"
echo "===================================="
echo -e "Target directory: ${YELLOW}$SUPERCLAUDE_DIR${NC}"
if [[ "$DRY_RUN" = true ]]; then
    echo -e "${BLUE}Mode: DRY RUN (no changes will be made)${NC}"
fi
echo ""

# Check SuperClaude installation
if ! check_superclaude_installation "$SUPERCLAUDE_DIR"; then
    exit 1
fi

# Check orchestrator files (unless uninstalling)
if [[ "$UNINSTALL_MODE" != true ]]; then
    if ! check_orchestrator_files; then
        exit 1
    fi
fi

# Handle different modes
if [[ "$UNINSTALL_MODE" = true ]]; then
    # Uninstall mode
    if [[ "$FORCE_INSTALL" != true ]]; then
        echo -e "${YELLOW}This will remove the orchestrator from SuperClaude${NC}"
        echo -n "Are you sure? (y/n): "
        read -r confirm
        if [[ "$confirm" != "y" ]]; then
            echo "Uninstall cancelled."
            exit 0
        fi
    fi
    
    if uninstall_orchestrator "$SUPERCLAUDE_DIR"; then
        echo ""
        echo -e "${GREEN}✓ Orchestrator uninstalled successfully!${NC}"
    else
        echo ""
        echo -e "${RED}✗ Uninstall failed${NC}"
        exit 1
    fi
    
elif [[ "$UPDATE_MODE" = true ]]; then
    # Update mode
    orchestrator_dir="$SUPERCLAUDE_DIR/orchestrator"
    if [[ ! -d "$orchestrator_dir" ]]; then
        log_error "No existing orchestrator installation found"
        echo "Use regular installation mode instead."
        exit 1
    fi
    
    # Check versions
    if [[ -f "$orchestrator_dir/VERSION" ]]; then
        installed_version=$(cat "$orchestrator_dir/VERSION")
        echo "Installed version: $installed_version"
        echo "New version: $ORCHESTRATOR_VERSION"
        echo ""
    fi
    
    if [[ "$FORCE_INSTALL" != true ]]; then
        echo -e "${YELLOW}This will update the orchestrator${NC}"
        echo -n "Continue? (y/n): "
        read -r confirm
        if [[ "$confirm" != "y" ]]; then
            echo "Update cancelled."
            exit 0
        fi
    fi
    
    if install_orchestrator "$SUPERCLAUDE_DIR"; then
        echo ""
        echo -e "${GREEN}✓ Orchestrator updated successfully!${NC}"
    else
        echo ""
        echo -e "${RED}✗ Update failed${NC}"
        exit 1
    fi
    
else
    # Regular installation
    orchestrator_dir="$SUPERCLAUDE_DIR/orchestrator"
    if [[ -d "$orchestrator_dir" ]] && [[ "$FORCE_INSTALL" != true ]]; then
        echo -e "${YELLOW}Orchestrator already installed at $orchestrator_dir${NC}"
        echo "Use --update to update or --force to reinstall"
        exit 1
    fi
    
    if [[ "$FORCE_INSTALL" != true ]]; then
        echo -e "${YELLOW}This will install the orchestrator to SuperClaude${NC}"
        echo -n "Continue? (y/n): "
        read -r confirm
        if [[ "$confirm" != "y" ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
    
    if install_orchestrator "$SUPERCLAUDE_DIR"; then
        echo ""
        echo -e "${GREEN}✓ Orchestrator installed successfully!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Open Claude Code"
        echo "2. Say: 'Use the orchestrator to translate my requests'"
        echo "3. Make requests in natural language:"
        echo "   - 'Review my code for security issues'"
        echo "   - 'Build a React app with testing'"
        echo "   - 'Optimize database performance'"
        echo ""
        echo "See orchestrator/README.md for more examples"
    else
        echo ""
        echo -e "${RED}✗ Installation failed${NC}"
        exit 1
    fi
fi