import AISpiritPlugin from "../main";

export interface StyleFeatureSummary {
    vocabulary: string;
    syntax: string;
    functionWords: string;
    punctuation: string;
    rhythm: string;
    ngrams?: string;
}

export interface EvidencePair {
    score: number;
    userChunk: string;
    authorChunk: string;
}

export const DEFAULT_AI_PROMPT = `You are an expert writing coach specializing in stylistic adaptation.
Your task is to help the USER adapt their writing style to be closer to the AUTHOR's style, without imitating it.

LANGUAGE RULE:
- {{langRule}}

[BASELINE STATISTICS FOR REFERENCE]
These statistics are provided for context only. You MAY use these numbers ONLY to ILLUSTRATE or EXPLAIN the differences listed in [COMPUTED STYLE GAPS]. You MUST NOT use this statistics to independently derive new differences not listed in [COMPUTED STYLE GAPS].

USER STATS:
- Vocabulary: {{userFeatures.vocabulary}}
- Syntax: {{userFeatures.syntax}}

AUTHOR STATS:
- Vocabulary: {{authorFeatures.vocabulary}}
- Syntax: {{authorFeatures.syntax}}

[COMPUTED STYLE GAPS - AUTHORITATIVE SOURCE]
This is the complete and final list of stylistic differences found by the algorithm. Work ONLY with this list.
{{topDifferences}}

[STRONGEST STYLE MATCHES]
{{topMatches}}

[TASK]
Based on the [COMPUTED STYLE GAPS] section, explain these differences to the USER and create an improvement plan.

CONSTRAINTS:
- EVERY statement or recommendation MUST be directly supported by data from [COMPUTED STYLE GAPS] or logically derived from it.
- If a statement has no support in the data above, OMIT it.
- Do NOT suggest copying unique phrases or vocabulary from the AUTHOR.
- Do NOT aim for 100% imitation.

RESPONSE STRUCTURE:

1. DIRECTION (1-2 sentences)
Briefly summarize the vector of stylistic shift based on the GAPS data (e.g., "Your style is more dynamic due to shorter sentences, while the Author uses complex syntax to create atmosphere").

2. KEY DIFFERENCES (3-5 points)
Describe ONLY the differences listed in [COMPUTED STYLE GAPS]. Use numbers from [BASELINE STATISTICS FOR REFERENCE] only for illustration (e.g., "Your sentences are shorter by 13 words on average"). Explain how these metrics affect perception.

3. ACTION PLAN (Prioritized)
Provide a plan to close the stylistic gaps. Mark each item: [HIGH], [MEDIUM], or [LOW].
- Start doing: What habits to adopt (provide an abstract example of sentence structure, WITHOUT copying real text).
- Reduce: What to avoid.

[SELF-CHECK]
Before outputting the final answer, silently check each plan item and statement:
- Is it supported by [COMPUTED STYLE GAPS] or logically derived from it?
- If not, remove that item.
Do not output the self-check text in the final response.`;

export class PromptBuilderService {

    constructor(private plugin: AISpiritPlugin) {}

    buildPrompt(params: {
        userFeatures: StyleFeatureSummary;
        authorFeatures: StyleFeatureSummary;
        topMatches: EvidencePair[];
        topDifferences: EvidencePair[];
    }): string {
        const { userFeatures, authorFeatures, topMatches, topDifferences } = params;

        const customPrompt = this.plugin.settings.aiCustomPrompt?.trim();
        const template = customPrompt || DEFAULT_AI_PROMPT;

        const formatPairs = (pairs: EvidencePair[]) =>
            pairs.slice(0, 5).map(p =>
                `[Score: ${(p.score * 100).toFixed(1)}%] USER: ${this.clean(p.userChunk)} AUTHOR: ${this.clean(p.authorChunk)}`
            ).join("\n\n");

        const langRule = this.getLangRule();

        return template
            .replace(/\{\{langRule\}\}/g, langRule)
            .replace(/\{\{userFeatures\.vocabulary\}\}/g, userFeatures.vocabulary)
            .replace(/\{\{userFeatures\.syntax\}\}/g, userFeatures.syntax)
            .replace(/\{\{userFeatures\.functionWords\}\}/g, userFeatures.functionWords)
            .replace(/\{\{userFeatures\.punctuation\}\}/g, userFeatures.punctuation)
            .replace(/\{\{userFeatures\.rhythm\}\}/g, userFeatures.rhythm)
            .replace(/\{\{authorFeatures\.vocabulary\}\}/g, authorFeatures.vocabulary)
            .replace(/\{\{authorFeatures\.syntax\}\}/g, authorFeatures.syntax)
            .replace(/\{\{authorFeatures\.functionWords\}\}/g, authorFeatures.functionWords)
            .replace(/\{\{authorFeatures\.punctuation\}\}/g, authorFeatures.punctuation)
            .replace(/\{\{authorFeatures\.rhythm\}\}/g, authorFeatures.rhythm)
            .replace(/\{\{topMatches\}\}/g, formatPairs(topMatches))
            .replace(/\{\{topDifferences\}\}/g, formatPairs(topDifferences));
    }

    private getLangRule(): string {
        const lang = this.plugin.settings.aiLanguage;

        switch (lang) {
            case "chinese":
                return "用中文回答。";
            case "english":
                return "Respond in English.";
            case "french":
                return "Réponds en français.";
            case "german":
                return "Antworte auf Deutsch.";
            case "japanese":
                return "日本語で回答してください。";
            case "russian":
                return "Отвечай на русском языке.";
            case "spanish":
                return "Responde en español.";
            default:
                return `Respond in ${lang}.`;
        }
    }

    private clean(text: string): string {
        return text.replace(/\s+/g, " ").slice(0, 400);
    }
}