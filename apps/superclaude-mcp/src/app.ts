import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { pinoHttp } from "pino-http";
import logger from "@logger";
import server from "@/http-server.js";

const app: express.Application = express();

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: any) => req.url === "/healthz",
    },
  })
);

app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/sync", async (_req, res) => {
  try {
    logger.info("Manual sync triggered via API");
    await server.triggerSync();
    res.json({ success: true, message: "Sync completed successfully" });
  } catch (error) {
    logger.error({ error }, "Manual sync failed");
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    logger.debug({ method: req.body.method }, "Handling MCP request");

    const newServer = server.createInstance();

    res.on("close", () => {
      logger.debug("Request closed");
      transport.close();
      newServer.close();
    });

    await newServer.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error(
      { error, stack: (error as Error).stack, message: (error as Error).message },
      "Error handling MCP request"
    );
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default app;
