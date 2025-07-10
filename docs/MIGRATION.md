# Migration Guide: SuperClaude to SuperAugment

This guide helps you migrate from SuperClaude (Claude Code configuration framework) to SuperAugment (MCP server for VS Code Augment).

## Overview

SuperAugment represents a complete architectural transformation:

- **From**: Configuration framework for Claude Code
- **To**: MCP server for VS Code Augment
- **Benefits**: Better integration, type safety, extensibility

## Key Changes

### Architecture
- **SuperClaude**: Configuration files and slash commands
- **SuperAugment**: MCP server with tools, resources, and prompts

### Integration
- **SuperClaude**: Claude Code configuration in `~/.claude/`
- **SuperAugment**: MCP server integration with VS Code Augment

### Technology Stack
- **SuperClaude**: Bash scripts and YAML configuration
- **SuperAugment**: TypeScript/Node.js with MCP protocol

## Migration Steps

### 1. Backup Existing Configuration

Before migrating, backup your SuperClaude configuration:

```bash
# Backup SuperClaude configuration
cp -r ~/.claude ~/.claude.backup
```

### 2. Install SuperAugment

```bash
# Clone SuperAugment
git clone https://github.com/oktetopython/SuperAugment.git
cd SuperAugment

# Install using the MCP installer
./scripts/install-mcp.sh
```

### 3. Configure VS Code Augment

Add SuperAugment to your VS Code Augment MCP settings:

```json
{
  "mcpServers": {
    "superaugment": {
      "command": "node",
      "args": ["/path/to/SuperAugment/dist/index.js"],
      "env": {}
    }
  }
}
```

### 4. Update Workflows

#### Command Mapping

| SuperClaude Command | SuperAugment Tool | Notes |
|-------------------|------------------|-------|
| `/analyze --code` | `analyze_code` | Now with persona support |
| `/review --quality` | `review_code` | Enhanced with cognitive personas |
| `/scan --security` | `security_scan` | Specialized security scanning |
| `/build --react` | `build_project` | Intelligent project building |
| `/test --coverage` | `test_project` | Advanced testing strategies |
| `/deploy --env prod` | `deploy_application` | Smart deployment workflows |

#### Persona Usage

**SuperClaude (flags):**
```bash
/analyze --code --persona-architect
/build --react --persona-frontend
/scan --security --persona-security
```

**SuperAugment (parameters):**
```typescript
await mcpClient.callTool("analyze_code", {
  code: "...",
  persona: "architect"
});

await mcpClient.callTool("build_project", {
  type: "react",
  persona: "frontend"
});

await mcpClient.callTool("security_scan", {
  target: "src/",
  persona: "security"
});
```

### 5. Configuration Migration

#### Personas
SuperClaude personas are preserved and enhanced in SuperAugment:

- All 9 personas are available
- Enhanced with detailed expertise definitions
- Better integration with tools

#### Patterns
SuperClaude patterns are migrated to SuperAugment resources:

- Development patterns → `superaugment://patterns/development`
- Architecture patterns → `superaugment://patterns/architecture`
- Security patterns → `superaugment://patterns/security`

#### Settings
SuperClaude settings are replaced with SuperAugment configuration:

- `config/settings.yml` - Global settings
- `config/tools.yml` - Tool configurations
- `config/personas.yml` - Persona definitions

## Feature Comparison

### What's Preserved

✅ **All 9 Cognitive Personas**
- architect, frontend, backend, security, qa, performance, analyzer, refactorer, mentor

✅ **Core Functionality**
- Code analysis and review
- Security scanning
- Project building and testing
- Deployment workflows

✅ **Configuration Patterns**
- Development best practices
- Architecture patterns
- Security guidelines

### What's Enhanced

🚀 **Better Integration**
- Native MCP protocol support
- Real-time VS Code integration
- Type-safe tool parameters

🚀 **Improved Architecture**
- TypeScript implementation
- Modular design
- Extensible plugin system

🚀 **Enhanced Features**
- Resource system for patterns and documentation
- Prompt templates for common scenarios
- Better error handling and logging

### What's Changed

🔄 **Usage Model**
- From slash commands to MCP tool calls
- From configuration files to programmatic API
- From Claude Code to VS Code Augment

🔄 **Installation**
- From `~/.claude/` to MCP server
- From bash installer to npm package
- From configuration to service

## Troubleshooting Migration

### Common Issues

1. **SuperClaude commands not working**
   - SuperClaude commands are replaced by MCP tools
   - Use VS Code Augment interface instead of slash commands

2. **Configuration not found**
   - SuperAugment uses different configuration structure
   - Check `config/` directory for new configuration files

3. **Personas not available**
   - All personas are preserved in SuperAugment
   - Use persona parameter in tool calls

### Verification Steps

1. **Check MCP Server Status**
   ```bash
   # Verify SuperAugment is running
   ps aux | grep superaugment
   ```

2. **Test Tool Availability**
   - Open VS Code Augment
   - Check if SuperAugment tools are listed
   - Try calling a simple tool like `analyze_code`

3. **Verify Configuration**
   ```bash
   # Check configuration files
   ls -la ~/.superaugment/config/
   ```

## Rollback Plan

If you need to rollback to SuperClaude:

1. **Restore SuperClaude Configuration**
   ```bash
   cp -r ~/.claude.backup ~/.claude
   ```

2. **Remove SuperAugment**
   ```bash
   rm -rf ~/.superaugment
   ```

3. **Update VS Code Settings**
   - Remove SuperAugment from MCP configuration
   - Restart VS Code

## Getting Help

- **Documentation**: Check `docs/USAGE.md` for detailed usage instructions
- **Configuration**: Review `config/` files for examples
- **Issues**: Report problems on [GitHub](https://github.com/oktetopython/SuperAugment/issues)
- **Community**: Join discussions for migration support

## Next Steps

After successful migration:

1. **Explore New Features**
   - Try the resource system
   - Use prompt templates
   - Experiment with enhanced personas

2. **Customize Configuration**
   - Modify `config/settings.yml` for your needs
   - Add custom patterns to `config/patterns.yml`
   - Extend tool configurations

3. **Integrate with Workflows**
   - Set up automated testing with `test_project`
   - Configure deployment pipelines with `deploy_application`
   - Implement security scanning in CI/CD

Welcome to SuperAugment! 🎉
