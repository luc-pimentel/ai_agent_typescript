import { readFileTool, executeCommandTool, httpRequestTool, ToolRegistry } from '../tools';

describe('Tool Integration Tests', () => {
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
    toolRegistry.register(readFileTool);
    toolRegistry.register(executeCommandTool);
    toolRegistry.register(httpRequestTool);
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

  describe('ToolRegistry', () => {
    it('should return all registered tools', () => {
      const tools = toolRegistry.getAll();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('read_file');
      expect(tools.map(t => t.name)).toContain('execute_command');
      expect(tools.map(t => t.name)).toContain('http_request');
    });

    it('should get tool definitions for Claude API', () => {
      const definitions = toolRegistry.getToolDefinitions();
      expect(definitions).toHaveLength(3);
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