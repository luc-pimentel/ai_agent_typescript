# AI Agent TypeScript

A TypeScript implementation of a simple AI agent based on the principles outlined in [How to Build an Agent](https://ampcode.com/how-to-build-an-agent).

## Overview

This project implements a minimal AI agent with three core components:
- **LLM**: Uses Anthropic's Claude as the primary intelligence
- **Memory**: Maintains conversation history across interactions
- **Control Loop**: Orchestrates the conversation flow between user and AI

The agent demonstrates how complex interactions can emerge from a simple, well-structured architecture without requiring complex frameworks.

## Features

- 🧠 **Claude Integration**: Uses Anthropic's Claude 3.5 Sonnet model
- 💭 **Conversation Memory**: Maintains context across the entire conversation
- 🔄 **Interactive Loop**: CLI interface for real-time conversations
- 🛠️ **Tool System**: Extensible tool registry with file operations, command execution, and HTTP requests
- 📝 **TypeScript**: Fully typed implementation for better development experience
- 🧪 **Testing**: Comprehensive Jest test suite for all components

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai_agent_typescript
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run the agent:
```bash
yarn dev
```

## Development

### Available Scripts

- `yarn dev`: Run the agent in development mode
- `yarn build`: Compile TypeScript to JavaScript
- `yarn start`: Run the compiled version
- `yarn test`: Run the Jest test suite

### Testing

The project includes a comprehensive test suite that validates:
- **File Operations**: Reading files from the filesystem
- **Command Execution**: Running shell commands like `git status`
- **HTTP Requests**: Making web requests to external APIs
- **Tool Registry**: Tool registration and execution flow

Run tests with:
```bash
yarn test
```

## Usage

Once started, the agent will prompt you for input. Simply type your messages and the agent will respond while maintaining conversation context. Type `exit` to quit.

## Architecture

The agent follows a simple but powerful architecture:

- **Agent Class**: Core orchestrator that manages conversation flow
- **Message Interface**: Type-safe message structure for conversation history
- **Control Loop**: Handles user input/output and maintains conversation state
- **Tool System**: Extensible registry of tools that the agent can use:
  - `read_file`: Read contents from filesystem files
  - `execute_command`: Run shell commands and capture output
  - `http_request`: Make HTTP requests to web APIs

## Inspiration

This implementation is based on the concepts from [How to Build an Agent](https://ampcode.com/how-to-build-an-agent), which demonstrates that effective AI agents can be built with minimal code by focusing on the right abstractions.

## License

MIT