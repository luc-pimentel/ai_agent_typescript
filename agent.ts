import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { ToolRegistry, ToolCall, defaultToolRegistry } from './tools';

dotenv.config();

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface TodoWriteInput {
  todos: {
    content: string;
    status: "pending" | "in_progress" | "completed";
    priority: "high" | "medium" | "low";
    id: string;
  }[];
}

class Agent {
  private anthropic: Anthropic;
  private conversationHistory: Message[] = [];
  private toolRegistry: ToolRegistry;
  private todos: TodoWriteInput['todos'] = [];

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
          // Special handling for todo_write tool
          if (toolCall.name === 'todo_write') {
            const oldTodos = [...this.todos];
            this.todos = toolCall.input.todos;
            
            // Check if this is a significant change to show progress
            const hasStatusChanges = this.hasSignificantTodoChanges(oldTodos, this.todos);
            
            // Execute the tool to get formatted response
            const result = await this.toolRegistry.execute(toolCall);
            
            // Include todo state in the tool result for Claude context
            const enhancedResult = `${result}\n\nInternal todo state updated: ${JSON.stringify(this.todos)}`;
            
            const toolUseBlock = content.find(block => block.type === 'tool_use' && block.name === toolCall.name) as any;
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUseBlock?.id,
              content: enhancedResult
            });
            
            // Show progress if significant changes occurred
            if (hasStatusChanges) {
              this.showTodoProgress();
            }
          } else {
            const result = await this.toolRegistry.execute(toolCall);
            const toolUseBlock = content.find(block => block.type === 'tool_use' && block.name === toolCall.name) as any;
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUseBlock?.id,
              content: result
            });
          }
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

  private hasSignificantTodoChanges(oldTodos: TodoWriteInput['todos'], newTodos: TodoWriteInput['todos']): boolean {
    // Check if any todo status changed to/from completed or in_progress
    const oldStatusMap = new Map(oldTodos.map(todo => [todo.id, todo.status]));
    
    for (const newTodo of newTodos) {
      const oldStatus = oldStatusMap.get(newTodo.id);
      if (oldStatus !== newTodo.status && 
          (newTodo.status === 'completed' || newTodo.status === 'in_progress' ||
           oldStatus === 'completed' || oldStatus === 'in_progress')) {
        return true;
      }
    }
    
    return false;
  }

  private showTodoProgress(): void {
    const completed = this.todos.filter(todo => todo.status === 'completed').length;
    const total = this.todos.length;
    
    if (total > 0) {
      console.log(`\n📊 Progress: ${completed}/${total} todos completed (${Math.round(completed/total*100)}%)`);
      
      // Show recently completed or started items
      const recentlyCompleted = this.todos.filter(todo => todo.status === 'completed').slice(-2);
      const inProgress = this.todos.filter(todo => todo.status === 'in_progress');
      
      if (recentlyCompleted.length > 0) {
        console.log('✅ Recently completed:');
        recentlyCompleted.forEach(todo => console.log(`   • ${todo.content}`));
      }
      
      if (inProgress.length > 0) {
        console.log('🔄 Currently working on:');
        inProgress.forEach(todo => console.log(`   • ${todo.content}`));
      }
      console.log('');
    }
  }

  private analyzeTaskComplexity(userInput: string): boolean {
    const complexityIndicators = [
      // Multiple action verbs
      /\b(implement|create|build|setup|configure|install|deploy|refactor|migrate|integrate)\b.*\b(and|then|also|plus|additionally)\b/i,
      // Multiple components mentioned
      /\b(database|api|frontend|backend|auth|testing|deployment|monitoring)\b.*\b(database|api|frontend|backend|auth|testing|deployment|monitoring)\b/i,
      // Step-by-step language
      /\b(first|then|next|after|finally|step|phase)\b/i,
      // Multiple files/technologies
      /\.(js|ts|py|java|cpp|html|css|json|yaml|xml)\b.*\.(js|ts|py|java|cpp|html|css|json|yaml|xml)\b/i,
      // List indicators
      /\b\d+\.\s|\b[a-z]\)\s|^\s*[-*+]\s/m
    ];
    
    return complexityIndicators.some(pattern => pattern.test(userInput));
  }

  async processMessage(userInput: string): Promise<string> {
    // Analyze if task might benefit from todos
    if (this.todos.length === 0 && this.analyzeTaskComplexity(userInput)) {
      const suggestion = "\n💡 This looks like a complex task that might benefit from a todo list. I can create one to track progress if you'd like.";
      console.log(suggestion);
    }
    
    return this.chat(userInput);
  }
}

export default Agent;