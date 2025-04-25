// Re-export the server and its types
export { AuthenticatorMcpServer } from './mcp.js';
export type { Authenticator } from './authenticator.js';
export { getServerConfig } from './config.js';
export { startServer } from './cli.js';

export const Logger = {
  log: (...args: any[]) => {
    console.error('[INFO]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
