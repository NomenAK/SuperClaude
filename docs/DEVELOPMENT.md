# SuperAugment Development Guide

This guide explains how to develop, extend, and contribute to SuperAugment.

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript knowledge
- Understanding of MCP protocol

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/oktetopython/SuperAugment.git
   cd SuperAugment
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development Mode**
   ```bash
   npm run dev
   ```

4. **Build Project**
   ```bash
   npm run build
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

## Project Structure

```
SuperAugment/
├── src/                    # Source code
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # Main server implementation
│   ├── tools/             # Tool implementations
│   │   ├── ToolManager.ts # Tool management
│   │   ├── analysis/      # Analysis tools
│   │   └── build/         # Build tools
│   ├── resources/         # Resource management
│   ├── prompts/           # Prompt management
│   ├── config/            # Configuration management
│   └── utils/             # Utility functions
├── config/                # Configuration files
│   ├── personas.yml       # Cognitive personas
│   ├── tools.yml          # Tool configurations
│   ├── patterns.yml       # Development patterns
│   └── settings.yml       # Global settings
├── docs/                  # Documentation
├── scripts/               # Installation scripts
└── tests/                 # Test files
```

## Adding New Tools

### 1. Create Tool Implementation

Create a new tool in the appropriate category directory:

```typescript
// src/tools/analysis/NewAnalysisTool.ts
import { z } from 'zod';
import { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { logger } from '../../utils/logger.js';

const NewAnalysisInputSchema = z.object({
  input: z.string().describe('Input parameter'),
  persona: z.string().optional().describe('Cognitive persona'),
});

type NewAnalysisInput = z.infer<typeof NewAnalysisInputSchema>;

export class NewAnalysisTool implements SuperAugmentTool {
  name = 'new_analysis';
  description = 'Description of the new analysis tool';
  inputSchema = NewAnalysisInputSchema.schema;

  constructor(private configManager: ConfigManager) {}

  async execute(args: NewAnalysisInput): Promise<any> {
    try {
      logger.info('Starting new analysis', { args });

      const validatedArgs = NewAnalysisInputSchema.parse(args);
      const persona = validatedArgs.persona 
        ? this.configManager.getPersona(validatedArgs.persona)
        : null;

      const result = await this.performAnalysis(validatedArgs, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatResult(result, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('New analysis failed:', error);
      throw error;
    }
  }

  private async performAnalysis(args: NewAnalysisInput, persona: any): Promise<any> {
    // Implementation logic here
    return {
      summary: 'Analysis completed',
      results: [],
    };
  }

  private formatResult(result: any, persona: any): string {
    // Format the result for display
    return `# Analysis Result\n\n${result.summary}`;
  }
}
```

### 2. Register Tool

Add the tool to `ToolManager.ts`:

```typescript
// src/tools/ToolManager.ts
import { NewAnalysisTool } from './analysis/NewAnalysisTool.js';

// In the initialize method:
this.registerTool(new NewAnalysisTool(this.configManager));
```

### 3. Add Configuration

Add tool configuration to `config/tools.yml`:

```yaml
- name: new_analysis
  description: "Description of the new analysis tool"
  category: "analysis"
  parameters:
    input:
      type: "string"
      description: "Input parameter"
      required: true
    persona:
      type: "string"
      description: "Cognitive persona"
      required: false
      enum: ["architect", "analyzer", "security"]
  personas: ["architect", "analyzer"]
  examples:
    - description: "Example usage"
      parameters:
        input: "example input"
        persona: "architect"
```

## Adding New Personas

### 1. Define Persona

Add persona to `config/personas.yml`:

```yaml
- name: new_persona
  description: "Description of the new persona"
  expertise:
    - "Area of expertise 1"
    - "Area of expertise 2"
  approach: "Description of the persona's approach"
  tools:
    - "tool1"
    - "tool2"
```

### 2. Update Tool Configurations

Update relevant tools in `config/tools.yml` to include the new persona:

```yaml
parameters:
  persona:
    enum: ["architect", "frontend", "backend", "new_persona"]
```

## Adding Resources

### 1. Create Resource

Add resource loading in `ResourceManager.ts`:

```typescript
// In loadCustomResources method:
this.resources.set('superaugment://custom/new-resource', {
  name: 'New Resource',
  description: 'Description of the new resource',
  mimeType: 'application/json',
  content: JSON.stringify(data, null, 2),
});
```

### 2. Add Resource Data

Create resource data file or add to existing configuration:

```yaml
# config/new-resource.yml
new_resource:
  property1: "value1"
  property2: "value2"
```

## Adding Prompts

### 1. Create Prompt

Add prompt in `PromptManager.ts`:

```typescript
// In registerCustomPrompts method:
this.prompts.set('new-prompt', {
  description: 'Description of the new prompt',
  arguments: [
    {
      name: 'parameter',
      description: 'Parameter description',
      required: true,
    },
  ],
  generator: async (args: any) => {
    return [
      {
        role: 'system',
        content: {
          type: 'text',
          text: 'System prompt content',
        },
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: `User prompt with ${args.parameter}`,
        },
      },
    ];
  },
});
```

## Testing

### Unit Tests

Create unit tests for new tools:

```typescript
// tests/tools/NewAnalysisTool.test.ts
import { NewAnalysisTool } from '../../src/tools/analysis/NewAnalysisTool.js';
import { ConfigManager } from '../../src/config/ConfigManager.js';

describe('NewAnalysisTool', () => {
  let tool: NewAnalysisTool;
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    tool = new NewAnalysisTool(configManager);
  });

  test('should execute analysis', async () => {
    const result = await tool.execute({
      input: 'test input',
    });

    expect(result).toBeDefined();
    expect(result.content).toHaveLength(1);
  });
});
```

### Integration Tests

Test MCP server integration:

```typescript
// tests/integration/server.test.ts
import { SuperAugmentServer } from '../../src/server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('SuperAugment Server Integration', () => {
  let server: Server;
  let superAugmentServer: SuperAugmentServer;

  beforeEach(async () => {
    server = new Server({ name: 'test', version: '1.0.0' }, { capabilities: {} });
    superAugmentServer = new SuperAugmentServer(server);
    await superAugmentServer.initialize();
  });

  test('should list tools', async () => {
    // Test tool listing
  });

  test('should call tools', async () => {
    // Test tool execution
  });
});
```

## Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define proper types and interfaces
- Use Zod for runtime validation
- Handle errors appropriately

### Naming Conventions

- **Files**: PascalCase for classes, camelCase for utilities
- **Classes**: PascalCase
- **Methods**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with 'I' prefix if needed

### Error Handling

```typescript
try {
  // Operation
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

## Contributing

### Pull Request Process

1. **Fork Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make Changes**
4. **Add Tests**
5. **Update Documentation**
6. **Submit Pull Request**

### Commit Messages

Use conventional commit format:

```
feat: add new analysis tool
fix: resolve persona loading issue
docs: update usage guide
test: add integration tests
```

### Code Review

- All changes require code review
- Tests must pass
- Documentation must be updated
- Follow coding standards

## Debugging

### Logging

Use the logger for debugging:

```typescript
import { logger } from '../utils/logger.js';

logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message', error);
```

### VS Code Debugging

Configure VS Code debugging in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug SuperAugment",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "tsx/cjs"]
    }
  ]
}
```

## Performance

### Optimization Guidelines

- Use async/await for I/O operations
- Implement proper caching
- Minimize memory usage
- Use streaming for large data

### Monitoring

- Monitor tool execution times
- Track memory usage
- Log performance metrics
- Use profiling tools when needed

## Security

### Best Practices

- Validate all inputs
- Sanitize user data
- Use secure dependencies
- Implement proper error handling
- Follow OWASP guidelines

### Input Validation

Always use Zod schemas for input validation:

```typescript
const InputSchema = z.object({
  userInput: z.string().max(1000),
  options: z.array(z.string()).optional(),
});

const validatedInput = InputSchema.parse(input);
```

## Release Process

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Update Documentation**

4. **Create Release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. **Publish Package** (if applicable)
   ```bash
   npm publish
   ```
