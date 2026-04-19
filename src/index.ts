import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
    getPokemonStats,
    getPokemonMoves,
    getMoveInfo,
    getTypeInfo,
} from './pokeapi.js';

const server = new McpServer({
    name: 'pokemon-mcp',
    version: '1.0.0',
});

// ── Tool: get_pokemon_stats ──────────────────────────────────────────────────

server.tool(
    'get_pokemon_stats',
    'Get base stats, types, and abilities for a Pokémon by name or Pokédex number',
    {
        pokemon: z
            .string()
            .describe(
                'Pokémon name (e.g. "pikachu") or Pokédex number (e.g. "25")',
            ),
    },
    async ({ pokemon }) => {
        try {
            const data = await getPokemonStats(pokemon);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        } catch (err) {
            return {
                content: [
                    { type: 'text', text: `Error: ${(err as Error).message}` },
                ],
                isError: true,
            };
        }
    },
);

// ── Tool: get_pokemon_moves ──────────────────────────────────────────────────

server.tool(
    'get_pokemon_moves',
    'Get the moveset of a Pokémon — level-up moves sorted by level plus TM/egg/tutor moves',
    {
        pokemon: z
            .string()
            .describe('Pokémon name (e.g. "charizard") or Pokédex number'),
        limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .default(20)
            .describe('Max moves to return per category (default 20)'),
    },
    async ({ pokemon, limit }) => {
        try {
            const data = await getPokemonMoves(pokemon, limit);
            return {
                content: [
                    { type: 'text', text: JSON.stringify(data, null, 2) },
                ],
            };
        } catch (err) {
            return {
                content: [
                    { type: 'text', text: `Error: ${(err as Error).message}` },
                ],
                isError: true,
            };
        }
    },
);

// ── Tool: get_move_info ──────────────────────────────────────────────────────

server.tool(
    'get_move_info',
    'Get detailed information about a Pokémon move: power, accuracy, PP, type, damage class, and effect',
    {
        move: z
            .string()
            .describe('Move name (e.g. "thunderbolt", "close-combat", "surf")'),
    },
    async ({ move }) => {
        try {
            const data = await getMoveInfo(move);
            return {
                content: [
                    { type: 'text', text: JSON.stringify(data, null, 2) },
                ],
            };
        } catch (err) {
            return {
                content: [
                    { type: 'text', text: `Error: ${(err as Error).message}` },
                ],
                isError: true,
            };
        }
    },
);

// ── Tool: get_type_info ──────────────────────────────────────────────────────

server.tool(
    'get_type_info',
    "Get type effectiveness chart for a Pokémon type — what it's strong/weak/immune against offensively and defensively",
    {
        type: z
            .string()
            .describe(
                'Type name (e.g. "fire", "water", "dragon", "steel", "ghost")',
            ),
    },
    async ({ type }) => {
        try {
            const data = await getTypeInfo(type);
            return {
                content: [
                    { type: 'text', text: JSON.stringify(data, null, 2) },
                ],
            };
        } catch (err) {
            return {
                content: [
                    { type: 'text', text: `Error: ${(err as Error).message}` },
                ],
                isError: true,
            };
        }
    },
);

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Pokemon MCP server running on stdio');
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
