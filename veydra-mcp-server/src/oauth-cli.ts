import { createHash, randomBytes } from "crypto";
import { createServer } from "http";
import { spawn } from "child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

export interface StoredOAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_at?: string;
  api_url: string;
  client_id?: string;
}

interface OAuthRegisterResponse {
  client_id: string;
  client_secret?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface OAuthCallbackResult {
  code: string;
  state: string;
  redirectUri: string;
}

function oauthStorePath(): string {
  return join(homedir(), ".veydra", "mcp-oauth.json");
}

function saveToken(token: StoredOAuthToken): void {
  const filePath = oauthStorePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(token, null, 2), { encoding: "utf8" });
}

export function clearStoredToken(): void {
  const filePath = oauthStorePath();
  try {
    rmSync(filePath, { force: true });
  } catch {
    // no-op
  }
}

export function loadStoredToken(): StoredOAuthToken | null {
  const filePath = oauthStorePath();
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredOAuthToken;
    if (!parsed.access_token || !parsed.api_url) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function generatePkceVerifier(): string {
  return toBase64Url(randomBytes(64));
}

function generatePkceChallenge(verifier: string): string {
  return toBase64Url(createHash("sha256").update(verifier).digest());
}

function openBrowser(url: string): boolean {
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true });
      return true;
    }
    if (process.platform === "darwin") {
      spawn("open", [url], { stdio: "ignore", detached: true });
      return true;
    }
    spawn("xdg-open", [url], { stdio: "ignore", detached: true });
    return true;
  } catch {
    return false;
  }
}

async function waitForAuthCallback(port: number, timeoutMs = 180000): Promise<OAuthCallbackResult> {
  return new Promise((resolve, reject) => {
    let listenPort = port;
    const server = createServer((req, res) => {
      try {
        const base = `http://127.0.0.1:${listenPort}`;
        const incoming = new URL(req.url || "/", base);
        const code = incoming.searchParams.get("code") || "";
        const state = incoming.searchParams.get("state") || "";
        const error = incoming.searchParams.get("error");
        const errorDescription = incoming.searchParams.get("error_description") || "";

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h2>Veydra authorization failed.</h2><p>You can close this window and retry in your terminal.</p>");
          cleanup();
          reject(new Error(`${error}: ${errorDescription}`));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h2>Missing authorization code.</h2><p>You can close this window and retry in your terminal.</p>");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h2>Veydra authorization complete.</h2><p>You can return to your terminal.</p>");
        cleanup();
        resolve({ code, state, redirectUri: `${base}/callback` });
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error("Callback handling failed"));
      }
    });

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for OAuth callback"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      server.close();
    }

    server.listen(port, "127.0.0.1", () => {
      const info = server.address();
      if (!info || typeof info === "string") {
        cleanup();
        reject(new Error("Failed to bind local callback server"));
        return;
      }
      listenPort = info.port;
    });

    server.on("error", (error) => {
      cleanup();
      reject(error);
    });

    server.on("listening", () => {
      const info = server.address();
      if (info && typeof info !== "string") {
        listenPort = info.port;
      }
    });
  });
}

async function registerOAuthClient(apiUrl: string, redirectUri: string): Promise<OAuthRegisterResponse> {
  const response = await fetch(`${apiUrl}/v1/oauth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_name: "Veydra MCP CLI",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });

  const body = (await response.json()) as OAuthRegisterResponse | { error?: string; error_description?: string };
  if (!response.ok || !("client_id" in body) || !body.client_id) {
    throw new Error(
      `OAuth client registration failed: ${(body as { error_description?: string }).error_description || response.statusText}`
    );
  }

  return body;
}

async function exchangeAuthorizationCode(options: {
  apiUrl: string;
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
}): Promise<OAuthTokenResponse> {
  const response = await fetch(`${options.apiUrl}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: options.code,
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      code_verifier: options.codeVerifier,
    }),
  });

  const body = (await response.json()) as OAuthTokenResponse | { error?: string; error_description?: string };
  if (!response.ok || !("access_token" in body) || !body.access_token) {
    throw new Error(`Token exchange failed: ${(body as { error_description?: string }).error_description || response.statusText}`);
  }

  return body;
}

export async function refreshStoredToken(token: StoredOAuthToken): Promise<StoredOAuthToken | null> {
  if (!token.refresh_token) {
    return null;
  }

  const response = await fetch(`${token.api_url}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: token.client_id,
    }),
  });

  const body = (await response.json()) as OAuthTokenResponse | { error?: string; error_description?: string };
  if (!response.ok || !("access_token" in body) || !body.access_token) {
    return null;
  }

  const refreshed: StoredOAuthToken = {
    ...token,
    access_token: body.access_token,
    refresh_token: body.refresh_token || token.refresh_token,
    token_type: body.token_type || token.token_type,
    scope: body.scope || token.scope,
    expires_at: body.expires_in ? new Date(Date.now() + body.expires_in * 1000).toISOString() : token.expires_at,
  };

  saveToken(refreshed);
  return refreshed;
}

export function tokenNeedsRefresh(token: StoredOAuthToken, skewSeconds = 60): boolean {
  if (!token.expires_at) {
    return false;
  }
  const expiresAtMs = Date.parse(token.expires_at);
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }
  return Date.now() + skewSeconds * 1000 >= expiresAtMs;
}

export async function runOAuthLogin(apiUrl: string): Promise<void> {
  const verifier = generatePkceVerifier();
  const challenge = generatePkceChallenge(verifier);
  const state = toBase64Url(randomBytes(24));

  const port = await new Promise<number>((resolve, reject) => {
    const probeServer = createServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });
    probeServer.listen(0, "127.0.0.1", () => {
      const info = probeServer.address();
      if (!info || typeof info === "string") {
        probeServer.close();
        reject(new Error("Failed to reserve callback port"));
        return;
      }
      const reservedPort = info.port;
      probeServer.close(() => resolve(reservedPort));
    });
    probeServer.on("error", (error) => reject(error));
  });
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const callbackPromise = waitForAuthCallback(port);
  const registration = await registerOAuthClient(apiUrl, redirectUri);

  const authUrl = new URL(`${apiUrl}/v1/oauth/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", registration.client_id);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "read write mcp");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  const opened = openBrowser(authUrl.toString());
  if (!opened) {
    console.error("Open this URL in your browser to continue:");
    console.error(authUrl.toString());
  }

  const callback = await callbackPromise;
  if (callback.state !== state) {
    throw new Error("OAuth state mismatch. Please retry login.");
  }

  const token = await exchangeAuthorizationCode({
    apiUrl,
    code: callback.code,
    codeVerifier: verifier,
    clientId: registration.client_id,
    redirectUri: callback.redirectUri,
  });

  const stored: StoredOAuthToken = {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    scope: token.scope,
    expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : undefined,
    api_url: apiUrl,
    client_id: registration.client_id,
  };

  saveToken(stored);
}

export async function runWhoAmI(token: StoredOAuthToken): Promise<{ email?: string; uid?: string }> {
  const response = await fetch(`${token.api_url}/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const message = String(body.message || body.error || response.statusText);
    throw new Error(`whoami failed: ${message}`);
  }

  return {
    email: typeof body.email === "string" ? body.email : undefined,
    uid: typeof body.uid === "string" ? body.uid : undefined,
  };
}
