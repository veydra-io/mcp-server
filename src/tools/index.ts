/**
 * Veydra MCP Tools
 * Defines core tools for interacting with Veydra API
 * 
 * Read-only tools:
 * - list_models: List available models
 * - get_model: Get model details
 * - get_parameters: Get model parameters
 * - run_simulation: Run a simulation
 * - ask_model: Chat about a model
 * 
 * Editing tools:
 * - get_model_files: List files in a model repository
 * - get_model_file_content: Read a file from a model
 * - validate_model_code: Validate code against VMS compliance
 * - edit_model_file: Apply code changes to a model
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
  // ============ Editing Tools ============
  {
    name: "get_model_files",
    description:
      "List all files in a model repository. Returns file paths and metadata for all source, config, and documentation files.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
        branch: {
          type: "string",
          description: "Git branch to read from (default: main)",
        },
      },
      required: ["modelId"],
    },
  },
  {
    name: "get_model_file_content",
    description:
      "Read the content of a specific file from a model repository.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model",
        },
        filePath: {
          type: "string",
          description: "Path to the file within the model repository (e.g., 'src/model.py', 'config/model-parameters.json')",
        },
        branch: {
          type: "string",
          description: "Git branch to read from (default: main)",
        },
      },
      required: ["modelId", "filePath"],
    },
  },
  {
    name: "validate_model_code",
    description:
      "Validate Python code against VMS (Veydra Model Standard) compliance rules. Checks for: VARIABLES dict requirements, no initial_* parameters, Direct Flow Reference Rule, calc_* function conventions, no net_flow collapsing, and simulation.time_step usage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model to validate",
        },
        code: {
          type: "string",
          description: "Optional: Specific Python code to validate. If not provided, validates the entire model.",
        },
        fileName: {
          type: "string",
          description: "Optional: File name for context in error messages (default: 'code.py')",
        },
        strictMode: {
          type: "boolean",
          description: "If true, treat warnings as errors (default: false)",
        },
      },
      required: ["modelId"],
    },
  },
  {
    name: "edit_model_file",
    description:
      "Apply code changes to a model. Changes are validated against VMS, committed to GitHub, and synced to cloud storage. The model must be in 'design' or 'experiment' mode.",
    inputSchema: {
      type: "object" as const,
      properties: {
        modelId: {
          type: "number",
          description: "The unique ID of the model to edit",
        },
        codeChanges: {
          type: "array",
          description: "Array of code changes to apply",
          items: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Path to the file within the model repository (e.g., 'src/model.py')",
              },
              originalCode: {
                type: "string",
                description: "Original code snippet to replace (for targeted edits). If empty, newCode replaces entire file.",
              },
              newCode: {
                type: "string",
                description: "New code to insert",
              },
              description: {
                type: "string",
                description: "Description of the change (used in commit message)",
              },
            },
            required: ["filePath", "newCode", "description"],
          },
        },
      },
      required: ["modelId", "codeChanges"],
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

// Editing tool schemas
const GetModelFilesSchema = z.object({
  modelId: z.number(),
  branch: z.string().optional(),
});

const GetModelFileContentSchema = z.object({
  modelId: z.number(),
  filePath: z.string(),
  branch: z.string().optional(),
});

const ValidateModelCodeSchema = z.object({
  modelId: z.number(),
  code: z.string().optional(),
  fileName: z.string().optional(),
  strictMode: z.boolean().optional(),
});

const CodeChangeSchema = z.object({
  filePath: z.string(),
  originalCode: z.string().optional(),
  newCode: z.string(),
  description: z.string(),
});

const EditModelFileSchema = z.object({
  modelId: z.number(),
  codeChanges: z.array(CodeChangeSchema),
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

      // ============ Editing Tool Handlers ============
      
      case "get_model_files": {
        const params = GetModelFilesSchema.parse(args);
        const response = await client.getModelFiles(params.modelId, params.branch);

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

      case "get_model_file_content": {
        const params = GetModelFileContentSchema.parse(args);
        const response = await client.getModelFileContent(
          params.modelId, 
          params.filePath, 
          params.branch
        );

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

      case "validate_model_code": {
        const params = ValidateModelCodeSchema.parse(args);
        const response = await client.validateModelCode(
          params.modelId,
          params.code,
          params.fileName,
          params.strictMode
        );

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

      case "edit_model_file": {
        const params = EditModelFileSchema.parse(args);
        
        // Transform codeChanges format for API
        const apiCodeChanges = params.codeChanges.map(change => ({
          file_path: change.filePath,
          original_code: change.originalCode || "",
          new_code: change.newCode,
          description: change.description,
        }));

        const response = await client.applyCodeChanges(params.modelId, apiCodeChanges);

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
