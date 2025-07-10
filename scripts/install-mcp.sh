#!/usr/bin/env bash

# SuperAugment MCP Server Installation Script
# Installs and configures SuperAugment as an MCP server for VS Code Augment
# Version: 1.0.0
# License: MIT

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.superaugment"
FORCE_INSTALL=false
VERBOSE=false
DRY_RUN=false

# Function: show_usage
show_usage() {
    echo "SuperAugment MCP Server Installer v1.0.0"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dir <directory>    Install to custom directory (default: $HOME/.superaugment)"
    echo "  --force              Skip confirmation prompts"
    echo "  --verbose            Show detailed output"
    echo "  --dry-run            Preview changes without making them"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Install to default location"
    echo "  $0 --dir /opt/superaugment  # Install to custom location"
    echo "  $0 --force                  # Install without prompts"
}

# Function: log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Function: log_verbose
log_verbose() {
    if [[ "$VERBOSE" = true ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Function: log_error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function: log_warning
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

# Function: check_requirements
check_requirements() {
    log_verbose "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [[ $major_version -lt 18 ]]; then
        log_error "Node.js 18+ is required. Current version: $node_version"
        exit 1
    fi
    
    log_verbose "Node.js version: $node_version ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    
    log_verbose "npm version: $(npm --version) ✓"
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_error "git is required but not installed."
        exit 1
    fi
    
    log_verbose "git version: $(git --version) ✓"
}

# Function: install_superaugment
install_superaugment() {
    log "Installing SuperAugment MCP Server..."
    
    if [[ "$DRY_RUN" = true ]]; then
        log "DRY RUN: Would create directory: $INSTALL_DIR"
        log "DRY RUN: Would clone repository"
        log "DRY RUN: Would install dependencies"
        log "DRY RUN: Would build project"
        return 0
    fi
    
    # Create installation directory
    log_verbose "Creating installation directory: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
    
    # Clone or copy project
    if [[ -d ".git" ]]; then
        log_verbose "Copying project files..."
        cp -r . "$INSTALL_DIR/"
    else
        log_verbose "Cloning repository..."
        git clone https://github.com/oktetopython/SuperAugment.git "$INSTALL_DIR"
    fi
    
    # Change to installation directory
    cd "$INSTALL_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm install
    
    # Build project
    log "Building project..."
    npm run build
    
    log "SuperAugment MCP Server installed successfully!"
}

# Function: configure_mcp
configure_mcp() {
    log "Configuring MCP integration..."
    
    local config_file="$HOME/.config/Code/User/settings.json"
    local mcp_config='{
  "mcpServers": {
    "superaugment": {
      "command": "node",
      "args": ["'$INSTALL_DIR'/dist/index.js"],
      "env": {}
    }
  }
}'
    
    if [[ "$DRY_RUN" = true ]]; then
        log "DRY RUN: Would create MCP configuration"
        log "DRY RUN: Configuration would be added to: $config_file"
        return 0
    fi
    
    # Create VS Code config directory if it doesn't exist
    mkdir -p "$(dirname "$config_file")"
    
    # Check if settings.json exists
    if [[ -f "$config_file" ]]; then
        log_warning "VS Code settings.json already exists. Please manually add the MCP configuration:"
        echo ""
        echo "$mcp_config"
        echo ""
    else
        echo "$mcp_config" > "$config_file"
        log "MCP configuration created at: $config_file"
    fi
}

# Function: show_completion_message
show_completion_message() {
    echo ""
    echo -e "${GREEN}🎉 SuperAugment MCP Server installation completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart VS Code"
    echo "2. Open the Augment plugin"
    echo "3. SuperAugment tools should now be available"
    echo ""
    echo "Available tools:"
    echo "  • analyze_code - Code analysis with persona support"
    echo "  • review_code - Comprehensive code reviews"
    echo "  • security_scan - Security vulnerability scanning"
    echo "  • build_project - Intelligent project building"
    echo "  • test_project - Advanced testing strategies"
    echo "  • deploy_application - Smart deployment workflows"
    echo ""
    echo "Installation directory: $INSTALL_DIR"
    echo "Configuration: $HOME/.config/Code/User/settings.json"
    echo ""
    echo "For help and documentation, visit:"
    echo "https://github.com/oktetopython/SuperAugment"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --force)
            FORCE_INSTALL=true
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
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Main installation process
echo -e "${GREEN}SuperAugment MCP Server Installer${NC}"
echo "=================================="
echo -e "Installation directory: ${YELLOW}$INSTALL_DIR${NC}"
if [[ "$DRY_RUN" = true ]]; then
    echo -e "${BLUE}Mode: DRY RUN (no changes will be made)${NC}"
fi
echo ""

# Confirmation prompt
if [[ "$FORCE_INSTALL" != true ]]; then
    echo -e "${YELLOW}This will install SuperAugment MCP Server to $INSTALL_DIR${NC}"
    echo -n "Are you sure you want to continue? (y/n): "
    read -r confirm
    if [[ "$confirm" != "y" ]]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

# Run installation steps
check_requirements
install_superaugment
configure_mcp
show_completion_message
