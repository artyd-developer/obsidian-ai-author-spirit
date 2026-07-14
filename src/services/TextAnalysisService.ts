import { getWords } from "../utils/text";
import { TextStats } from "../models/TextStats";

export class TextAnalysisService {

	private computeBurstiness(wordPositions: Map<string, number[]>): Map<string, number> {
		const result = new Map<string, number>();

		for (const [word, positions] of wordPositions.entries()) {

			if (positions.length < 2) {
				continue;
			}

			const gaps: number[] = [];

			for (let i = 1; i < positions.length; i++) {
				gaps.push(positions[i]! - positions[i - 1]!);
			}

			const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;

			const variance = gaps.reduce((sum, gap) => sum + (gap - avg) ** 2, 0) / gaps.length;

			result.set(word, variance);
		}

		return result;
	}

	analyze(text: string): TextStats {
		text = text.trim();

		const words = getWords(text);

		const sentences = text.split(/[.!?]+/).filter(Boolean);

		const totalWords = words.length;

		const filtered = words.filter(w => w.length > 3);

		const uniqueWords = new Set(filtered).size;

		const wordFrequency = new Map<string, number>();

		const functionWords = new Map<string, number>();

		const wordPositions = new Map<string, number[]>();

		const punctuation = new Map<string, number>();

		const wordBigrams = new Map<string, number>();

		const charTrigrams = new Map<string, number>();

		let totalWordLength = 0;

		for (let i = 0; i < words.length; i++) {

			const word = words[i]!;

			totalWordLength += word.length;

			wordFrequency.set(word,(wordFrequency.get(word) || 0) + 1);

			if (!wordPositions.has(word)) {
				wordPositions.set(word, []);
			}

			wordPositions.get(word)!.push(i);

			if (word.length <= 3) {
				functionWords.set(word, (functionWords.get(word) || 0) + 1);
			}

			if(i < words.length - 1) {
				const bigram =`${words[i]} ${words[i + 1]}`;

				wordBigrams.set(bigram,(wordBigrams.get(bigram) || 0) + 1);
			}
		}

		for (const ch of text) {
			if (",.!?;:-—".includes(ch)) {
				punctuation.set(
					ch,
					(punctuation.get(ch) || 0) + 1
				);
			}
		}

		const clean = text.replace(/\s+/g, " ");

		for (let i = 0;i < clean.length - 2;i++) {
			const trigram = clean.slice(i, i + 3);

			charTrigrams.set(trigram,(charTrigrams.get(trigram) || 0) + 1);
		}

		const burstiness =
			this.computeBurstiness(wordPositions);

		return {
			totalWords,
			uniqueWords,
			vocabularyRichness: totalWords > 0 ? uniqueWords / totalWords : 0,
			avgWordLength: totalWords > 0 ? totalWordLength / totalWords : 0,
			avgSentenceLength: sentences.length > 0 ? totalWords / sentences.length : 0,
			wordFrequency,
			punctuation,
			wordBigrams,
			charTrigrams,
			functionWords,
			burstiness
		};
	}
}