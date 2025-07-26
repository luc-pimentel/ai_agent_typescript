import Agent from './agent';
import * as readline from 'readline';

async function main() {
  const agent = new Agent();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Agent started! Type "exit" to quit.\n');

  const askQuestion = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question('You: ', (answer) => {
        resolve(answer);
      });
    });
  };

  while (true) {
    try {
      const userInput = await askQuestion();
      
      if (userInput.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      console.log('🤖 Agent: Thinking...');
      const response = await agent.processMessage(userInput);
      console.log(`🤖 Agent: ${response}\n`);

    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  rl.close();
}

main().catch(console.error);