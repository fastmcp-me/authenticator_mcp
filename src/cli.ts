import { config } from 'dotenv';
import { resolve } from 'path';
import { getServerConfig } from './config.js';
import { AuthenticatorMcpServer } from './mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Load .env from the current working directory
config({ path: resolve(process.cwd(), '.env') });

export async function startServer(): Promise<void> {
  const config = getServerConfig();
  const server = new AuthenticatorMcpServer(config.accessToken);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// If we're being executed directly (not imported), start the server
if (process.argv[1]) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
