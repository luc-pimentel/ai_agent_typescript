# Claude Memory for AI Agent TypeScript

## Project Overview
This is a TypeScript implementation of a simple AI agent based on the principles from [How to Build an Agent](https://ampcode.com/how-to-build-an-agent). The agent consists of three core components:

1. **LLM**: Uses Anthropic's Claude 3.5 Sonnet model
2. **Memory**: Maintains conversation history across interactions  
3. **Control Loop**: Orchestrates conversation flow between user and AI

## Current Architecture

### Core Files
- `agent.ts`: Main Agent class with LLM integration and memory management
- `index.ts`: CLI interface with interactive conversation loop
- `package.json`: Dependencies (Anthropic SDK, dotenv, TypeScript tooling)
- `tsconfig.json`: TypeScript configuration
- `.env`: Contains `ANTHROPIC_API_KEY` (excluded from git)

### Key Components Implemented
- **Agent Class**: Core orchestrator managing conversation flow
- **Message Interface**: Type-safe structure for conversation history
- **Conversation Memory**: Array-based history storage
- **Control Loop**: CLI-based user interaction with continuous conversation

## Development Commands
- `yarn install`: Install dependencies
- `yarn dev`: Run agent in development mode with ts-node
- `yarn build`: Compile TypeScript to JavaScript
- `yarn start`: Run compiled version

## Original Implementation Reference
The complete agent implementation from [How to Build an Agent](https://ampcode.com/how-to-build-an-agent) serves as an excellent reference point. Key insights from the original:

### Full Agent Architecture (from original article)
- **Tool Registry**: Each tool has `name`, `description`, `input_schema`, and `execute` function
- **Tool Detection**: Parses Claude's responses for tool invocation requests
- **Tool Execution Engine**: Executes tools and captures results
- **Result Integration**: Feeds tool outputs back into conversation context
- **Natural Tool Chaining**: Claude automatically chains tools based on results

### Example Tools from Original
- `read_file`: Read file contents from filesystem
- `list_files`: List directory contents  
- `edit_file`: Modify file contents with new text
- `execute_command`: Run shell commands

### Tool Flow Pattern (from original)
1. User request → Agent sends to Claude with available tools
2. Claude responds with tool calls if needed
3. Agent executes requested tools
4. Tool results added to conversation
5. Loop continues until Claude provides final answer

## Next Implementation Phases

### Phase 1: Core Tool System
- [ ] Tool interface definition (`name`, `description`, `schema`, `execute`)
- [ ] Tool registry for managing available tools
- [ ] Tool call parser for Claude responses
- [ ] Tool execution engine with error handling
- [ ] Result formatting and integration

### Phase 2: Basic File Tools
- [ ] `read_file`: Read file contents
- [ ] `write_file`: Write content to files  
- [ ] `list_files`: Directory listing
- [ ] `create_directory`: Create folders

### Phase 3: System Tools
- [ ] `execute_command`: Run shell commands safely
- [ ] `search_files`: Search file contents
- [ ] `get_current_time`: System time/date
- [ ] `http_request`: Make web requests

### Phase 4: Advanced Features
- [ ] Tool parameter validation with schemas
- [ ] Async tool execution support
- [ ] Tool execution logging and debugging
- [ ] Error recovery and retry mechanisms
- [ ] Tool composition and workflows


## Environment Setup
- Requires Node.js v16+
- Uses Yarn as package manager
- Needs valid Anthropic API key in `.env` file
- TypeScript for type safety and better development experience

## Project Status
✅ Basic agent structure with LLM + memory + control loop
✅ CLI interface for testing conversations
✅ Conversation history management
✅ Git repository setup with proper .gitignore
✅ Documentation (README.md)
⏳ Tool system (planned next phase)

## Usage Notes
- Type "exit" to quit the conversation
- Agent maintains full conversation context
- All interactions are stored in memory until process ends
- No persistence between sessions (intentional for simplicity)