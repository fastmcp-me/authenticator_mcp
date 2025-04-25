// --- Type Definitions (Keep relevant ones) ---
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

export interface Get2FACodeResponse {
  code: string;
  valid_for: number;
}

export interface GetPasswordResponse {
  password: string;
}

export interface GetAccountListResponse {
  accounts: string[];
}

export class Authenticator {
  private readonly accessToken: string;
  private readonly baseUrl = 'http://localhost:43457/mcp/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async get2FACode(website: string, username: string): Promise<Get2FACodeResponse> {
    const url = `${this.baseUrl}/code?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
      throw new Error(`HTTP error ${response.status}: ${errorBody}`); // Include body in error
    }
    return (await response.json()) as Get2FACodeResponse;
  }

  async getPassword(website: string, username: string): Promise<GetPasswordResponse> {
    const url = `${this.baseUrl}/password?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
      throw new Error(`HTTP error ${response.status}: ${errorBody}`);
    }
    return (await response.json()) as GetPasswordResponse;
  }

  async getAccountList(website: string): Promise<GetAccountListResponse> {
    const url = `${this.baseUrl}/account_list?website=${encodeURIComponent(website)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error ${response.status} from ${url}: ${errorBody}`);
      throw new Error(`HTTP error ${response.status}: ${errorBody}`);
    }
    // Assuming the backend returns a string array directly
    const accounts = (await response.json()) as string[];
    return { accounts };
  }
}
