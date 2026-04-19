const BASE_URL = 'https://pokeapi.co/api/v2';

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `PokéAPI error ${res.status}: ${res.statusText} (${url})`,
        );
    }
    return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface StatEntry {
    base_stat: number;
    effort: number;
    stat: { name: string };
}

interface TypeSlot {
    slot: number;
    type: { name: string };
}

interface AbilitySlot {
    ability: { name: string };
    is_hidden: boolean;
}

interface MoveSlot {
    move: { name: string; url: string };
    version_group_details: Array<{
        level_learned_at: number;
        move_learn_method: { name: string };
    }>;
}

interface Pokemon {
    id: number;
    name: string;
    base_experience: number;
    height: number;
    weight: number;
    stats: StatEntry[];
    types: TypeSlot[];
    abilities: AbilitySlot[];
    moves: MoveSlot[];
}

interface MoveDetail {
    id: number;
    name: string;
    accuracy: number | null;
    power: number | null;
    pp: number;
    priority: number;
    damage_class: { name: string };
    type: { name: string };
    effect_entries: Array<{ effect: string; language: { name: string } }>;
    meta: {
        ailment: { name: string };
        category: { name: string };
        min_hits: number | null;
        max_hits: number | null;
        crit_rate: number;
        drain: number;
        healing: number;
        flinch_chance: number;
        stat_chance: number;
    } | null;
}

interface TypeRelations {
    double_damage_from: Array<{ name: string }>;
    double_damage_to: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    half_damage_to: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
    no_damage_to: Array<{ name: string }>;
}

interface TypeDetail {
    id: number;
    name: string;
    damage_relations: TypeRelations;
    pokemon: Array<{ pokemon: { name: string } }>;
}

// ── Public helpers ───────────────────────────────────────────────────────────

export async function getPokemonStats(nameOrId: string) {
    const pokemon = await fetchJSON<Pokemon>(
        `${BASE_URL}/pokemon/${nameOrId.toLowerCase()}`,
    );

    const stats = Object.fromEntries(
        pokemon.stats.map((s) => [s.stat.name, s.base_stat]),
    );

    return {
        id: pokemon.id,
        name: pokemon.name,
        height_dm: pokemon.height,
        weight_hg: pokemon.weight,
        base_experience: pokemon.base_experience,
        types: pokemon.types.map((t) => t.type.name),
        abilities: pokemon.abilities.map((a) => ({
            name: a.ability.name,
            hidden: a.is_hidden,
        })),
        stats,
    };
}

export async function getPokemonMoves(nameOrId: string, limit = 20) {
    const pokemon = await fetchJSON<Pokemon>(
        `${BASE_URL}/pokemon/${nameOrId.toLowerCase()}`,
    );

    // Sort: level-up moves first (by level), then others alphabetically
    const levelUp = pokemon.moves
        .map((m) => {
            const detail = m.version_group_details.find(
                (d) => d.move_learn_method.name === 'level-up',
            );
            return {
                name: m.move.name,
                level: detail?.level_learned_at ?? null,
            };
        })
        .filter((m) => m.level !== null)
        .sort((a, b) => (a.level ?? 0) - (b.level ?? 0));

    const other = pokemon.moves
        .filter(
            (m) =>
                !m.version_group_details.some(
                    (d) => d.move_learn_method.name === 'level-up',
                ),
        )
        .map((m) => ({
            name: m.move.name,
            methods: [
                ...new Set(
                    m.version_group_details.map(
                        (d) => d.move_learn_method.name,
                    ),
                ),
            ],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        name: pokemon.name,
        total_moves: pokemon.moves.length,
        level_up_moves: levelUp.slice(0, limit),
        other_moves: other.slice(0, limit),
    };
}

export async function getMoveInfo(moveName: string) {
    const move = await fetchJSON<MoveDetail>(
        `${BASE_URL}/move/${moveName.toLowerCase().replace(/\s+/g, '-')}`,
    );

    const effect =
        move.effect_entries.find((e) => e.language.name === 'en')?.effect ??
        null;

    return {
        id: move.id,
        name: move.name,
        type: move.type.name,
        damage_class: move.damage_class.name,
        power: move.power,
        accuracy: move.accuracy,
        pp: move.pp,
        priority: move.priority,
        effect,
        meta: move.meta
            ? {
                  category: move.meta.category.name,
                  ailment: move.meta.ailment.name,
                  crit_rate: move.meta.crit_rate,
                  drain: move.meta.drain,
                  healing: move.meta.healing,
                  flinch_chance: move.meta.flinch_chance,
                  stat_chance: move.meta.stat_chance,
              }
            : null,
    };
}

export async function getTypeInfo(typeName: string) {
    const type = await fetchJSON<TypeDetail>(
        `${BASE_URL}/type/${typeName.toLowerCase()}`,
    );

    const dr = type.damage_relations;

    return {
        id: type.id,
        name: type.name,
        damage_relations: {
            double_damage_from: dr.double_damage_from.map((t) => t.name),
            double_damage_to: dr.double_damage_to.map((t) => t.name),
            half_damage_from: dr.half_damage_from.map((t) => t.name),
            half_damage_to: dr.half_damage_to.map((t) => t.name),
            no_damage_from: dr.no_damage_from.map((t) => t.name),
            no_damage_to: dr.no_damage_to.map((t) => t.name),
        },
        pokemon_count: type.pokemon.length,
        sample_pokemon: type.pokemon.slice(0, 10).map((p) => p.pokemon.name),
    };
}
