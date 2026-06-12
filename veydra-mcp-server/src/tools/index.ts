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
    name: "get_scenario",
    description:
      "Get a saved scenario for a model, including parameter values.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
        scenarioId: {
          type: "string",
          description: "Saved scenario ID",
        },
      },
      required: ["modelId", "scenarioId"],
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
    name: "run_scenario",
    description:
      "Run a saved scenario by ID, with optional parameter overrides.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
        scenarioId: {
          type: "string",
          description: "Saved scenario ID",
        },
        parameterOverrides: {
          type: "object",
          description: "Optional parameter overrides applied on top of the saved scenario",
          additionalProperties: true,
        },
      },
      required: ["modelId", "scenarioId"],
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
  {
    name: "create_model",
    description:
      "Create a new model in your workspace. Optionally assign it to a project and set metadata.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Model title (required)",
        },
        description: {
          type: "string",
          description: "Optional model description",
        },
        projectId: {
          type: "number",
          description: "Optional project ID. If omitted, a new project is created automatically.",
        },
        category: {
          type: "string",
          description: "Optional category",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags",
        },
      },
      required: ["title"],
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

const GetScenarioSchema = z.object({
  modelId: z.number(),
  scenarioId: z.string().min(1),
});

const RunSimulationSchema = z.object({
  modelId: z.number(),
  parameters: z.record(z.unknown()).optional(),
  scenarioId: z.string().optional(),
});

const RunScenarioSchema = z.object({
  modelId: z.number(),
  scenarioId: z.string().min(1),
  parameterOverrides: z.record(z.unknown()).optional(),
});

const AskModelSchema = z.object({
  modelId: z.number(),
  message: z.string(),
});

const CreateModelSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
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

      case "get_scenario": {
        const params = GetScenarioSchema.parse(args);
        const response = await client.getScenario(params.modelId, params.scenarioId);

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

      case "run_scenario": {
        const params = RunScenarioSchema.parse(args);
        const modelResponse = await client.getModel(params.modelId);

        if (modelResponse.error) {
          return {
            content: [{ type: "text", text: `Error: ${modelResponse.error}` }],
          };
        }

        const scenarioResponse = await client.getScenario(params.modelId, params.scenarioId);
        if (scenarioResponse.error) {
          return {
            content: [{ type: "text", text: `Error: ${scenarioResponse.error}` }],
          };
        }

        const scenarioData = (scenarioResponse.data || {}) as Record<string, unknown>;
        const scenarioParams =
          scenarioData.parameters && typeof scenarioData.parameters === "object"
            ? (scenarioData.parameters as Record<string, unknown>)
            : {};
        const mergedParams = { ...scenarioParams, ...(params.parameterOverrides || {}) };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  model: modelResponse.data,
                  scenario: scenarioData,
                  parameters: mergedParams,
                  message:
                    "Scenario parameters prepared. In the full implementation, this would execute the model via Pyodide or backend worker.",
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

      case "create_model": {
        const params = CreateModelSchema.parse(args);
        let resolvedProjectId = params.projectId;
        let projectCreated = false;

        if (resolvedProjectId === undefined) {
          const projectResponse = await client.createProject({
            name: `${params.title} Project`,
            description: params.description || "Project created by MCP create_model",
          });

          if (projectResponse.error) {
            return {
              content: [{ type: "text", text: `Error: ${projectResponse.error}` }],
            };
          }

          const projectData = (projectResponse.data || {}) as Record<string, unknown>;
          const projectKeyIdRaw = projectData.project_key_id ?? projectData.project_id;
          if (typeof projectKeyIdRaw !== "number") {
            return {
              content: [{ type: "text", text: "Error: project creation did not return project_key_id" }],
            };
          }

          resolvedProjectId = projectKeyIdRaw;
          projectCreated = true;
        }

        const response = await client.createModel({
          name: params.title,
          description: params.description,
          project_key_id: resolvedProjectId,
        });

        if (response.error) {
          return {
            content: [{ type: "text", text: `Error: ${response.error}` }],
          };
        }

        const raw = (response.data || {}) as Record<string, unknown>;
        const modelId = raw.id;

        const normalized = {
          id: modelId,
          title: params.title,
          projectId: resolvedProjectId,
          projectCreated,
          createdAt: new Date().toISOString(),
          webUrl: typeof modelId === "number" ? `https://app.veydra.io/model/${modelId}` : undefined,
          category: params.category,
          tags: params.tags || [],
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(normalized, null, 2) },
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
