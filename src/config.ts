import { hideBin } from 'yargs/helpers';
import { config } from 'dotenv';
import pkg from '../package.json' with { type: 'json' };
import yargs from 'yargs';

config();

interface ServerConfig {
  accessToken: string;
  configSources: {
    accessToken: 'cli' | 'env';
  };
}

interface CliArgs {
  'access-token'?: string;
}

export function getServerConfig(): ServerConfig {
  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .options({
      'access-token': {
        type: 'string',
        description: 'Authenticator App Access Token',
      },
    })
    .help()
    .version(pkg.version)
    .parseSync() as CliArgs;

  const config: ServerConfig = {
    accessToken: '',
    configSources: {
      accessToken: 'env',
    },
  };

  // Handle AUTHENTICATOR_ACCESS_TOKEN
  if (argv['access-token']) {
    config.accessToken = argv['access-token'];
    config.configSources.accessToken = 'cli';
  } else if (process.env.AUTHENTICATOR_ACCESS_TOKEN) {
    config.accessToken = process.env.AUTHENTICATOR_ACCESS_TOKEN;
    config.configSources.accessToken = 'env';
  }

  // Validate configuration
  if (!config.accessToken) {
    console.error(
      'AUTHENTICATOR_ACCESS_TOKEN is required (via CLI argument --access-token or .env file)'
    );
    process.exit(1);
  }
  return config;
}
