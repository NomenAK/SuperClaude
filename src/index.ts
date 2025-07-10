#!/usr/bin/env node

/**
 * SuperAugment MCP Server
 * 
 * A powerful MCP server that enhances VS Code Augment with specialized
 * development tools, cognitive personas, and intelligent workflows.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SuperAugmentServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  try {
    // Create the MCP server instance
    const server = new Server(
      {
        name: 'superaugment',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize SuperAugment server
    const superAugmentServer = new SuperAugmentServer(server);
    await superAugmentServer.initialize();

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('SuperAugment MCP Server started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start SuperAugment MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});
