import type { FullCharacter } from '../types';

// This provides the specific writing guidelines for each field of the character card.
// These rules are used both for initial generation and for refinement to ensure consistency.
export const fieldSpecificInstructions: Record<keyof FullCharacter, string> = {
    name: `The character's name. It should be creative and fitting for the character's concept.`,
    
    description: `This is the core of the card, providing a comprehensive overview. Structure it with Markdown headings for excellent readability. The content MUST be deeply influenced by the user's selected tags.
- **## Appearance**: Provide a vivid and detailed description of the character's physical look. Include hair (color, style, length), eyes, height, weight, body type (e.g., slim, muscular, curvy), skin tone, and any distinctive features like tattoos or scars.
- **## Background**: Write a concise but compelling backstory. Where are they from? What significant events shaped them?
- **## Main Outfit**: Describe their typical or iconic outfit in detail. What do they wear on a day-to-day basis?
- **## Skills & Abilities**: List and briefly describe any special skills, talents, or powers they possess.
- **## Goals**: What drives the character? What are their short-term or long-term goals?
- **## Likes & Dislikes**: List a few things they love and a few things they hate to add more personality.`,
    
    personality: `This is NOT a generic list of traits. Provide a DEEP and SPECIFIC description of the character's personality.
- **Core Traits**: Go beyond single words. Explain the core aspects of their personality.
- **Quirks & Habits**: Describe their unique habits, mannerisms, and quirks. What do they do when they're nervous, happy, or angry?
- **Demeanor & Speech**: How do they carry themselves? What is their typical way of speaking (e.g., formal, slang, quiet, loud, sarcastic)?
- **Internal World**: Give a glimpse into their inner thoughts or moral compass.
Your goal is to provide a guide for how this character will uniquely behave, speak, and act during roleplay. Be very specific and detailed.`,
    
    first_mes: `The primary opening message for the user. Do NOT write a simple "Hello". You must craft a proper, immersive scene.
**Formatting Rules**:
1.  **Actions & Descriptions**: Wrap all non-dialogue text (actions, thoughts, descriptions) in *italics*.
2.  **Dialogue**: Wrap all spoken words in "quotation marks".
3.  **Emphasis**: Use **bold formatting** for important words or sound effects.
**Content Rules**:
- Write in the third-person narrative style.
- Describe the setting, the character's actions, and their current state of mind.
- The message MUST end with a clear hook, dialogue, or question directed at the user to prompt a response.
Example: *She looks up from her book, a curious glint in her eyes.* "I was wondering when you'd arrive."`,
    
    alternate_greetings: `An array of 3-5 alternative starting messages. Each greeting must present a different opening scene or situation for variety.
**Formatting Rules**:
1.  **Actions & Descriptions**: Wrap all non-dialogue text (actions, thoughts, descriptions) in *italics*.
2.  **Dialogue**: Wrap all spoken words in "quotation marks".
3.  **Emphasis**: Use **bold formatting** for important words or sound effects.
**Content Rules**:
- Each greeting must be a rich, immersive scene, not a simple "Hello".
- Write in the third-person narrative style.
- Describe the setting, the character's actions, and their current state of mind.
- Each must end with a clear hook, dialogue, or question directed at the user to prompt a response.`,
    
    mes_example: `This is a CRITICAL field that defines the character's voice for the AI. Provide 2-4 distinct examples of roleplay dialogue.
**RULES:**
1.  **Separator:** Every single example MUST begin with '<START>' on a new line.
2.  **Participants:** Use '{{user}}' for the user's part and '{{char}}' for the character's part.
3.  **Formatting - THIS IS VERY IMPORTANT:**
    - **Actions & Descriptions**: Wrap all non-dialogue text (physical actions, facial expressions, internal thoughts, environmental descriptions) in *italic asterisks*.
    - **Dialogue**: Wrap all spoken words in "double quotation marks".
    - **Emphasis**: Use **bold asterisks** for emphasis or sound effects (**BOOM**, **CRASH**).
4.  **Content:** The character's response MUST showcase their personality. The mix of actions, dialogue, and thoughts is essential for a realistic portrayal.
5.  **Purpose:** This field is a template. The AI will directly copy this formatting and style. Make it a perfect representation of the character.

**Example of a good entry:**
<START>
{{user}}: You've been quiet today. Everything okay?
{{char}}: *A small, warm smile spreads across her face at their question. They noticed. She continues chopping vegetables for dinner.* "Just thinking," *she says, glancing over her shoulder at them.* "How was your day? Any good stories?" *Let's see if I can get them to open up.*
<START>
{{user}}: What's that you're reading? Looks intense.
{{char}}: *A blush rushes to her cheeks and she quickly tries to hide the book.* "I-it's nothing!" *she stammers, her voice a little too high. This is so embarrassing!* "Just... research. For a... a friend." *Please, please just drop it.*`,
    
    scenario: `A concise (1-2 sentence) definition of the roleplay's context and the initial relationship between the character ({{char}}) and the user ({{user}}).`
};