export interface TextStats {
	totalWords: number;
	uniqueWords: number;
	vocabularyRichness: number;
	avgWordLength: number;
	avgSentenceLength: number;
	wordFrequency: Map<string, number>;
	punctuation: Map<string, number>;
	charTrigrams: Map<string, number>;
	wordBigrams: Map<string, number>;
	functionWords: Map<string, number>;
	burstiness: Map<string, number>;
}