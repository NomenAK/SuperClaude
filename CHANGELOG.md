# Changelog

All notable changes to SuperClaude will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Natural Language Orchestrator - translate plain English to SuperClaude commands
- 8 orchestrator documentation files in `.claude/orchestrator/`
- `install-orchestrator.sh` for easy orchestrator installation
- Comprehensive workflow templates for common development scenarios
- Smart flag combination optimizer for better command generation

## [2.0.1] - 2025-06-26

### Added
- `--introspect` flag for framework self-analysis and improvement capabilities
- Enhanced SuperClaude identity declaration with mission statement

### Fixed
- Corrected file count reporting in install.sh verification process
- Resolved critical file copying issues in install.sh

## [2.0.0] - 2025-06-26

### Added
- Comprehensive security and robustness improvements to install.sh
- Optimize all 18 command files using @include reference system
- Commands cheat sheet documentation
- Custom installation directory support (#4)
- Community interaction files (CONTRIBUTING.md, CODE_OF_CONDUCT.md)
- MIT License

### Changed
- Complete migration to v2 with @include reference system
- Standardized @include reference system across all command files
- Migrated PERSONAS to flag system for Claude Code compliance
- Transformed README.md into engaging developer-friendly format
- Major optimization achieving 35% token reduction through template system & file consolidation
- Enhanced Task Management System - Adaptation of PR #5 (#7)

### Removed
- All hard claims, metrics, and numeric targets
- All references to user: and project: prefixes
- References to deleted scripts and pattern system

### Fixed
- Shared resources count in install.sh
- .gitignore configuration and removed logs/claudedocs from tracking

## [1.0.0] - 2025-06-22

### Added
- Initial release of SuperClaude v1.0.0 configuration framework
- Core configuration system with CLAUDE.md
- Command system with 18 optimized command files
- Shared resources and patterns
- Installation script (install.sh)
- Comprehensive documentation

---

*Note: This changelog was generated from git history. For detailed commit messages, run `git log`.*