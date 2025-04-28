import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Authenticator } from './authenticator.js';
import { Logger } from './index.js';
import { z } from 'zod';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

const serverInfo = {
  name: 'Authenticator App MCP',
  version: '1.0.0',
};

const serverOptions = {
  capabilities: { logging: {}, tools: {} },
};

export class AuthenticatorMcpServer extends McpServer {
  private readonly authenticator: Authenticator;

  constructor(accessToken: string) {
    super(serverInfo, serverOptions);
    this.authenticator = new Authenticator(accessToken);
    this.registerTools();
  }

  private registerTools(): void {
    this.tool(
      'get_2fa_code',
      'Retrieve the current 2FA code for a username when logging into a website.',
      {
        website: z
          .string()
          .describe('The domain name of the website you need to login, e.g. "github.com"'),
        username: z
          .string()
          .describe(
            'The username or email of the account you need to login, e.g. "john.doe@example.com"'
          ),
      },
      async ({ website, username }, extra) => {
        const res = await this.authenticator.get2FACode(website, username);
        return {
          content: [
            {
              type: 'text',
              text: `The 2FA code is ${res.code}, it will expire in ${res.valid_for} seconds.`,
            },
          ],
        };
      }
    );
    this.tool(
      'get_password',
      'Retrieve the password for a username when logging into a website.',
      {
        website: z
          .string()
          .describe('The domain name of the website you need to login, e.g. "github.com"'),
        username: z
          .string()
          .describe(
            'The username or email of the account you need to login, e.g. "john.doe@example.com"'
          ),
      },
      async ({ website, username }, extra) => {
        const res = await this.authenticator.getPassword(website, username);
        return {
          content: [
            {
              type: 'text',
              text: `The password is ${res.password}.`,
            },
          ],
        };
      }
    );
    this.tool(
      'get_account_list',
      'Retrieve the accounts can be used when logging into a website.',
      {
        website: z
          .string()
          .describe('The domain name of the website you need to login, e.g. "github.com"'),
      },
      async ({ website }, extra) => {
        const res = await this.authenticator.getAccountList(website);
        return {
          content: [
            {
              type: 'text',
              text: `The accounts are: ${res.accounts.join(', ')}.`,
            },
          ],
        };
      }
    );
  }

  async connect(transport: Transport): Promise<void> {
    await super.connect(transport);

    // Ensure stdout is only used for JSON messages
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      // Only allow JSON messages to pass through
      if (typeof chunk === 'string' && !chunk.startsWith('{')) {
        return true; // Silently skip non-JSON messages
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };

    Logger.log('Server connected and ready to process requests');
  }
}
