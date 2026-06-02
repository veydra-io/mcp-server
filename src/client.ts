/**
 * Veydra API Client
 * Handles authentication and API requests to api.veydra.io
 */

export interface VeydraClientOptions {
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export class VeydraClient {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;

  constructor(options: VeydraClientOptions) {
    this.apiKey = options.apiKey;
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl || "https://api.veydra.io";
  }

  /**
   * Set OAuth access token (for ChatGPT integrations)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      // OAuth token takes precedence
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      // API key authentication
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json() as T;

      if (!response.ok) {
        const errorData = data as Record<string, unknown>;
        return {
          error: String(errorData.message || errorData.error || `HTTP ${response.status}`),
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      };
    }
  }

  // ============ Model Endpoints ============

  /**
   * List models with optional filters
   */
  async listModels(options?: {
    includeInLibrary?: boolean;
    projectId?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.includeInLibrary) params.set("includeInLibrary", "true");
    if (options?.projectId) params.set("project_key_id", String(options.projectId));
    if (options?.limit) params.set("limit", String(options.limit));

    const query = params.toString();
    return this.request<unknown[]>("GET", `/v1/model${query ? `?${query}` : ""}`);
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: number) {
    return this.request<unknown>("GET", `/v1/model/${modelId}`);
  }

  /**
   * Get model parameters
   */
  async getParameters(modelId: number) {
    return this.request<unknown>("GET", `/v1/model/${modelId}/parameters`);
  }

  /**
   * Get model flow diagram
   */
  async getFlowDiagram(modelId: number) {
    return this.request<unknown>("GET", `/v1/model/${modelId}/flow-diagram`);
  }

  // ============ Scenario Endpoints ============

  /**
   * List scenarios for a model
   */
  async listScenarios(modelId: number) {
    return this.request<unknown[]>("GET", `/v1/model/${modelId}/scenarios`);
  }

  /**
   * Get a specific scenario
   */
  async getScenario(modelId: number, scenarioId: string) {
    return this.request<unknown>("GET", `/v1/model/${modelId}/scenarios/${scenarioId}`);
  }

  // ============ Chat/AI Endpoints ============

  /**
   * Chat with AI about a model
   */
  async chat(modelId: number, message: string) {
    return this.request<unknown>("POST", `/v1/model/${modelId}/chat`, {
      message,
    });
  }

  // ============ File/Editing Endpoints ============

  /**
   * Get list of files in a model repository
   */
  async getModelFiles(modelId: number, branch?: string) {
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    const query = params.toString();
    return this.request<unknown>("GET", `/v1/model/${modelId}/files${query ? `?${query}` : ""}`);
  }

  /**
   * Get content of a specific file from a model repository
   */
  async getModelFileContent(modelId: number, filePath: string, branch?: string) {
    // The API uses path-based routing: /v1/model/{id}/file/{path}
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    const query = params.toString();
    return this.request<unknown>("GET", `/v1/model/${modelId}/file/${encodedPath}${query ? `?${query}` : ""}`);
  }

  /**
   * Validate code against VMS (Veydra Model Standard) compliance
   */
  async validateModelCode(
    modelId: number,
    code?: string,
    fileName?: string,
    strictMode?: boolean
  ) {
    return this.request<unknown>("POST", `/v1/model/${modelId}/validate-vms`, {
      code,
      file_name: fileName,
      strict_mode: strictMode,
    });
  }

  /**
   * Apply code changes to a model
   */
  async applyCodeChanges(
    modelId: number,
    codeChanges: Array<{
      file_path: string;
      original_code?: string;
      new_code: string;
      description: string;
    }>
  ) {
    return this.request<unknown>("POST", `/v1/model/${modelId}/apply-code-changes`, {
      code_changes: codeChanges,
    });
  }
}
