# SuperClaude MCP Configuration

## Overview

The SuperClaude MCP configuration management system provides a flexible, hierarchical configuration system that supports both local and remote data sources with persistence to the user's home directory.

## Features

- **Multiple Source Types**: Support for local file system and remote GitHub repository sources
- **Configuration Hierarchy**: CLI arguments → Environment variables → User config → Defaults
- **Persistence**: Saving of configuration to `~/.superclaude/config.json`
- **CLI Management**: Full CLI commands for configuration management (init, show, set, reset)
- **Backwards Compatibility**: Maintains compatibility with existing GitHub repository setup

## Configuration Schema

The configuration uses Zod schemas for runtime validation:

### Default Configuration

The system uses the following default configuration values:

```typescript
const DEFAULT_CONFIG: AppConfig = {
  source: {
    type: "remote",
    remote: {
      url: "https://github.com/NomenAK/SuperClaude",
      branch: "master",
      cacheTTL: 5,
    },
  },
  database: {
    path: "~/.superclaude/data/db.json",
    autoInit: true,
  },
  sync: {
    enabled: false,
    intervalMinutes: 30,
    onStartup: false,
  },
  server: {
    transport: "stdio",
    port: 8080,
    logLevel: "info",
  },
  persistence: {
    enabled: false,
    autoSave: false,
  },
};
```

### Schema Definition

```typescript
interface AppConfig {
  source: {
    type: "local" | "remote";
    local?: {
      path: string; // default: "./.claude"
    };
    remote?: {
      url: string; // default: "https://github.com/NomenAK/SuperClaude"
      branch: string; // default: "master"
      cacheTTL: number; // default: 5 minutes
    };
  };
  database: {
    path?: string; // default: "~/.superclaude/data/db.json"
    autoInit: boolean; // default: true
  };
  sync: {
    enabled: boolean; // default: false
    intervalMinutes: number; // default: 30
    onStartup: boolean; // default: false
  };
  server: {
    transport: "stdio" | "http"; // default: "stdio"
    port: number; // default: 8080
    logLevel: string; // default: "info"
  };
  persistence: {
    enabled: boolean; // default: false
    autoSave: boolean; // default: false
  };
}
```

## CLI Usage

### Configuration Commands

```bash
# Initialize configuration file
superclaude-mcp config init

# Show current configuration
superclaude-mcp config show

# Set configuration values
superclaude-mcp config set sync.enabled false
superclaude-mcp config set source.remote.url https://github.com/myorg/myrepo

# Reset configuration to defaults
superclaude-mcp config reset
superclaude-mcp config reset --delete  # Also removes config file
```

### Global Options

```bash
# Use local source
superclaude-mcp --source-type local --source-path /path/to/data server

# Use remote source with custom settings
superclaude-mcp --source-type remote --source-url https://github.com/org/repo --source-branch develop server

# Persist configuration (save settings to ~/.superclaude/config.json)
superclaude-mcp --source-type local --source-path /data --persist-config server

# Start HTTP server with custom port
superclaude-mcp server --transport http --port 3000
```

### Server Options

```bash
# Start with stdio transport (default)
superclaude-mcp server

# Start with HTTP transport
superclaude-mcp server --transport http

# Start with custom transport and port
superclaude-mcp server --transport http --port 3000
```

### Additional Commands

```bash
# Sync data from configured source
superclaude-mcp sync

# Generate data report
superclaude-mcp report

# Show help
superclaude-mcp --help
superclaude-mcp server --help
superclaude-mcp config --help
```

## Environment Variables

The following environment variables are supported:

| Variable               | Description                            | Default                                  |
| ---------------------- | -------------------------------------- | ---------------------------------------- |
| `SC_SOURCE_TYPE`       | Source type (`local` or `remote`)      | `remote`                                 |
| `SC_SOURCE_PATH`       | Path for local source                  | `./.claude`                              |
| `SC_SOURCE_URL`        | URL for remote source                  | `https://github.com/NomenAK/SuperClaude` |
| `SC_SOURCE_BRANCH`     | Branch for remote source               | `master`                                 |
| `SC_SOURCE_CACHE_TTL`  | Cache TTL in minutes for remote source | `5`                                      |
| `SC_DATABASE_PATH`     | Database file path                     | `~/.superclaude/data/db.json`            |
| `SC_AUTO_SYNC_ENABLED` | Enable/disable auto sync               | `false`                                  |
| `SC_TRANSPORT`         | Server transport (`stdio` or `http`)   | `stdio`                                  |
| `PORT`                 | Server port for HTTP transport         | `8080`                                   |
| `LOG_LEVEL`            | Logging level                          | `info`                                   |

## Source Loaders

### LocalSourceLoader

Loads SuperClaude data from the local file system

### GitHubSourceLoader

Loads data from a GitHub repository with configurable:

- Repository URL
- Branch
- Cache TTL

### Directory Structure

The SuperClaude configuration system supports flexible directory structures with centralized shared resources and multiple fallback locations for backward compatibility.

#### Primary Structure (Recommended)

```
{basePath}/
├── commands/
│   ├── shared/                    # Shared command files and includes
│   │   ├── patterns.yml
│   │   ├── constants.yml
│   │   └── config.yml
│   ├── command1.yml               # Individual command files
│   ├── command2.md                # Markdown commands also supported
│   └── command3.yaml
├── shared/                        # Central location for personas and rules
│   ├── superclaude-personas.yaml  # Main personas file
│   └── superclaude-rules.yaml     # Main rules file
```

#### GitHub Repository Structure

For GitHub repositories, the structure of the repository should look like:

```
.claude/
├── commands/
│   ├── shared/
│   │   ├── patterns.yml
│   │   └── constants.yml
│   ├── command1.yml
│   └── command2.md
├── shared/
│   ├── superclaude-personas.yaml  # or .yml
│   └── superclaude-rules.yaml     # or .yml
```

#### Supported File Extensions

- **YAML**: `.yaml`, `.yml`
- **Markdown**: `.md` (commands only)
- Both extensions are checked in the order listed above

## Implementation Details

### ConfigService

- Manages configuration hierarchy
- Handles loading from multiple sources
- Provides configuration persistence
- Validates configuration with Zod schemas

### SourceLoaderFactory

- Creates appropriate source loader based on configuration
- Validates source configuration
- Provides factory methods for each source type

## Testing

Comprehensive test coverage includes:

- Configuration model validation
- ConfigService hierarchy and persistence
- LocalSourceLoader interface compliance
- SourceLoaderFactory creation logic
