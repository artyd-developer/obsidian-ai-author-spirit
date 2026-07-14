export class ChunkComparisonService {
	
	splitIntoChunks(text: string, chunkSize: number): string[] {
		if (chunkSize <= 0) {
			return [];
		}

		const words =
			text.split(/\s+/).filter(Boolean);

		const chunks: string[] = [];

		for (let i = 0;i < words.length;i += chunkSize) {
			chunks.push(words.slice(i, i + chunkSize).join(" "));
		}

		return chunks;
	}

	average(scores: number[]): number {
		if (scores.length === 0) {
			return 0;
		}

		return (
			scores.reduce((sum, score) => sum + score,0) / scores.length
		);
	}

    weightedAverage(scores: number[]): number {
        if (scores.length === 0) {
            return 0;
        }

        let weightedSum = 0;
        let totalWeight = 0;

		scores.forEach(score => {
            const weight = 1 + score;

            weightedSum += score * weight;
            totalWeight += weight;
		});

        return weightedSum / totalWeight;
    }

	topAverage(scores: number[], topCount = 5): number {
		if (scores.length === 0) {
			return 0;
		}

		const sorted =
			[...scores]
				.sort((a, b) => b - a);

		const top =
			sorted.slice(
				0,
				Math.min(topCount, sorted.length)
			);

		return (
			top.reduce((sum, score) => sum + score,0) / top.length
		);
	}
}