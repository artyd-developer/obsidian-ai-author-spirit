import { TextStats } from "../models/TextStats";

export class StylometryService {

	private normalize(a: number, b: number): number {
		if (a === 0 && b === 0) {
			return 1;
		}

		return 1 - Math.abs(a - b) / Math.max(a, b);
	}

	compare(user: TextStats, author: TextStats) {
		const sentence = this.normalize(user.avgSentenceLength,author.avgSentenceLength);

		const vocab = this.normalize(user.vocabularyRichness,author.vocabularyRichness);

		const functionWords = this.compareMap(user.functionWords,author.functionWords);

		const punctuation = this.compareMap(user.punctuation,author.punctuation);

		const charNgrams = this.compareMap(user.charTrigrams,author.charTrigrams);

		const wordBigrams = this.compareMap(user.wordBigrams,author.wordBigrams);

		const burst = this.compareBurst(user.burstiness,author.burstiness);

		return {
			sentence,
			vocab,
			functionWords,
			punctuation,
			charNgrams,
			wordBigrams,
			burst
		};
	}

	private compareMap(a: Map<string, number>, b: Map<string, number>): number {
		const aTotal = [...a.values()].reduce((s, v) => s + v, 0) || 1;

		const bTotal = [...b.values()].reduce((s, v) => s + v, 0) || 1;

		let score = 0;

		for (const [k, v] of a.entries()) {
			const wa = v / aTotal;
			const wb = (b.get(k) || 0) / bTotal;

			score += Math.min(wa, wb);
		}

		return score;
	}

	private compareBurst(a: Map<string, number>, b: Map<string, number>): number {
		const keys =new Set([...a.keys(),...b.keys()]);

		let score = 0;
		let count = 0;

		for (const k of keys) {
			const av =a.get(k) || 0;

			const bv =b.get(k) || 0;

			score +=this.normalize(av, bv);

			count++;
		}

		return count ? score / count : 0;
	}
}