# SuperClaude – Development Framework for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)](https://github.com/NomenAK/SuperClaude)
[![GitHub issues](https://img.shields.io/github/issues/NomenAK/SuperClaude)](https://github.com/NomenAK/SuperClaude/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/NomenAK/SuperClaude/blob/master/CONTRIBUTING.md)

**A configuration framework that enhances Claude Code with specialized commands, cognitive personas, and development methodologies.**

## 🚀 Version 2.0.1 Update

IMPORTANT: Start Fresh by removing old files and dir in .claude (RULES.md MCP.md PERSONAS.md CLAUDE.md and /commands dir)

SuperClaude v2 introduces architectural improvements focused on maintainability and extensibility:

- **⚡ Streamlined Architecture**: @include reference system for configuration management
- **🎭 Personas as Flags**: 9 cognitive personas integrated into the flag system (`--persona-architect`, `--persona-security`, etc.)
- **📦 Enhanced Installer**: install.sh with update mode, dry-run, backup handling, and platform detection
- **🔧 Modular Design**: Template system for adding new commands and features
- **🎯 Unified Experience**: Consistent flag behavior across all commands

See [ROADMAP.md](ROADMAP.md) for future development ideas and contribution opportunities.

## 🎯 Background

Claude Code provides powerful capabilities but can benefit from:
- **Specialized expertise** for different technical domains
- **Token efficiency** for complex projects  
- **Evidence-based approaches** to development
- **Context preservation** during debugging sessions
- **Domain-specific thinking** for various tasks

## ✨ SuperClaude Features

SuperClaude enhances Claude Code with:
- **18 Specialized Commands** covering development lifecycle tasks
- **9 Cognitive Personas** for domain-specific approaches
- **Token Optimization** with compression options
- **Evidence-Based Methodology** encouraging documentation
- **MCP Integration** with Context7, Sequential, Magic, Puppeteer
- **Git Checkpoint Support** for safe experimentation
- **Introspection Mode** for framework improvement and troubleshooting

### 🗣️ Natural Language Orchestrator (Optional)

SuperClaude now includes an optional orchestrator that translates natural language into commands:

```bash
# Install the orchestrator extension
./install-orchestrator.sh
```

Instead of memorizing 19 commands, just describe what you want:
- "Review my code for security" → `/review --security --evidence --persona-security`
- "Build a React app" → `/build --react --feature --tdd --frontend`
- "Deploy to production safely" → `/deploy --prod --critical --evidence --plan`

See `.claude/orchestrator/README.md` for complete documentation.

## 🚀 Installation

### Enhanced Installer v2.0.1
The installer provides various options:

```bash
git clone https://github.com/NomenAK/SuperClaude.git
cd SuperClaude

# Basic installation
./install.sh                           # Default: ~/.claude/

# Advanced options
./install.sh --dir /opt/claude        # Custom location
./install.sh --update                 # Update existing installation
./install.sh --dry-run --verbose      # Preview changes with details
./install.sh --force                  # Skip confirmations (automation)
./install.sh --log install.log        # Log all operations
```

**v2.0.1 Installer Features:**
- 🔄 **Update Mode**: Preserves customizations while updating
- 👁️ **Dry Run**: Preview changes before applying
- 💾 **Smart Backups**: Automatic backup with timestamping
- 🧹 **Clean Updates**: Removes obsolete files
- 🖥️ **Platform Detection**: Works with Linux, macOS, WSL
- 📊 **Progress Tracking**: Installation feedback

Zero dependencies. Installs to `~/.claude/` by default.

**Note:** After installation, all configuration files are located in `~/.claude/` (your home directory), not in the project directory.

## 💡 Core Capabilities

### 🧠 **Cognitive Personas (Now as Flags!)**
Switch between different approaches with persona flags:

```bash
/analyze --code --persona-architect     # Systems thinking approach
/build --react --persona-frontend       # UX-focused development  
/scan --security --persona-security     # Security-first analysis
/troubleshoot --prod --persona-analyzer # Root cause analysis approach
```

**v2.0.1 Update**: All 9 personas are now universal flags, available on every command for consistent access to specialized approaches.

### ⚡ **19 Commands**
Development lifecycle coverage:

**Development Commands**
```bash
/build --react --magic --tdd    # Development with AI components
/dev-setup --ci --monitor       # Environment setup
/test --coverage --e2e --pup    # Testing strategies
```

**Analysis & Quality**
```bash
/review --quality --evidence --persona-qa     # AI-powered code review
/analyze --architecture --seq   # System analysis
/troubleshoot --prod --five-whys # Issue resolution
/improve --performance --iterate # Optimization
/explain --depth expert --visual # Documentation
```

**Operations & Security**
```bash
/deploy --env prod --plan       # Deployment planning
/scan --security --owasp --deps # Security audits
/migrate --dry-run --rollback   # Database migrations
/cleanup --all --validate       # Maintenance tasks
```

### 🎛️ **MCP Integration**
- **Context7**: Access to library documentation
- **Sequential**: Multi-step reasoning capabilities
- **Magic**: AI-generated UI components
- **Puppeteer**: Browser testing and automation

**⚠️ Important:** SuperClaude does not include MCP servers. You need to install them separately in Claude Code's MCP settings to use MCP-related flags (--c7, --seq, --magic, --pup).

### 📊 **Token Efficiency**
SuperClaude's @include template system helps manage token usage:
- **UltraCompressed mode** option for token reduction
- **Template references** for configuration management
- **Caching mechanisms** to avoid redundancy
- **Context-aware compression** options

## 🎮 Example Workflows

### Enterprise Architecture Flow
```bash
/design --api --ddd --bounded-context --persona-architect    # Domain-driven design
/estimate --detailed --worst-case --seq                      # Resource planning
/scan --security --validate --persona-security               # Security review
/build --api --tdd --coverage --persona-backend              # Implementation
```

### Production Issue Resolution
```bash
/troubleshoot --investigate --prod --persona-analyzer        # Analysis
/analyze --profile --perf --seq                             # Performance review
/improve --performance --threshold 95% --persona-performance # Optimization
/test --integration --e2e --pup                             # Validation
```

### Framework Troubleshooting & Improvement
```bash
/troubleshoot --introspect                                  # Debug SuperClaude behavior
/analyze --introspect --seq                                 # Analyze framework patterns
/improve --introspect --uc                                  # Optimize token usage
```

### Full-Stack Feature Development
```bash
/build --react --magic --watch --persona-frontend           # UI development
/test --coverage --e2e --strict --persona-qa                # Quality assurance
/scan --validate --deps --persona-security                  # Security check
```

## 🎭 Available Personas

| Persona | Focus Area | Tools | Use Cases |
|---------|-----------|-------|-----------|
| **architect** | System design | Sequential, Context7 | Architecture planning |
| **frontend** | User experience | Magic, Puppeteer, Context7 | UI development |
| **backend** | Server systems | Context7, Sequential | API development |
| **security** | Security analysis | Sequential, Context7 | Security reviews |
| **analyzer** | Problem solving | All MCP tools | Debugging |
| **qa** | Quality assurance | Puppeteer, Context7 | Testing |
| **performance** | Optimization | Puppeteer, Sequential | Performance tuning |
| **refactorer** | Code quality | Sequential, Context7 | Code improvement |
| **mentor** | Knowledge sharing | Context7, Sequential | Documentation |

## 🛠️ Configuration Options

### Thinking Depth Control
```bash
# Standard analysis
/analyze --think

# Deeper analysis  
/design --think-hard

# Maximum depth
/troubleshoot --ultrathink
```

### Introspection Mode
```bash
# Enable self-aware analysis for SuperClaude improvement
/analyze --introspect

# Debug SuperClaude behavior
/troubleshoot --introspect --seq

# Optimize framework performance
/improve --introspect --persona-performance
```

### Token Management
```bash
# Standard mode
/build --react --magic

# With compression
/analyze --architecture --uc

# Native tools only
/scan --security --no-mcp
```

### Evidence-Based Development
SuperClaude encourages:
- Documentation for design decisions
- Testing for quality improvements
- Metrics for performance work
- Security validation for deployments
- Analysis for architectural choices

## 📋 Command Categories

### Development (3 Commands)
- `/build` - Project builder with stack templates
- `/dev-setup` - Development environment setup
- `/test` - Testing framework

### Analysis & Improvement (5 Commands)
- `/review` - AI-powered code review with evidence-based recommendations
- `/analyze` - Code and system analysis
- `/troubleshoot` - Debugging and issue resolution
- `/improve` - Enhancement and optimization
- `/explain` - Documentation and explanations

### Operations (6 Commands)
- `/deploy` - Application deployment
- `/migrate` - Database and code migrations
- `/scan` - Security and validation
- `/estimate` - Project estimation
- `/cleanup` - Project maintenance
- `/git` - Git workflow management

### Design & Workflow (5 Commands)
- `/design` - System architecture
- `/spawn` - Parallel task execution
- `/document` - Documentation creation
- `/load` - Project context loading
- `/task` - Task management

## 🔧 Technical Architecture v2

SuperClaude v2's architecture enables extensibility:

**🏗️ Modular Configuration**
- **CLAUDE.md** – Core configuration with @include references
- **.claude/shared/** – Centralized YAML templates
- **commands/shared/** – Reusable command patterns
- **@include System** – Template engine for configuration

**🎯 Unified Command System**
- **19 Commands** – Development lifecycle coverage
- **Flag Inheritance** – Universal flags on all commands
- **Persona Integration** – 9 cognitive modes as flags
- **Template Validation** – Reference integrity checking

**📦 Architecture Benefits**
- **Single Source of Truth** – Centralized updates
- **Easy Extension** – Add new commands/flags
- **Consistent Behavior** – Unified flag handling
- **Reduced Duplication** – Template-based configuration

**✅ Quality Features**
- **Evidence-Based Approach** – Documentation encouraged
- **Research Integration** – Library documentation access
- **Error Recovery** – Graceful failure handling
- **Structured Output** – Organized file locations

## 📊 Comparison

| Aspect | Standard Claude Code | SuperClaude Framework |
|--------|---------------------|----------------------|
| **Expertise** | General responses | 9 specialized personas |
| **Commands** | Manual instructions | 18 workflow commands |
| **Context** | Session-based | Git checkpoint support |
| **Tokens** | Standard usage | Compression options |
| **Approach** | General purpose | Evidence-based |
| **Documentation** | As needed | Systematic approach |
| **Quality** | Variable | Validation patterns |
| **Integration** | Basic tools | MCP orchestration |

## 🔮 Use Cases

**Development Teams**
- Consistent approaches across domains
- Standardized workflows
- Evidence-based decisions
- Documentation practices

**Technical Leaders**
- Architecture reviews
- Performance optimization
- Code quality improvement
- Team knowledge sharing

**Operations**
- Deployment procedures
- Debugging workflows
- Security management
- Maintenance tasks

## 🎯 Suitability

**Good fit for:**
- ✅ Teams wanting consistent AI assistance
- ✅ Projects needing specialized approaches
- ✅ Evidence-based development practices
- ✅ Token-conscious workflows
- ✅ Domain-specific expertise needs

**May not suit:**
- ❌ Purely manual workflows
- ❌ Minimal configuration preferences
- ❌ Ad-hoc development styles
- ❌ Single-domain focus

## 🚦 Getting Started

1. **Install SuperClaude**
   ```bash
   git clone https://github.com/NomenAK/SuperClaude.git && cd SuperClaude && ./install.sh
   ```

2. **Validate Installation**
   ```bash
   /load                                    # Load project context
   /analyze --code --think                  # Test analysis
   /analyze --architecture --persona-architect  # Try personas
   ```

3. **Example Workflow**
   ```bash
   /design --api --ddd            # Architecture design
   /build --feature --tdd         # Implementation
   /test --coverage --e2e         # Quality assurance
   /deploy --env staging --plan   # Deployment
   ```

## 🛟 Support

- **Installation Help**: Run `./install.sh --help`
- **Command Details**: Check `~/.claude/commands/`
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/NomenAK/SuperClaude/issues)

## 🤝 Community

SuperClaude welcomes contributions:
- **New Personas** for specialized workflows
- **Commands** for domain-specific operations  
- **Patterns** for development practices
- **Integrations** for productivity tools

Join the community: [Discussions](https://github.com/NomenAK/SuperClaude/discussions)

## 📈 Version 2.0.1 Changes

**🎯 Architecture Improvements:**
- **Configuration Management**: @include reference system
- **Token Efficiency**: Compression options maintained
- **Command System**: Unified flag inheritance
- **Persona System**: Now available as flags
- **Installer**: Enhanced with new modes
- **Maintenance**: Centralized configuration

**📊 Framework Details:**
- **Commands**: 19 specialized commands
- **Personas**: 9 cognitive approaches
- **MCP Servers**: 4 integrations
- **Methodology**: Evidence-based approach
- **Usage**: By development teams

## 🎉 Enhance Your Development

SuperClaude provides a structured approach to using Claude Code with specialized commands, personas, and development patterns.

---

*SuperClaude v2.0.1 – Development framework for Claude Code*

[⭐ Star on GitHub](https://github.com/NomenAK/SuperClaude) | [💬 Discussions](https://github.com/NomenAK/SuperClaude/discussions) | [🐛 Report Issues](https://github.com/NomenAK/SuperClaude/issues)
