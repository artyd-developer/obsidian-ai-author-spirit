import { describe, expect, it } from "vitest";

import { StatsComparisonService } from "../../src/services/StatsComparisonService";
import { TextAnalysisService } from "../../src/services/TextAnalysisService";
import { createSettings } from "../fixtures/settings";

describe("StatsComparisonService", () => {
	it("scores an identical profile higher than a different text", () => {
		const analyzer = new TextAnalysisService();
		const comparison = new StatsComparisonService();
		const settings = createSettings();
		const baseline = analyzer.analyze(
			"alpha and beta and alpha and beta. alpha and beta and alpha and beta."
		);
		const different = analyzer.analyze(
			"Extraordinary vocabulary emerges; however rhythm changes dramatically."
		);

		const identicalResult = comparison.compare(baseline, baseline, settings);
		const differentResult = comparison.compare(baseline, different, settings);

		expect(identicalResult.score).toBeCloseTo(1);
		expect(differentResult.score).toBeGreaterThanOrEqual(0);
		expect(differentResult.score).toBeLessThanOrEqual(1);
		expect(differentResult.score).toBeLessThan(identicalResult.score);
	});
});
