# pokemon-mcp

A local MCP server that connects Claude to the [PokéAPI](https://pokeapi.co) for Pokémon data lookups. No API key required.

## What is MCP?

This project uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro), an open standard that lets AI assistants like Claude connect to external tools and data sources.

When you ask Claude "what are Charizard's base stats?", Claude calls this MCP server, which fetches live data from PokéAPI and returns it — all transparently in the chat.

## Tools

| Tool                | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `get_pokemon_stats` | Base stats, types, abilities for any Pokémon               |
| `get_pokemon_moves` | Full moveset sorted by level-up order + TM/egg/tutor moves |
| `get_move_info`     | Power, accuracy, PP, type, damage class, and effect text   |
| `get_type_info`     | Full type effectiveness chart (offense + defense)          |

## Requirements

- [Node.js](https://nodejs.org) v18 or later (uses native `fetch`)
- npm
- [Claude Desktop](https://claude.ai/download)

## Step 1 — Clone and build

```bash
# Clone the repo
git clone https://github.com/tyypos/pokemon-mcp.git
cd pokemon-mcp

# Install dependencies
npm install

# Build
npm run build
```

The compiled server lands in `dist/index.js`.

Get the absolute path to your project — you'll need it in the next step:

```bash
pwd
```

Copy the output. It will look something like `/Users/yourname/dev/pokemon-mcp`.

## Step 2 — Configure Claude Desktop

Open Claude Desktop and navigate to **Settings → Developer → Edit Config**.

This opens `claude_desktop_config.json`. If the file is empty, start with `{}`.

Add the `mcpServers` block. If the file already has content (like a `preferences` block), add `mcpServers` alongside it — don't replace what's there:

```json
{
  "preferences": {
    ...existing content stays here...
  },
  "mcpServers": {
    "pokemon": {
      "command": "node",
      "args": ["/absolute/path/to/pokemon-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/pokemon-mcp` with the path you copied from `pwd`.

Save the file.

## Step 3 — Restart Claude Desktop

Fully quit Claude Desktop — **Cmd+Q** on macOS, don't just close the window. Then reopen it.

## Step 4 — Enable the pokemon connector

1. Open a new chat
2. Click the **+** button in the bottom left of the chat input
3. Hover over **Connectors**
4. You should see **pokemon** listed — toggle it on

## Step 5 — Test it

Try one of these prompts:

- _"What are Charizard's base stats?"_
- _"What moves does Gengar learn by level up?"_
- _"Tell me everything about the move Earthquake."_
- _"What types is Dragon weak to?"_

You should see **"Loaded tools, used pokemon integration"** above Claude's response, confirming the MCP server is being called.

## Development

```bash
# Run directly with tsx (no build step)
npm run dev
```

To verify the server starts correctly before connecting to Claude:

```bash
npm run build
node dist/index.js
# Prints: Pokemon MCP server running on stdio
# Then waits for stdin — that's expected. Press Ctrl+C to exit.
```

## Project structure

```
src/
  index.ts     # MCP server + tool definitions
  pokeapi.ts   # PokéAPI fetch helpers
dist/          # Compiled output (git-ignored)
```
