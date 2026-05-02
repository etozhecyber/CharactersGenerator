

export const CATEGORY_DEFINITIONS = [
    {
        id: 'source',
        description: "Indicates the source material the character comes from. 'Original Character' means you must create them from scratch based on other tags. If from a specific franchise (e.g., 'Genshin Impact', 'Star Wars'), you must adhere to the established lore and personality of that character from that universe."
    },
    {
        id: 'identity',
        description: "Describes the character's fundamental, unchangeable nature: their species, gender, race, or species-subtype. This is *what* the character is. For example: 'Female', 'Human', 'Elf', 'Demon', 'Robot'."
    },
    {
        id: 'appearance',
        description: "Specific details about the character's physical look. This includes body shape ('curvy', 'petite'), hair style/color, eye color, clothing style ('goth', 'office_lady'), and distinct features ('tattoos', 'glasses'). These are the visual details the user will see."
    },
    {
        id: 'personality',
        description: "Defines the character's inner world, temperament, and how they behave and react. 'Shy' means they are reserved around the user. 'Yandere' means they are obsessive and possessive towards the user. 'Kind' means they are gentle and caring towards the user. This is *how* the character acts."
    },
    {
        id: 'role',
        description: "CRITICAL: This defines the character's relationship TO THE USER ({{user}}). 'sister' means the character IS the user's sister. 'teacher' means the character IS the user's teacher. 'bully' means the character bullies the user. The scenario, dialogue, and entire card must be written from this perspective. It's not just a job title; it's their function in the story relative to the user."
    },
    {
        id: 'genre',
        description: "Establishes the setting and the 'rules' of the character's world. 'Fantasy' implies magic and medieval elements. 'Sci-Fi' implies futuristic technology and space. 'Modern Day' sets the story in a contemporary, realistic world. This tag builds the backdrop for the interaction."
    },
    {
        id: 'tone',
        description: "Defines the emotional atmosphere and writing style of the roleplay. 'Romance' should lead to romantic interactions with the user. 'Horror' should create a scary and unsettling atmosphere for the user. 'Wholesome' implies a safe, comforting, and positive interaction. This category dictates the *feel* of the experience."
    },
    {
        id: 'dynamic',
        description: "Describes a plot progression or a change in the relationship between the character and the user. 'Enemies to Lovers' means the character must start as an antagonist to the user and the scenario should allow for a gradual shift to romance. 'Transformation' implies the character will undergo a significant physical or mental change during the roleplay."
    },
    {
        id: 'kink-fetish',
        description: "For NSFW cards, this category lists specific sexual themes, kinks, and fetishes that should be the central focus of the erotic content. These tags must be explicitly and accurately represented in the character's behavior, scenario, and dialogue examples when the 'nsfw' meta tag is present."
    },
    {
        id: 'meta',
        description: "Technical tags describing the card itself or the conditions of the roleplay, not the character's persona directly. For example, 'nsfw'/'sfw' sets the overall content rating, 'roleplay' confirms it's an interactive character, and 'malepov' sets an assumption about the user's perspective. These tags govern the 'rules of the game'."
    }
];

export const ALL_CATEGORIES = CATEGORY_DEFINITIONS.map(c => c.id);

export const CATEGORY_DESCRIPTIONS: Record<string, string> = CATEGORY_DEFINITIONS.reduce((acc, category) => {
    acc[category.id] = category.description;
    return acc;
}, {} as Record<string, string>);