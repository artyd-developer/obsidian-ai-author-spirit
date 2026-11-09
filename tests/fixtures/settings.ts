import type { AISpiritPluginSettings } from "../../src/settings";

export function createSettings(
	overrides: Partial<AISpiritPluginSettings> = {}
): AISpiritPluginSettings {
	return {
		spiritFolder: "AuthorSpirits",
		sentenceWeight: 15,
		vocabularyWeight: 5,
		functionWordsWeight: 30,
		punctuationWeight: 10,
		charTrigramsWeight: 25,
		wordBigramsWeight: 15,
		burstinessWeight: 10,
		aiEndpoint: "https://example.com/v1/chat/completions",
		aiModel: "test-model",
		aiApiKey: "test-key",
		aiTemperature: 0.3,
		aiMaxTokens: 2000,
		aiLanguage: "english",
		aiCustomPrompt: "",
		...overrides,
	};
}
