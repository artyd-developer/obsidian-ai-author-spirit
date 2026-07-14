export function getWords(text: string): string[] {
	return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}
export function getBigrams(words: string[]): string[] {
	const bigrams: string[] = [];

	for (let i = 0; i < words.length - 1; i++) {
		bigrams.push(`${words[i]} ${words[i + 1]}`);
	}

	return bigrams;
}