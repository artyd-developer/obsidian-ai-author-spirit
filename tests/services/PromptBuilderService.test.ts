import { describe, expect, it } from "vitest";

import { PromptBuilderService } from "../../src/services/PromptBuilderService";
import { createSettings } from "../fixtures/settings";

describe("PromptBuilderService", () => {
	it("expands a custom prompt with language, features, and cleaned evidence", () => {
		const customPrompt = [
			"{{langRule}}",
			"{{userFeatures.vocabulary}} | {{userFeatures.syntax}}",
			"{{authorFeatures.vocabulary}} | {{authorFeatures.syntax}}",
			"MATCHES: {{topMatches}}",
			"DIFFERENCES: {{topDifferences}}",
		].join("\n");
		const plugin = {
			settings: createSettings({
				aiLanguage: "russian",
				aiCustomPrompt: customPrompt,
			}),
		} as unknown as ConstructorParameters<typeof PromptBuilderService>[0];
		const builder = new PromptBuilderService(plugin);

		const prompt = builder.buildPrompt({
			userFeatures: {
				vocabulary: "user vocabulary",
				syntax: "user syntax",
				functionWords: "user function words",
				punctuation: "user punctuation",
				rhythm: "user rhythm",
			},
			authorFeatures: {
				vocabulary: "author vocabulary",
				syntax: "author syntax",
				functionWords: "author function words",
				punctuation: "author punctuation",
				rhythm: "author rhythm",
			},
			topMatches: [
				{ score: 0.875, userChunk: "User\n chunk", authorChunk: "Author   chunk" },
			],
			topDifferences: [
				{ score: 0.25, userChunk: "Short user", authorChunk: "Short author" },
			],
		});

		expect(prompt).toContain("Отвечай на русском языке.");
		expect(prompt).toContain("user vocabulary | user syntax");
		expect(prompt).toContain("author vocabulary | author syntax");
		expect(prompt).toContain("[Score: 87.5%] USER: User chunk AUTHOR: Author chunk");
		expect(prompt).toContain("[Score: 25.0%] USER: Short user AUTHOR: Short author");
		expect(prompt).not.toMatch(/\{\{.+?\}\}/);
	});
});
