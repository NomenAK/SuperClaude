import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import logger from "@logger";
import { GitHubSourceLoader } from "@/sources/index.js";
import { SuperClaudeCommand, Persona, SuperClaudeRules } from "@types";

/**
 * Creates and configures an MCP server instance with all handlers
 */
export function createMCPServer(
  commands: SuperClaudeCommand[],
  personas: Record<string, Persona>,
  rules: SuperClaudeRules | null,
  githubLoader: GitHubSourceLoader,
  onSync: () => Promise<void>
): McpServer {
  const server = new McpServer(
    {
      name: "superclaude-mcp",
      version: "1.0.0",
      description: "MCP server exposing SuperClaude commands as prompts",
    },
    {
      capabilities: {
        prompts: {},
        tools: {},
        resources: {},
      },
    }
  );

  // Register tool for direct sync
  server.tool("sync", "Trigger immediate synchronization with GitHub", {}, async () => {
    try {
      logger.info("Direct sync triggered via MCP tool");
      await onSync();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Sync completed successfully",
              commandsCount: commands.length,
              personasCount: Object.keys(personas).length,
              rulesCount: rules?.rules?.length || 0,
            }),
          },
        ],
      };
    } catch (error) {
      logger.error({ error }, "Direct sync failed");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
      };
    }
  });

  // Get the low-level server instance for registering handlers
  const lowLevelServer = server.server;

  // List available prompts
  lowLevelServer.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        arguments: cmd.arguments,
      })),
    };
  });

  // Get specific prompt by name
  lowLevelServer.setRequestHandler(GetPromptRequestSchema, async request => {
    const commandName = request.params.name;
    const args = request.params.arguments as Record<string, string> | undefined;
    const command = commands.find(cmd => cmd.name === commandName);

    if (!command) {
      throw new Error(`Prompt not found: ${commandName}`);
    }

    let content = command.prompt;

    // Process @include directives
    const includeMatches = content.match(/@include\s+[\w\-\/\.]+/g);
    if (includeMatches) {
      const includeContents = await githubLoader.loadSharedIncludes(includeMatches);
      for (const match of includeMatches) {
        content = content.replace(match, includeContents);
      }
    }

    // Replace argument placeholders
    if (command.arguments && args) {
      for (const arg of command.arguments) {
        const argValue = args[arg.name];
        if (argValue) {
          content = content.replace(new RegExp(`\\$${arg.name}`, "g"), argValue);
        }
      }
    }

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: content,
          },
        },
      ],
    };
  });

  lowLevelServer.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: "superclaude://personas/{personaId}",
          name: "SuperClaude Persona",
          description: "Access a specific SuperClaude persona by ID",
          mimeType: "application/json",
        },
        {
          uriTemplate: "superclaude://rules/{ruleId}",
          name: "SuperClaude Rule",
          description: "Access a specific SuperClaude rule by name",
          mimeType: "application/json",
        },
      ],
    };
  });

  // List available resources
  lowLevelServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [];

    // Add individual rule resources
    if (rules?.rules) {
      for (const rule of rules.rules) {
        resources.push({
          uri: `superclaude://rules/${encodeURIComponent(rule.name)}`,
          name: rule.name,
          description: rule.content.substring(0, 100) + (rule.content.length > 100 ? "..." : ""),
          mimeType: "application/json",
        });
      }
    }

    // Add persona resources
    for (const [personaId, persona] of Object.entries(personas)) {
      resources.push({
        uri: `superclaude://personas/${personaId}`,
        name: persona.name,
        description: persona.description,
        mimeType: "application/json",
      });
    }

    return { resources };
  });

  // Read specific resource
  lowLevelServer.setRequestHandler(ReadResourceRequestSchema, async request => {
    const uri = request.params.uri;

    // Handle individual rule resources
    const ruleMatch = uri.match(/^superclaude:\/\/rules\/(.+)$/);
    if (ruleMatch) {
      const ruleId = decodeURIComponent(ruleMatch[1]);

      if (!rules?.rules) {
        throw new Error("Rules not loaded");
      }

      const rule = rules.rules.find(r => r.name === ruleId);

      if (!rule) {
        throw new Error(`Rule resource not found: ${ruleId}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                name: rule.name,
                content: rule.content,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Handle persona resources
    const personaMatch = uri.match(/^superclaude:\/\/personas\/(.+)$/);
    if (personaMatch) {
      const personaId = personaMatch[1];
      const persona = personas[personaId];

      if (!persona) {
        throw new Error(`Persona resource not found: ${personaId}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                id: personaId,
                ...persona,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  return server;
}
