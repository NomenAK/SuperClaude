# SuperClaude v3 🚀
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PyPI version](https://img.shields.io/pypi/v/SuperClaude.svg)](https://pypi.org/project/SuperClaude/)
[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/NomenAK/SuperClaude)
[![PyPI version](https://img.shields.io/pypi/v/SuperClaude.svg)](https://pypi.org/project/SuperClaude/)
[![GitHub issues](https://img.shields.io/github/issues/NomenAK/SuperClaude)](https://github.com/NomenAK/SuperClaude/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/NomenAK/SuperClaude/blob/master/CONTRIBUTING.md)
[![Contributors](https://img.shields.io/github/contributors/NomenAK/SuperClaude)](https://github.com/NomenAK/SuperClaude/graphs/contributors)

A framework that extends Claude Code with specialized commands, personas, and MCP server integration.

**📢 Status**: Initial release, fresh out of beta! Bugs may occur as we continue improving things.

## What is SuperClaude? 🤔

SuperClaude tries to make Claude Code more helpful for development work by adding:
- 🛠️ **16 specialized commands** for common dev tasks (some work better than others!)
- 🎭 **Smart personas** that usually pick the right expert for different domains 
- 🔧 **MCP server integration** for docs, UI components, and browser automation
- 🚀 **MorphLLM integration** for blazing-fast filesystem operations (20-60% faster!)
- 📋 **Task management** that tries to keep track of progress
- ⚡ **Token optimization** to help with longer conversations

This is what we've been building to make development workflows smoother. Still rough around the edges, but getting better! 😊

## Current Status 📊

✅ **What's Working Well:**
- Installation suite (rewritten from the ground up)
- Core framework with 9 documentation files 
- 16 slash commands for various development tasks
- MCP server integration (Context7, Sequential, Magic, Playwright)
- MorphLLM integration for fast filesystem operations
- Unified CLI installer for easy setup

⚠️ **Known Issues:**
- This is an initial release - bugs are expected
- Some features may not work perfectly yet
- Documentation is still being improved
- MorphLLM integration is new and may have edge cases

## Key Features ✨

### Commands 🛠️
We focused on 16 essential commands for the most common tasks:

**Development**: `/sc:implement`, `/sc:build`, `/sc:design`  
**Analysis**: `/sc:analyze`, `/sc:troubleshoot`, `/sc:explain`  
**Quality**: `/sc:improve`, `/sc:test`, `/sc:cleanup`  
**Others**: `/sc:document`, `/sc:git`, `/sc:estimate`, `/sc:task`, `/sc:index`, `/sc:load`, `/sc:spawn`

### Smart Personas 🎭
AI specialists that try to jump in when they seem relevant:
- 🏗️ **architect** - Systems design and architecture stuff
- 🎨 **frontend** - UI/UX and accessibility  
- ⚙️ **backend** - APIs and infrastructure
- 🔍 **analyzer** - Debugging and figuring things out
- 🛡️ **security** - Security concerns and vulnerabilities
- ✍️ **scribe** - Documentation and writing
- *...and 5 more specialists*

*(They don't always pick perfectly, but usually get it right!)*

### MCP Integration 🔧
External tools that connect when useful:
- **Context7** - Grabs official library docs and patterns 
- **Sequential** - Helps with complex multi-step thinking  
- **Magic** - Generates modern UI components 
- **Playwright** - Browser automation and testing stuff
- **MorphLLM** - Blazing-fast filesystem operations (20-60% faster!)

*(These work pretty well when they connect properly! 🤞)*

## ⚠️ Upgrading from v2? Important!

If you're coming from SuperClaude v2, you'll need to clean up first:

1. **Uninstall v2** using its uninstaller if available
2. **Manual cleanup** - delete these if they exist:
   - `SuperClaude/`
   - `~/.claude/shared/`
   - `~/.claude/commands/` 
   - `~/.claude/CLAUDE.md`
4. **Then proceed** with v3 installation below

This is because v3 has a different structure and the old files can cause conflicts.

### 🔄 **Key Change for v2 Users**
**The `/build` command changed!** In v2, `/build` was used for feature implementation. In v3:
- `/sc:build` = compilation/packaging only 
- `/sc:implement` = feature implementation (NEW!)

**Migration**: Replace `v2 /build myFeature` with `v3 /sc:implement myFeature`

## Installation 📦

### 🚀 Quick Install (Recommended)
```bash
pip install SuperClaude
SuperClaude install --quick
```
This installs the core framework and essential commands. Perfect for most users!

### 📋 Manual Install
```bash
# Clone the repository
git clone https://github.com/NomenAK/SuperClaude.git
cd SuperClaude

# Run the simple installer
python install.py --quick
```
Great for users who want to clone and customize.

### 🛠️ Full Install (Developers)
```bash
# Via pip (recommended)
pip install SuperClaude[full]
SuperClaude install --profile developer

# OR via manual install
git clone https://github.com/NomenAK/SuperClaude.git
cd SuperClaude
python install.py --full
```
Includes MCP servers (Context7, Sequential, Magic, Playwright) and MorphLLM integration.

### 📦 Installation Options Summary
| Method | Command | Includes | Best For |
|--------|---------|----------|----------|
| **Quick** | `pip install SuperClaude && SuperClaude install --quick` | Core + Commands | Most users |
| **Manual** | `python install.py --quick` | Core + Commands | Customization |
| **Full** | `pip install SuperClaude[full]` | Everything | Developers |

**Missing Python?**
```bash
# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install python3 python3-pip

# macOS  
brew install python3

# Windows
# Download from https://python.org/downloads/
```

**All installation methods handle:**
- Framework files and documentation
- Claude Code configuration
- MCP server setup (full install only)
- Automatic prerequisite checking

### MorphLLM Setup (Optional but Recommended) 🚀

For blazing-fast filesystem operations, install MorphLLM:

```bash
# Install MorphLLM MCP server
npm install -g @morph-llm/morph-fast-apply

# Configure API key (get from https://morphllm.com/dashboard)
export MORPH_API_KEY="your_api_key_here"

# Install SuperClaude with MorphLLM support
python3 SuperClaude install --profile developer
```

MorphLLM provides 20-60% faster filesystem operations with automatic fallback to native tools.

## How It Works 🔄

SuperClaude tries to enhance Claude Code through:

1. **Framework Files** - Documentation installed to `~/.claude/` that guides how Claude responds
2. **Slash Commands** - 16 specialized commands for different dev tasks  
3. **MCP Servers** - External services that add extra capabilities (when they work!)
4. **Smart Routing** - Attempts to pick the right tools and experts based on what you're doing

Most of the time it plays nicely with Claude Code's existing stuff. 🤝

## What's Coming in v4 🔮

We're hoping to work on these things for the next version:
- **Hooks System** - Event-driven stuff (removed from v3, trying to redesign it properly)
- **MCP Suite** - More external tool integrations  
- **Better Performance** - Trying to make things faster and less buggy
- **More Personas** - Maybe a few more domain specialists
- **Cross-CLI Support** - Might work with other AI coding assistants

*(No promises on timeline though - we're still figuring v3 out! 😅)*

## Configuration ⚙️

After installation, you can customize SuperClaude by editing:
- `~/.claude/settings.json` - Main configuration
- `~/.claude/*.md` - Framework behavior files

Most users probably won't need to change anything - it usually works okay out of the box. 🎛️

## Documentation 📖

Want to learn more? Check out our guides:

- 📚 [**User Guide**](Docs/superclaude-user-guide.md) - Complete overview and getting started
- 🛠️ [**Commands Guide**](Docs/commands-guide.md) - All 16 slash commands explained  
- 🏳️ [**Flags Guide**](Docs/flags-guide.md) - Command flags and options
- 🎭 [**Personas Guide**](Docs/personas-guide.md) - Understanding the persona system
- 📦 [**Installation Guide**](Docs/installation-guide.md) - Detailed installation instructions
- 🚀 [**MorphLLM Integration Guide**](Docs/morphllm-integration-guide.md) - Setup and usage for blazing-fast filesystem operations

These guides have more details than this README and are kept up to date.

## Contributing 🤝

We welcome contributions! Areas where we could use help:
- 🐛 **Bug Reports** - Let us know what's broken
- 📝 **Documentation** - Help us explain things better  
- 🧪 **Testing** - More test coverage for different setups
- 💡 **Ideas** - Suggestions for new features or improvements

The codebase is pretty straightforward Python + documentation files.

## Project Structure 📁

```
SuperClaude/
├── setup.py               # pypi setup file
├── SuperClaude/           # Framework files  
│   ├── Core/              # Behavior documentation (COMMANDS.md, FLAGS.md, etc.)
│   ├── Commands/          # 16 slash command definitions
│   └── Settings/          # Configuration files
├── setup/                 # Installation system
└── profiles/              # Installation profiles (quick, minimal, developer)
```

## Architecture Notes 🏗️

The v3 architecture focuses on:
- **Simplicity** - Removed complexity that wasn't adding value
- **Reliability** - Better installation and fewer breaking changes  
- **Modularity** - Pick only the components you want
- **Performance** - Faster operations with smarter caching

We learned a lot from v2 and tried to address the main pain points.

## FAQ 🙋

**Q: Why was the hooks system removed?**  
A: It was getting complex and buggy. We're redesigning it properly for v4.

**Q: Does this work with other AI assistants?**  
A: Currently Claude Code only, but v4 will have broader compatibility.

**Q: Is this stable enough for daily use?**  
A: The basic stuff works pretty well, but definitely expect some rough edges since it's a fresh release. Probably fine for experimenting! 🧪

## SuperClaude Contributors

[![Contributors](https://contrib.rocks/image?repo=NomenAk/SuperClaude)](https://github.com/NomenAK/SuperClaude/graphs/contributors)

## License

MIT - [See LICENSE file for details](https://opensource.org/licenses/MIT)

## Star History

<a href="https://www.star-history.com/#NomenAK/SuperClaude&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=NomenAK/SuperClaude&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=NomenAK/SuperClaude&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=NomenAK/SuperClaude&type=Date" />
 </picture>
</a>
---

*Built by developers who got tired of generic responses. Hope you find it useful! 🙂*

---
