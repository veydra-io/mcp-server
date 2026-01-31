#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { VeydraClient } from "./client.js";
import { tools, handleToolCall } from "./tools/index.js";
import { prompts, getPrompt } from "./prompts/index.js";

const server = new Server(
  {
    name: "veydra-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Initialize the Veydra API client
const client = new VeydraClient({
  apiKey: process.env.VEYDRA_API_KEY,
  baseUrl: process.env.VEYDRA_API_URL || "https://api.veydra.io",
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(client, name, args);
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return getPrompt(name, args);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Veydra MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
