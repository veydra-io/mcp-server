/**
 * Veydra MCP Tools
 * Defines the 5 core tools for interacting with Veydra API
 */

import { z } from "zod";
import type { VeydraClient } from "../client.js";

// Tool definitions for MCP
export const tools = [
  {
    name: "list_models",
    description:
      "List available simulation models. Returns models you have access to, optionally filtered by library inclusion or project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        includeInLibrary: {
          type: "boolean",
          description: "Filter to only models included in the public library",
        },
        projectId: {
          type: "number",
          description: "Filter models by project ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of models to return (default: 20)",
        },
      },
    },
  },
  {
    name: "get_model",
    description:
      "Get detailed information about a specific model, including its description, category, tags, and available modes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
      },
      required: ["modelId"],
    },
  },
  {
    name: "get_parameters",
    description:
      "Get the adjustable parameters for a model. Returns parameter definitions including min/max values, defaults, and descriptions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
      },
      required: ["modelId"],
    },
  },
  {
    name: "run_simulation",
    description:
      "Execute a simulation with the specified parameters. Returns simulation results including time series data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model to run",
        },
        parameters: {
          type: "object",
          description:
            "Parameter overrides as key-value pairs. Keys should match parameter IDs from get_parameters.",
          additionalProperties: true,
        },
        scenarioId: {
          type: "string",
          description: "Optional scenario ID to use pre-saved parameters",
        },
      },
      required: ["modelId"],
    },
  },
  {
    name: "ask_model",
    description:
      "Chat with an AI assistant about a model. Ask questions about the model structure, behavior, or request explanations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model to discuss",
        },
        message: {
          type: "string",
          description: "Your question or request about the model",
        },
      },
      required: ["modelId", "message"],
    },
  },
];

// Input validation schemas
const ListModelsSchema = z.object({
  includeInLibrary: z.boolean().optional(),
  projectId: z.number().optional(),
  limit: z.number().optional(),
});

const GetModelSchema = z.object({
  modelId: z.number(),
});

const GetParametersSchema = z.object({
  modelId: z.number(),
});

const RunSimulationSchema = z.object({
  modelId: z.number(),
  parameters: z.record(z.unknown()).optional(),
  scenarioId: z.string().optional(),
});

const AskModelSchema = z.object({
  modelId: z.number(),
  message: z.string(),
});

/**
 * Handle tool calls from the MCP server
 */
export async function handleToolCall(
  client: VeydraClient,
  name: string,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    switch (name) {
      case "list_models": {
        const params = ListModelsSchema.parse(args);
        const response = await client.listModels(params);

        if (response.error) {
          return {
            content: [{ type: "text", text: `Error: ${response.error}` }],
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      }

      case "get_model": {
        const params = GetModelSchema.parse(args);
        const response = await client.getModel(params.modelId);

        if (response.error) {
          return {
            content: [{ type: "text", text: `Error: ${response.error}` }],
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      }

      case "get_parameters": {
        const params = GetParametersSchema.parse(args);
        const response = await client.getParameters(params.modelId);

        if (response.error) {
          return {
            content: [{ type: "text", text: `Error: ${response.error}` }],
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      }

      case "run_simulation": {
        const params = RunSimulationSchema.parse(args);
        
        // For now, simulations run client-side via Pyodide
        // This tool fetches the model and scenario, then returns setup info
        const modelResponse = await client.getModel(params.modelId);
        
        if (modelResponse.error) {
          return {
            content: [{ type: "text", text: `Error: ${modelResponse.error}` }],
          };
        }

        // If scenarioId provided, fetch scenario parameters
        let scenarioParams = {};
        if (params.scenarioId) {
          const scenarioResponse = await client.getScenario(
            params.modelId,
            params.scenarioId
          );
          if (scenarioResponse.data) {
            scenarioParams = (scenarioResponse.data as Record<string, unknown>).parameters || {};
          }
        }

        // Merge scenario params with provided params (provided take precedence)
        const finalParams = { ...scenarioParams, ...params.parameters };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  model: modelResponse.data,
                  parameters: finalParams,
                  message:
                    "Simulation parameters prepared. In the full implementation, this would execute the model via Pyodide or backend worker.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "ask_model": {
        const params = AskModelSchema.parse(args);
        const response = await client.chat(params.modelId, params.message);

        if (response.error) {
          return {
            content: [{ type: "text", text: `Error: ${response.error}` }],
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
}
