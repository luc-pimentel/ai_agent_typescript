import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolSchema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

export interface Tool {
  name: string;
  description: string;
  input_schema: ToolSchema;
  execute: (input: any) => Promise<string>;
}

export interface ToolCall {
  name: string;
  input: any;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  async execute(toolCall: ToolCall): Promise<string> {
    const tool = this.get(toolCall.name);
    if (!tool) {
      throw new Error(`Tool '${toolCall.name}' not found`);
    }

    try {
      return await tool.execute(toolCall.input);
    } catch (error) {
      return `Error executing tool '${toolCall.name}': ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  getToolDefinitions(): any[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema
    }));
  }
}

// Tool implementations
export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file from the filesystem',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The path to the file to read'
      }
    },
    required: ['file_path']
  },
  execute: async (input: { file_path: string }): Promise<string> => {
    try {
      const safePath = path.resolve(input.file_path);
      const currentDir = process.cwd();
      
      // Security check: ensure file is within current directory
      if (!safePath.startsWith(currentDir)) {
        throw new Error('Access denied: file must be within current directory');
      }

      const content = fs.readFileSync(safePath, 'utf-8');
      return `File contents of ${input.file_path}:\n\n${content}`;
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

export const executeCommandTool: Tool = {
  name: 'execute_command',
  description: 'Execute a shell command and return the output',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute'
      }
    },
    required: ['command']
  },
  execute: async (input: { command: string }): Promise<string> => {
    try {
      const { stdout, stderr } = await execAsync(input.command, {
        timeout: 30000, // 30 second timeout
        cwd: process.cwd()
      });

      let result = '';
      if (stdout) result += `Output:\n${stdout}`;
      if (stderr) result += `${result ? '\n\n' : ''}Errors:\n${stderr}`;
      
      return result || 'Command executed successfully with no output';
    } catch (error) {
      throw new Error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

export const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make an HTTP request to a URL and return the response',
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to make the request to'
      },
      method: {
        type: 'string',
        description: 'HTTP method (GET, POST, etc.)',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      headers: {
        type: 'object',
        description: 'Optional HTTP headers'
      },
      body: {
        type: 'string',
        description: 'Optional request body for POST/PUT requests'
      }
    },
    required: ['url']
  },
  execute: async (input: { url: string; method?: string; headers?: Record<string, string>; body?: string }): Promise<string> => {
    try {
      const method = input.method || 'GET';
      const headers = input.headers || {};
      
      const response = await fetch(input.url, {
        method,
        headers,
        body: input.body,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const contentType = response.headers.get('content-type') || '';
      let responseBody: string;

      if (contentType.includes('application/json')) {
        const json = await response.json();
        responseBody = JSON.stringify(json, null, 2);
      } else {
        responseBody = await response.text();
      }

      return `HTTP ${method} ${input.url}\nStatus: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\n\nResponse:\n${responseBody}`;
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

export const searchTool: Tool = {
  name: 'search',
  description: 'Search the web using Brave Search API',
  input_schema: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Search query (max 400 characters, 50 words)'
      },
      count: {
        type: 'number',
        description: 'Number of search results to return (max 20)',
        minimum: 1,
        maximum: 20
      },
      country: {
        type: 'string',
        description: 'Country code for search results (e.g., US, UK, CA)',
        default: 'US'
      }
    },
    required: ['q']
  },
  execute: async (input: { q: string; count?: number; country?: string }): Promise<string> => {
    try {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) {
        throw new Error('BRAVE_API_KEY environment variable is not set');
      }

      const params = new URLSearchParams({
        q: input.q,
        count: (input.count || 10).toString(),
        country: input.country || 'US'
      });

      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Format the response for better readability
      let result = `Search Results for: "${input.q}"\n`;
      result += `Country: ${input.country || 'US'}, Results: ${data.web?.results?.length || 0}\n\n`;

      if (data.web?.results) {
        data.web.results.forEach((item: any, index: number) => {
          result += `${index + 1}. ${item.title}\n`;
          result += `   URL: ${item.url}\n`;
          result += `   Description: ${item.description}\n\n`;
        });
      } else {
        result += 'No search results found.\n';
      }

      return result;
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Create and export default registry with tools
export const defaultToolRegistry = new ToolRegistry();
defaultToolRegistry.register(readFileTool);
defaultToolRegistry.register(executeCommandTool);
defaultToolRegistry.register(httpRequestTool);
defaultToolRegistry.register(searchTool);