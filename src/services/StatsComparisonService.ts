import { StylometryService } from "./StylometryService";

import { AISpiritPluginSettings } from "../settings";

import { TextStats } from "../models/TextStats";

export class StatsComparisonService {

	private engine = new StylometryService();

	compare(user: TextStats, author: TextStats, settings: AISpiritPluginSettings) {
		const metrics = this.engine.compare(user, author);

		const total = settings.sentenceWeight +
			settings.vocabularyWeight +
			settings.functionWordsWeight +
			settings.punctuationWeight +
			settings.charTrigramsWeight +
			settings.wordBigramsWeight +
			settings.burstinessWeight;

		const safeTotal = Math.max(total, 1);

		const score = metrics.sentence * (settings.sentenceWeight / safeTotal) +
			metrics.vocab * (settings.vocabularyWeight / safeTotal) +
			metrics.functionWords * (settings.functionWordsWeight / safeTotal) +
			metrics.punctuation * (settings.punctuationWeight / safeTotal) +
			metrics.charNgrams * (settings.charTrigramsWeight / safeTotal) +
			metrics.wordBigrams * (settings.wordBigramsWeight / safeTotal) +
			metrics.burst * (settings.burstinessWeight / safeTotal);

		return {score,...metrics};
	}
}