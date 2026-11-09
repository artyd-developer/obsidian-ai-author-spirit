import { describe, expect, it } from "vitest";

import { TextAnalysisService } from "../../src/services/TextAnalysisService";

describe("TextAnalysisService", () => {
	const service = new TextAnalysisService();

	it("calculates stylometric metrics for multilingual text and varied punctuation", () => {
		const stats = service.analyze("Привет, мир! Alpha—beta? Привет.");

		expect(stats.totalWords).toBe(5);
		expect(stats.uniqueWords).toBe(3);
		expect(stats.vocabularyRichness).toBeCloseTo(0.6);
		expect(stats.avgWordLength).toBeCloseTo(4.8);
		expect(stats.avgSentenceLength).toBeCloseTo(5 / 3);

		expect(stats.wordFrequency.get("привет")).toBe(2);
		expect(stats.functionWords.get("мир")).toBe(1);
		expect(stats.wordBigrams.get("alpha beta")).toBe(1);
		expect(stats.charTrigrams.get("При")).toBe(2);
		expect(stats.burstiness.get("привет")).toBe(0);
		expect(Object.fromEntries(stats.punctuation)).toEqual({
			",": 1,
			"!": 1,
			"—": 1,
			"?": 1,
			".": 1,
		});
	});

	it("returns zero-valued metrics and empty maps for empty text", () => {
		const stats = service.analyze("   \n\t  ");

		expect(stats).toMatchObject({
			totalWords: 0,
			uniqueWords: 0,
			vocabularyRichness: 0,
			avgWordLength: 0,
			avgSentenceLength: 0,
		});

		for (const values of [
			stats.wordFrequency,
			stats.functionWords,
			stats.punctuation,
			stats.wordBigrams,
			stats.charTrigrams,
			stats.burstiness,
		]) {
			expect(values.size).toBe(0);
		}
	});
});
