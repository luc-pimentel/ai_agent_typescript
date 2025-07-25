import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { ToolRegistry, ToolCall, defaultToolRegistry } from './tools';

dotenv.config();

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
}

class Agent {
  private anthropic: Anthropic;
  private conversationHistory: Message[] = [];
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry = defaultToolRegistry) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.toolRegistry = toolRegistry;
  }

  private addMessage(role: 'user' | 'assistant', content: string | any[]): void {
    this.conversationHistory.push({ role, content });
  }

  private parseToolCalls(content: any[]): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    for (const block of content) {
      if (block.type === 'tool_use') {
        toolCalls.push({
          name: block.name,
          input: block.input
        });
      }
    }
    
    return toolCalls;
  }

  async chat(userInput: string): Promise<string> {
    this.addMessage('user', userInput);

    while (true) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: this.conversationHistory,
        tools: this.toolRegistry.getToolDefinitions(),
      });

      const content = response.content;
      this.addMessage('assistant', content);

      // Check if Claude wants to use tools
      const toolCalls = this.parseToolCalls(content);
      
      if (toolCalls.length === 0) {
        // No tools used, return the text response
        const textContent = content.find(block => block.type === 'text');
        return textContent ? textContent.text : 'No text response';
      }

      // Execute tools and add results to conversation
      const toolResults: any[] = [];
      
      for (const toolCall of toolCalls) {
        try {
          const result = await this.toolRegistry.execute(toolCall);
          const toolUseBlock = content.find(block => block.type === 'tool_use' && block.name === toolCall.name) as any;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseBlock?.id,
            content: result
          });
        } catch (error) {
          const toolUseBlock = content.find(block => block.type === 'tool_use' && block.name === toolCall.name) as any;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseBlock?.id,
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            is_error: true
          });
        }
      }

      // Add tool results to conversation
      this.addMessage('user', toolResults);
    }
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export default Agent;