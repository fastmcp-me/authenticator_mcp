#!/usr/bin/env node

import readline from 'readline';
import fetch from 'node-fetch'; // Ensure node-fetch v3 is installed which supports ESM
import minimist from 'minimist';

// Define types for JSON-RPC
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any; // More specific types can be added per method
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any; // Type depends on the method called
  error?: JsonRpcError;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// Define types for function parameters
interface Get2FACodeParams {
  website: string;
  username: string;
}

interface GetPasswordParams {
  website: string;
  username: string;
}

interface GetAccountListParams {
  website: string;
}

const port = 43457; // TODO: make this configurable
const args = minimist(process.argv.slice(2));
const accessToken: string | undefined = args['access-token'];

if (!accessToken) {
  console.error('Missing required --access-token argument.');
  process.exit(1);
}

// JSON-RPC 监听
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line: string) => {
  try {
    const request: JsonRpcRequest = JSON.parse(line);

    if (request.method === 'getManifest') {
      respond(request.id, getManifest());
    } else if (request.method === 'get2FACode') {
      const params = request.params as Get2FACodeParams;
      if (!params || !params.website || !params.username) {
        respondError(request.id, 'Missing required parameters: website, username');
        return;
      }
      const result = await get2FACode(params.website, params.username);
      respond(request.id, result);
    } else if (request.method === 'getPassword') {
      const params = request.params as GetPasswordParams;
      if (!params || !params.website || !params.username) {
        respondError(request.id, 'Missing required parameters: website, username');
        return;
      }
      const result = await getPassword(params.website, params.username);
      respond(request.id, result);
    } else if (request.method === 'getAccountList') {
      const params = request.params as GetAccountListParams;
      if (!params || !params.website) {
        respondError(request.id, 'Missing required parameters: website, username');
        return;
      }
      const result = await getAccountList(params.website);
      respond(request.id, result);
    } else {
      respondError(request.id, 'Unknown method: ' + request.method);
    }
  } catch (err) {
    console.error('Invalid request:', err instanceof Error ? err.message : err);
    // Optionally send a parse error response if an id was parsable,
    // but JSON-RPC spec is a bit ambiguous here for general errors.
  }
});

// 响应格式
function respond(id: string | number | null, result: any): void {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id,
    result
  };
  console.log(JSON.stringify(response));
}

function respondError(id: string | number | null, message: string, code: number = -32000): void {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id,
    error: { code, message }
  };
  console.log(JSON.stringify(response));
}

// MCP Manifest structure (could be more strictly typed)
interface ManifestFunctionParameter {
  type: string;
  description: string;
}

interface ManifestFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, ManifestFunctionParameter>;
    required: string[];
  };
}

interface Manifest {
  name: string;
  description: string;
  functions: ManifestFunction[];
}


// MCP Manifest
function getManifest(): Manifest {
  return {
    name: "Authenticator App MCP",
    description: "Fetch accounts, 2FA codes or passwords for a website login process.",
    functions: [
      {
        name: "get2FACode",
        description: "Get the current 2FA code for a specific website and username.",
        parameters: {
          type: "object",
          properties: {
            website: {
              type: "string",
              description: "The domain name of the website you need to login, e.g. 'github.com'."
            },
            username: {
              type: "string",
              description: "The username or email of the account you need to login, e.g. 'john.doe@example.com'."
            }
          },
          required: ["website", "username"]
        }
      },
      {
        name: "getPassword",
        description: "Get the passwordfor a specific website and username.",
        parameters: {
          type: "object",
          properties: {
            website: {
              type: "string",
              description: "The domain name of the website you need to login, e.g. 'github.com'."
            },
            username: {
              type: "string",
              description: "The username or email of the account you need to login, e.g. 'john.doe@example.com'."
            }
          },
          required: ["website", "username"]
        }
      },
      {
        name: "getAccountList",
        description: "Get available accounts for a specific website.",
        parameters: {
          type: "object",
          properties: {
            website: {
              type: "string",
              description: "The domain name of the website you need to login, e.g. 'github.com'."
            }
          },
          required: ["website"]
        }
      }
    ]
  };
}

// Define expected response type from the backend
interface Get2FACodeResponse {
  code: string;
  valid_for: number;
}

interface GetPasswordResponse {
  password: string;
}

interface GetAccountListResponse {
  accounts: string[];
}

async function get2FACode(website: string, username: string): Promise<Get2FACodeResponse> {
  const url = `http://localhost:${port}/mcp/v1/code?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}` // accessToken is guaranteed to be defined here
    }
  });

  if (!response.ok) {
     const errorBody = await response.text();
     console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
    // Propagate a more specific error based on backend response if possible
    throw new Error(`HTTP error ${response.status}`);
  }

  const result: Get2FACodeResponse = await response.json() as Get2FACodeResponse;
  return result;
}


async function getPassword(website: string, username: string): Promise<GetPasswordResponse> {
  const url = `http://localhost:${port}/mcp/v1/password?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}` // accessToken is guaranteed to be defined here
    }
  });

  if (!response.ok) {
     const errorBody = await response.text();
     console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
    // Propagate a more specific error based on backend response if possible
    throw new Error(`HTTP error ${response.status}`);
  }

  const result: GetPasswordResponse = await response.json() as GetPasswordResponse;
  return result;
}

async function getAccountList(website: string): Promise<GetAccountListResponse> {
  const url = `http://localhost:${port}/mcp/v1/account_list?website=${encodeURIComponent(website)}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}` // accessToken is guaranteed to be defined here
    }
  });

  if (!response.ok) {
     const errorBody = await response.text();
     console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
    // Propagate a more specific error based on backend response if possible
    throw new Error(`HTTP error ${response.status}`);
  }

  const result: GetAccountListResponse = { accounts: await response.json() as string[] };
  return result;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  rl.close();
  process.exit(0);
});
