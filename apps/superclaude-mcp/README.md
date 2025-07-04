# SuperClaude MCP Server

A TypeScript-based MCP (Model Context Protocol) server that provides the same access to the SuperClaude configuration framework as a per-project .claude folder, but portable to any project without copying files.

## Overview

SuperClaude MCP provides the same access that you would to the SuperClaude configuration framework in a per-project .claude folder but portable to any project without copying the files. It keeps personas and slash-commands up-to-date with improvements in real-time. Exposes Commands, Personas, and Rules as MCP Resources and Prompts, which are then automatically integrated into Claude Code. Slash commands will show up under `/superclaude:`, while Personas and Rules will show up under `@superclaude:`.

The server supports both STDIO and HTTP transports and caches data locally so you can share it with any MCP-compatible agent on your development machine. By default it pulls from latest on the official repository, but you can configure preferences to pull from your own fork if you wish.

## Features

- **🚀 MCP Server Implementation**: Full MCP server with HTTP and stdio transports
- **📝 Prompt Templates**: Exposes SuperClaude commands as MCP prompts (`/superclaude:`)
- **🎭 Persona Resources**: Access SuperClaude personas through MCP resources (`@superclaude:`)
- **📋 Rules Access**: Access SuperClaude rules through MCP resources (`@superclaude:`)
- **🔄 Real-time Updates**: Keeps personas and commands up-to-date with latest improvements
- **💾 Local Caching**: Caches data locally for fast access and offline availability
- **🔧 Flexible Configuration**: Support for both local and remote SuperClaude sources
- **🌐 Multi-Source Support**: Load from GitHub repository or local filesystem
- **🛠️ CLI Management**: Comprehensive command-line interface for configuration
- **🐳 Docker Support**: Containerized deployment with multi-stage builds
- **🧪 Comprehensive Testing**: Extensive test suite with Vitest

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Git (for GitHub source loading)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd superclaude-mcp

# Install dependencies
pnpm install

# Initialize configuration
pnpm config init

# Start the server
pnpm dev
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t superclaude-mcp .
docker run -p 3000:3000 superclaude-mcp
```

## Configuration

The server uses a hierarchical configuration system:

1. **CLI Arguments** (highest priority)
2. **Environment Variables**
3. **User Configuration** (`~/.superclaude/config.json`)
4. **Default Configuration** (lowest priority)

### Configuration Management

```bash
# Initialize configuration
pnpm config init

# Show current configuration
pnpm config show

# Set configuration values
pnpm config set sourceType github
pnpm config set gitHubOwner NomenAK
pnpm config set gitHubRepo SuperClaude

# Reset to defaults
pnpm config reset
```

### Environment Variables

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

## Usage

### MCP Integration

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "superclaude": {
      "command": "node",
      "args": ["./dist/main.js"],
      "cwd": "/path/to/superclaude-mcp"
    }
  }
}
```

### HTTP Transport

The server also provides HTTP transport on port 3000:

```bash
# Health check
curl http://localhost:3000/health

# MCP endpoint
curl http://localhost:3000/mcp
```

### Available MCP Features

#### Prompts

- All SuperClaude commands are exposed as MCP prompts
- Use prompt names like `superclaude:command-name`
- Example: `superclaude:document`, `superclaude:analyze`
- Shows up in Claude Code as `/superclaude:` slash commands

#### Resources

- **`rules`**: Access to SuperClaude rules and guidelines
- **`personas/{persona-id}`**: Individual SuperClaude personas with their configurations
- Resources show up in Claude Code as `@superclaude:` references
- Contains the complete SuperClaude ruleset and persona library

## Development

### Scripts

| Script        | Description                      |
| ------------- | -------------------------------- |
| `pnpm dev`    | Start development server         |
| `pnpm build`  | Build for production             |
| `pnpm test`   | Run test suite                   |
| `pnpm lint`   | Run linting and type checking    |
| `pnpm sync`   | Sync data from configured source |
| `pnpm report` | Generate data report             |

### Project Structure

```
superclaude-mcp/
├── src/
│   ├── main.ts                    # CLI entry point with Commander.js
│   ├── index.ts                   # Module exports for library usage
│   ├── app.ts                     # Express application setup
│   ├── http-server.ts             # HTTP server for MCP over HTTP transport
│   ├── mcp.ts                     # Core MCP server implementation
│   ├── database.ts                # LowDB database abstraction layer
│   ├── logger.ts                  # Pino logging configuration
│   ├── schemas.ts                 # Zod schema exports
│   ├── types.ts                   # TypeScript type definitions
│   │
│   ├── models/                    # Data models and schemas
│   │   ├── index.ts              # Model exports
│   │   ├── command.model.ts      # SuperClaude command schemas
│   │   ├── persona.model.ts      # Persona configuration schemas
│   │   ├── rules.model.ts        # Rules data schemas
│   │   ├── database.model.ts     # Database structure schemas
│   │   └── config.model.ts       # Configuration schemas
│   │
│   ├── services/                  # Business logic services
│   │   ├── config-service.ts     # Configuration management
│   │   ├── database-service.ts   # Database operations
│   │   └── sync-service.ts       # Data synchronization
│   │
│   ├── sources/                   # Data source loaders
│   │   ├── interfaces.ts         # Source loader interfaces
│   │   ├── base-source-loader.ts # Abstract base loader
│   │   ├── local-source-loader.ts # Local filesystem loader
│   │   ├── github-source-loader.ts # GitHub repository loader
│   │   └── source-loader-factory.ts # Factory for creating loaders
│   │
│   └── utils/                     # Utility functions
│       ├── file-utils.ts         # File system utilities
│       ├── yaml-utils.ts         # YAML parsing utilities
│       └── validation-utils.ts   # Data validation helpers
│
├── tests/                         # Comprehensive test suite
│   ├── mocks/                    # Test data and mocks
│   ├── fixtures/                 # Test fixtures
│   └── **/*.test.ts             # Vitest test files
│
├── docs/                         # Documentation
│   └── configuration.md         # Configuration guide
│
├── package.json                  # Node.js package configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Testing configuration
├── tsup.config.ts               # Build configuration (tsup)
├── docker-compose.yml           # Local development setup
├── Dockerfile                   # Docker build configuration
├── docker-bake.hcl             # Docker buildx configuration
└── mcp.json                     # MCP server testing configuration
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Configuration Schema

See [docs/configuration.md](docs/configuration.md) for detailed configuration schema and options.

## Related Projects

- [SuperClaude](https://github.com/NomenAK/SuperClaude) - The original SuperClaude command library
- [Claude Code](https://claude.ai/code) - Anthropic's official CLI for Claude
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK for MCP

---

**Note**: This MCP server requires access to SuperClaude commands and data. Ensure you have proper permissions and follow SuperClaude's usage guidelines.
