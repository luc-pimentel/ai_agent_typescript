import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

class Agent {
  private anthropic: Anthropic;
  private conversationHistory: Message[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content });
  }

  async chat(userInput: string): Promise<string> {
    this.addMessage('user', userInput);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: this.conversationHistory,
    });

    const assistantResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'No text response';

    this.addMessage('assistant', assistantResponse);

    return assistantResponse;
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export default Agent;