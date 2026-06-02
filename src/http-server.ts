#!/usr/bin/env node

/**
 * Veydra MCP HTTP Server
 * Streamable HTTP transport for remote MCP access at mcp.veydra.io
 */

import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  JSONRPCMessage,
} from "@modelcontextprotocol/sdk/types.js";

import { VeydraClient } from "./client.js";
import { tools, handleToolCall } from "./tools/index.js";
import { prompts, getPrompt } from "./prompts/index.js";

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 8080;
const API_URL = process.env.VEYDRA_API_URL || "https://api.veydra.io";

// In-memory session storage (will be Firestore later)
interface MCPSession {
  id: string;
  client: VeydraClient;
  userId?: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

const sessions: Map<string, MCPSession> = new Map();

// Session cleanup interval (remove sessions older than 1 hour)
setInterval(() => {
  const now = new Date();
  for (const [id, session] of sessions.entries()) {
    const age = now.getTime() - session.lastAccessedAt.getTime();
    if (age > 3600000) { // 1 hour
      sessions.delete(id);
      console.log(`[Session] Cleaned up expired session: ${id}`);
    }
  }
}, 60000); // Check every minute

/**
 * Extract and validate authorization token
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return authHeader;
}

/**
 * Get or create a session
 */
function getSession(req: Request): MCPSession | null {
  const sessionId = req.headers["mcp-session-id"] as string;
  const token = extractToken(req);
  
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    session.lastAccessedAt = new Date();
    return session;
  }
  
  // For new sessions, we need a token
  if (!token) {
    return null;
  }
  
  return null;
}

/**
 * Create a new session with authenticated client
 */
function createSession(token: string): MCPSession {
  const session: MCPSession = {
    id: randomUUID(),
    client: new VeydraClient({
      baseUrl: API_URL,
      apiKey: token.startsWith("vk_") ? token : undefined,
      accessToken: !token.startsWith("vk_") ? token : undefined,
    }),
    createdAt: new Date(),
    lastAccessedAt: new Date(),
  };
  
  sessions.set(session.id, session);
  console.log(`[Session] Created new session: ${session.id}`);
  return session;
}

/**
 * Handle JSON-RPC request and return response
 */
async function handleRPCRequest(
  client: VeydraClient,
  message: JSONRPCMessage
): Promise<JSONRPCMessage> {
  const request = message as { method: string; id?: string | number; params?: unknown };
  
  try {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              prompts: {},
            },
            serverInfo: {
              name: "veydra-mcp-server",
              version: "0.1.0",
            },
          },
        } as JSONRPCMessage;

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { tools },
        } as JSONRPCMessage;

      case "tools/call": {
        const params = request.params as { name: string; arguments?: unknown };
        const result = await handleToolCall(client, params.name, params.arguments);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        } as JSONRPCMessage;
      }

      case "prompts/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { prompts },
        } as JSONRPCMessage;

      case "prompts/get": {
        const params = request.params as { name: string; arguments?: Record<string, string> };
        const result = getPrompt(params.name, params.arguments);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        } as JSONRPCMessage;
      }

      case "notifications/initialized":
        // Client notification, no response needed
        return null as unknown as JSONRPCMessage;

      default:
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        } as JSONRPCMessage;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: errorMessage,
      },
    } as JSONRPCMessage;
  }
}

/**
 * Landing page with ASCII art and setup instructions
 */
const LANDING_PAGE = `

      :::     ::: :::::::::: :::   ::: :::::::::  :::::::::      :::     
     :+:     :+: :+:        :+:   :+: :+:    :+: :+:    :+:   :+: :+:    
    +:+     +:+ +:+         +:+ +:+  +:+    +:+ +:+    +:+  +:+   +:+   
   +#+     +:+ +#++:++#     +#++:   +#+    +:+ +#++:++#:  +#++:++#++:  
  +#+   +#+  +#+           +#+    +#+    +#+ +#+    +#+ +#+     +#+   
  #+#+#+#   #+#           #+#    #+#    #+# #+#    #+# #+#     #+#    
   ###     ##########    ###    #########  ###    ### ###     ###     


================================================================================
VEYDRA MCP SERVER
================================================================================

Run system dynamics simulations with AI. Connect your AI tools to Veydra
via Model Context Protocol.


SETUP
-----

**For Claude Desktop or Claude.ai:**

1. Open Settings → Connectors
2. Add a new custom connector
3. Enter the URL: \`https://api.veydra.io/mcp\`
4. Follow the OAuth prompts to log in to your Veydra account

**For ChatGPT:**

1. Navigate to Settings → Apps → Advanced settings → Enable Developer mode
2. Click Create App
3. Fill in the Name and MCP Server URL
4. Add the MCP Server URL: \`https://api.veydra.io/mcp\`
5. Complete the OAuth flow to authenticate with Veydra

**For Gemini CLI / Claude Code (using API key):**

Add to your MCP configuration:

{
  "mcpServers": {
    "veydra": {
      "url": "https://api.veydra.io/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_VEYDRA_API_KEY"
      }
    }
  }
}

Get your API key at: https://veydra.io/settings/api-keys


AVAILABLE TOOLS
---------------
• list_models     - List available simulation models
• get_model       - Get model details and structure  
• get_parameters  - Get adjustable model parameters
• run_simulation  - Execute simulation with parameters
• ask_model       - Chat with AI about a model


RESOURCES
---------
Documentation    https://docs.veydra.io
API Reference    https://docs.veydra.io/api-reference
Dashboard        https://veydra.io

`;

/**
 * Routes
 */

// Landing page
app.get("/", (req: Request, res: Response) => {
  res.type("text/plain").send(LANDING_PAGE);
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// MCP endpoint - POST for JSON-RPC messages
app.post("/mcp", async (req: Request, res: Response) => {
  const token = extractToken(req);
  let sessionId = req.headers["mcp-session-id"] as string;
  
  // Get or create session
  let session = sessionId ? sessions.get(sessionId) : null;
  
  if (!session) {
    if (!token) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required. Provide Authorization header with API key or OAuth token.",
        },
        id: req.body?.id,
      });
      return;
    }
    session = createSession(token);
    sessionId = session.id;
  }
  
  session.lastAccessedAt = new Date();
  
  const message = req.body as JSONRPCMessage;
  
  // Check if client accepts SSE
  const acceptsSSE = req.headers.accept?.includes("text/event-stream");
  
  try {
    const response = await handleRPCRequest(session.client, message);
    
    if (response === null) {
      // Notification, no response
      res.status(202).end();
      return;
    }
    
    if (acceptsSSE) {
      // Stream response as SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Mcp-Session-Id", sessionId);
      
      res.write(`event: message\n`);
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.end();
    } else {
      // JSON response
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Mcp-Session-Id", sessionId);
      res.json(response);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: errorMessage,
      },
      id: req.body?.id,
    });
  }
});

// MCP endpoint - GET for SSE stream (server-initiated messages)
app.get("/mcp", (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({
      error: "Invalid or missing session. Send a POST request first to initialize.",
    });
    return;
  }
  
  const session = sessions.get(sessionId)!;
  session.lastAccessedAt = new Date();
  
  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Mcp-Session-Id", sessionId);
  
  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);
  
  // Clean up on close
  req.on("close", () => {
    clearInterval(heartbeat);
    console.log(`[SSE] Client disconnected from session: ${sessionId}`);
  });
  
  // Send initial connected event
  res.write(`event: open\n`);
  res.write(`data: {"type":"connected","sessionId":"${sessionId}"}\n\n`);
});

// MCP endpoint - DELETE to terminate session
app.delete("/mcp", (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`[Session] Deleted session: ${sessionId}`);
    res.status(200).json({ message: "Session terminated" });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Veydra MCP Server running on port ${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}/`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

export default app;
