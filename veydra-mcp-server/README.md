# Veydra MCP Server

An MCP (Model Context Protocol) server for the [Veydra](https://veydra.io) system dynamics modeling platform. This server enables AI agents to interact with Veydra's simulation models, run scenarios, and analyze results.

## Installation

### NPM (for Gemini CLI, Claude Code, etc.)

```bash
npm install -g @veydra-io/mcp-server
```

### Manual Configuration

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "veydra": {
      "command": "npx",
      "args": ["@veydra-io/mcp-server"]
    }
  }
}
```

## Authentication

The server supports two authentication methods:

### OAuth 2.0 (Recommended for CLI tools)

Run login once to complete browser-based OAuth:

```bash
veydra-mcp login
```

This opens your browser to Veydra auth, then stores credentials locally for future MCP runs.

Helpful commands:

```bash
veydra-mcp whoami
veydra-mcp logout
```

### API Key (Fallback for automation/CI)

Set the `VEYDRA_API_KEY` environment variable with your API key from the [Veydra Dashboard](https://app.veydra.io/account/api-keys).

```bash
export VEYDRA_API_KEY=vk_your_api_key_here
```

## Available Tools

### `list_models`
List available simulation models with optional filters.

**Parameters:**
- `includeInLibrary` (boolean, optional): Filter to library models only
- `projectId` (number, optional): Filter by project ID
- `limit` (number, optional): Maximum results (default: 20)

### `get_model`
Get detailed information about a specific model.

**Parameters:**
- `modelId` (number, required): The model ID

### `get_parameters`
Get the adjustable parameters for a model.

**Parameters:**
- `modelId` (number, required): The model ID

### `run_simulation`
Execute a simulation with specified parameters.

**Parameters:**
- `modelId` (number, required): The model ID
- `parameters` (object, optional): Parameter overrides
- `scenarioId` (string, optional): Use a saved scenario

### `ask_model`
Chat with an AI assistant about a model.

**Parameters:**
- `modelId` (number, required): The model ID
- `message` (string, required): Your question or request

## Available Prompts

### `analyze_model`
Explain the stocks, flows, and feedback loops in a model.

### `suggest_scenario`
Suggest parameter changes to test a specific policy intervention.

### `interpret_results`
Interpret simulation results and identify key insights.

## Configuration

| Environment Variable | Description | Required |
|---------------------|-------------|----------|
| `VEYDRA_API_KEY` | Your Veydra API key (overrides OAuth session if set) | No |
| `VEYDRA_API_URL` | API base URL (default: `https://api.veydra.io`) | No |

## Usage Examples

### With Gemini CLI

```bash
gemini mcp add veydra -- npx @veydra-io/mcp-server
```

### With Claude Code

Add to your Claude Code MCP settings:

```json
{
  "veydra": {
    "command": "npx",
    "args": ["@veydra-io/mcp-server"]
  }
}
```

## Documentation

- [Veydra Documentation](https://docs.veydra.io)
- [API Reference](https://docs.veydra.io/api-reference)
- [MCP Protocol](https://modelcontextprotocol.io)

## License

MIT
