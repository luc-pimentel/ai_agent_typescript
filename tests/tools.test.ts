import { readFileTool, executeCommandTool, httpRequestTool, searchTool, ToolRegistry } from '../tools';

describe('Tool Integration Tests', () => {
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
    toolRegistry.register(readFileTool);
    toolRegistry.register(executeCommandTool);
    toolRegistry.register(httpRequestTool);
    toolRegistry.register(searchTool);
  });

  describe('read_file tool', () => {
    it('should read README.md file successfully', async () => {
      const result = await toolRegistry.execute({
        name: 'read_file',
        input: { file_path: 'README.md' }
      });

      expect(result).toContain('File contents of README.md:');
      expect(result).toContain('# AI Agent TypeScript');
      expect(typeof result).toBe('string');
    });

    it('should handle non-existent file gracefully', async () => {
      const result = await toolRegistry.execute({
        name: 'read_file',
        input: { file_path: 'non-existent-file.txt' }
      });

      expect(result).toContain('Error executing tool');
      expect(result).toContain('Failed to read file');
    });
  });

  describe('execute_command tool', () => {
    it('should run git status command successfully', async () => {
      const result = await toolRegistry.execute({
        name: 'execute_command',
        input: { command: 'git status' }
      });

      expect(result).toContain('Output:');
      expect(result).toMatch(/On branch|working tree|Changes|Untracked files/);
      expect(typeof result).toBe('string');
    });

    it('should handle invalid command gracefully', async () => {
      const result = await toolRegistry.execute({
        name: 'execute_command',
        input: { command: 'nonexistentcommand12345' }
      });

      expect(result).toContain('Error executing tool');
      expect(result).toContain('Command execution failed');
    });
  });

  describe('http_request tool', () => {
    it('should make HTTP request to https://ampcode.com/how-to-build-an-agent', async () => {
      const result = await toolRegistry.execute({
        name: 'http_request',
        input: { 
          url: 'https://ampcode.com/how-to-build-an-agent',
          method: 'GET'
        }
      });

      expect(result).toContain('HTTP GET https://ampcode.com/how-to-build-an-agent');
      expect(result).toContain('Status:');
      expect(result).toContain('Response:');
      expect(typeof result).toBe('string');
    }, 15000); // Increased timeout for HTTP request

    it('should handle invalid URL gracefully', async () => {
      const result = await toolRegistry.execute({
        name: 'http_request',
        input: { url: 'invalid-url' }
      });

      expect(result).toContain('Error executing tool');
      expect(result).toContain('HTTP request failed');
    });
  });

  describe('search tool', () => {
    it('should search using Brave Search API', async () => {
      // Skip if no API key is available
      if (!process.env.BRAVE_API_KEY) {
        console.log('Skipping search test - BRAVE_API_KEY not set');
        return;
      }

      const result = await toolRegistry.execute({
        name: 'search',
        input: { 
          q: 'TypeScript programming language',
          count: 5,
          country: 'US'
        }
      });

      expect(result).toContain('Search Results for: "TypeScript programming language"');
      expect(result).toContain('Country: US');
      expect(typeof result).toBe('string');
    }, 15000); // Increased timeout for API request

    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key
      const originalKey = process.env.BRAVE_API_KEY;
      delete process.env.BRAVE_API_KEY;

      const result = await toolRegistry.execute({
        name: 'search',
        input: { q: 'test query' }
      });

      expect(result).toContain('Error executing tool');
      expect(result).toContain('BRAVE_API_KEY environment variable is not set');

      // Restore API key
      if (originalKey) {
        process.env.BRAVE_API_KEY = originalKey;
      }
    });

    it('should use default parameters when not provided', async () => {
      if (!process.env.BRAVE_API_KEY) {
        console.log('Skipping search test - BRAVE_API_KEY not set');
        return;
      }

      const result = await toolRegistry.execute({
        name: 'search',
        input: { q: 'simple test' }
      });

      expect(result).toContain('Search Results for: "simple test"');
      expect(result).toContain('Country: US'); // Default country
      expect(typeof result).toBe('string');
    }, 15000);
  });

  describe('ToolRegistry', () => {
    it('should return all registered tools', () => {
      const tools = toolRegistry.getAll();
      expect(tools).toHaveLength(4);
      expect(tools.map(t => t.name)).toContain('read_file');
      expect(tools.map(t => t.name)).toContain('execute_command');
      expect(tools.map(t => t.name)).toContain('http_request');
      expect(tools.map(t => t.name)).toContain('search');
    });

    it('should get tool definitions for Claude API', () => {
      const definitions = toolRegistry.getToolDefinitions();
      expect(definitions).toHaveLength(4);
      expect(definitions[0]).toHaveProperty('name');
      expect(definitions[0]).toHaveProperty('description');
      expect(definitions[0]).toHaveProperty('input_schema');
    });

    it('should handle unknown tool execution', async () => {
      await expect(async () => {
        await toolRegistry.execute({
          name: 'unknown_tool',
          input: {}
        });
      }).rejects.toThrow('Tool \'unknown_tool\' not found');
    });
  });
});