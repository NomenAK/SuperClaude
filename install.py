#!/usr/bin/env python3
"""
SuperClaude Framework - Simple Installation Entry Point

A simple installer script that provides an easy entry point for manual installation.
This script wraps the existing sophisticated SuperClaude CLI system.

Usage:
    python install.py                 # Interactive installation
    python install.py --quick         # Quick installation (recommended)
    python install.py --full          # Full installation with all components
    python install.py --help          # Show this help

Examples:
    # Quick installation (recommended for most users)
    python install.py --quick
    
    # Full installation with MCP servers and MorphLLM
    python install.py --full
    
    # Interactive installation with choices
    python install.py

Author: SuperClaude Framework
Version: 3.0.0
"""

import sys
import argparse
import os
from pathlib import Path


def print_banner():
    """Print installation banner"""
    print("=" * 60)
    print("  SuperClaude Framework v3.0 - Simple Installer")
    print("=" * 60)
    print()


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"   Your Python version: {sys.version}")
        print("   Please upgrade Python and try again.")
        return False
    return True


def check_project_structure():
    """Verify we're in the correct SuperClaude directory"""
    required_files = [
        "SuperClaude/__main__.py",
        "setup/operations/install.py",
        "pyproject.toml"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Error: Missing required SuperClaude files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print()
        print("Make sure you're running this script from the SuperClaude project root directory.")
        return False
    
    return True


def get_installation_type():
    """Interactive selection of installation type"""
    print("Choose your installation type:")
    print("1. Quick Installation (recommended)")
    print("   → Core framework + essential commands")
    print("   → Fast setup, covers most use cases")
    print()
    print("2. Full Installation") 
    print("   → Everything including MCP servers + MorphLLM")
    print("   → Requires Node.js, Claude CLI, API keys")
    print()
    
    while True:
        try:
            choice = input("Enter your choice (1 or 2, or 'q' to quit): ").strip()
            
            if choice.lower() in ['q', 'quit', 'exit']:
                print("Installation cancelled.")
                return None
            elif choice == '1':
                return 'quick'
            elif choice == '2':
                return 'full'
            else:
                print("Invalid choice. Please enter 1, 2, or 'q' to quit.")
        except (KeyboardInterrupt, EOFError):
            print("\nInstallation cancelled.")
            return None


def run_superclaude_installer(install_type, dry_run=False):
    """Run the SuperClaude CLI installer with the specified type"""
    print(f"\n🚀 Starting {install_type.title()} Installation...")
    if dry_run:
        print("(DRY RUN - simulating installation)")
    else:
        print("This may take a few minutes depending on your system and network connection.")
    print()
    
    # Prepare arguments for SuperClaude CLI
    if install_type == 'quick':
        cli_args = ['SuperClaude', 'install', '--profile', 'quick', '--yes']
    elif install_type == 'full':
        cli_args = ['SuperClaude', 'install', '--profile', 'developer', '--yes']
    else:
        cli_args = ['SuperClaude', 'install', '--yes']
    
    # Add dry-run flag if requested
    if dry_run:
        cli_args.append('--dry-run')
    
    # Set up sys.argv for the CLI system
    original_argv = sys.argv.copy()
    sys.argv = cli_args
    
    try:
        # Import and run SuperClaude CLI
        from SuperClaude.__main__ import main
        return main()
    except ImportError as e:
        print(f"❌ Error: Could not import SuperClaude CLI: {e}")
        print("Make sure you're in the correct directory and all files are present.")
        return 1
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return 1
    finally:
        # Restore original sys.argv
        sys.argv = original_argv


def show_help():
    """Show help information"""
    print(__doc__)


def main():
    """Main entry point for the simple installer"""
    parser = argparse.ArgumentParser(
        description="SuperClaude Framework Simple Installer",
        epilog="For more advanced options, use: SuperClaude install --help",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--quick', 
        action='store_true',
        help='Quick installation with core framework and essential commands (recommended)'
    )
    
    parser.add_argument(
        '--full', 
        action='store_true',
        help='Full installation including MCP servers and MorphLLM integration'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='SuperClaude Simple Installer v3.0.0'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate installation without making changes'
    )
    
    args = parser.parse_args()
    
    # Show banner
    print_banner()
    
    # Check Python version
    if not check_python_version():
        return 1
    
    # Verify project structure
    if not check_project_structure():
        return 1
    
    # Determine installation type
    if args.quick and args.full:
        print("❌ Error: Cannot specify both --quick and --full options")
        return 1
    elif args.quick:
        install_type = 'quick'
    elif args.full:
        install_type = 'full'
    else:
        # Interactive mode
        install_type = get_installation_type()
        if install_type is None:
            return 0  # User cancelled
    
    # Run installation
    result = run_superclaude_installer(install_type, dry_run=args.dry_run)
    
    # Show completion message
    if result == 0:
        print("\n✅ Installation completed successfully!")
        print()
        print("Next steps:")
        print("1. Restart your Claude Code session")
        print("2. Your SuperClaude framework is ready to use")
        print("3. Try commands like: /sc:analyze, /sc:build, /sc:implement")
        print()
        print("For help and documentation, visit:")
        print("https://github.com/NomenAK/SuperClaude")
    else:
        print("\n❌ Installation completed with errors.")
        print("Check the output above for details.")
        print()
        print("For help, visit: https://github.com/NomenAK/SuperClaude/issues")
    
    return result


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nInstallation cancelled by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please report this issue at: https://github.com/NomenAK/SuperClaude/issues")
        sys.exit(1)