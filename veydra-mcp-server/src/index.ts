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
import {
  clearStoredToken,
  loadStoredToken,
  refreshStoredToken,
  runOAuthLogin,
  runWhoAmI,
  tokenNeedsRefresh,
} from "./oauth-cli.js";

const defaultApiUrl = process.env.VEYDRA_API_URL || "https://api.veydra.io";

function printHelp(): void {
  console.log("Veydra MCP CLI");
  console.log("");
  console.log("Commands:");
  console.log("  login    Authenticate with OAuth in your browser");
  console.log("  logout   Clear stored OAuth credentials");
  console.log("  whoami   Show current authenticated user");
  console.log("");
  console.log("When called without a command, starts MCP stdio server mode.");
}

async function resolveRuntimeAuth(): Promise<{ apiKey?: string; accessToken?: string; baseUrl: string }> {
  const explicitApiKey = process.env.VEYDRA_API_KEY;
  if (explicitApiKey) {
    return {
      apiKey: explicitApiKey,
      baseUrl: defaultApiUrl,
    };
  }

  let stored = loadStoredToken();
  if (!stored) {
    return { baseUrl: defaultApiUrl };
  }

  if (tokenNeedsRefresh(stored)) {
    const refreshed = await refreshStoredToken(stored);
    if (refreshed) {
      stored = refreshed;
    }
  }

  return {
    accessToken: stored.access_token,
    baseUrl: stored.api_url || defaultApiUrl,
  };
}

async function maybeHandleCommand(): Promise<boolean> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    return false;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return true;
  }

  if (command === "login") {
    await runOAuthLogin(defaultApiUrl);
    console.log("OAuth login successful.");
    return true;
  }

  if (command === "logout") {
    clearStoredToken();
    console.log("OAuth credentials cleared.");
    return true;
  }

  if (command === "whoami") {
    let stored = loadStoredToken();
    if (!stored) {
      console.error("Not logged in. Run: veydra-mcp login");
      process.exitCode = 1;
      return true;
    }

    if (tokenNeedsRefresh(stored)) {
      const refreshed = await refreshStoredToken(stored);
      if (refreshed) {
        stored = refreshed;
      }
    }

    const identity = await runWhoAmI(stored);
    console.log(`api: ${stored.api_url}`);
    if (identity.uid) {
      console.log(`uid: ${identity.uid}`);
    }
    if (identity.email) {
      console.log(`email: ${identity.email}`);
    }
    if (!identity.uid && !identity.email) {
      console.log("Authenticated, but user profile fields were not returned.");
    }
    return true;
  }

  return false;
}

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
let client!: VeydraClient;

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
  if (await maybeHandleCommand()) {
    return;
  }

  const auth = await resolveRuntimeAuth();
  client = new VeydraClient({
    apiKey: auth.apiKey,
    accessToken: auth.accessToken,
    baseUrl: auth.baseUrl,
  });

  if (!auth.apiKey && !auth.accessToken) {
    console.error("No authentication configured. Set VEYDRA_API_KEY or run: veydra-mcp login");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Veydra MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
