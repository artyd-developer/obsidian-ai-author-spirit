import { describe, expect, it, vi } from "vitest";

import type { AuthorEvidenceData } from "../../src/types/AuthorEvidenceData";

vi.mock("obsidian", () => ({
	Notice: vi.fn(),
}));

import { CacheService } from "../../src/services/CacheService";

describe("CacheService", () => {
	it("persists and reloads results and detects stale files", async () => {
		let storedCache: string | null = null;
		const loadLocalStorage = vi.fn(() => storedCache);
		const saveLocalStorage = vi.fn((_key: string, value: string) => {
			storedCache = value;
		});
		const plugin = {
			app: {
				loadLocalStorage,
				saveLocalStorage,
			},
		} as unknown as ConstructorParameters<typeof CacheService>[0];
		const evidence: AuthorEvidenceData = {
			score: 0.75,
			bestPairs: [],
			worstPairs: [],
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
			stylometryDate: 1_700_000_000_000,
			aiDate: null,
			aiResponse: null,
		};

		const initialCache = new CacheService(plugin);
		initialCache.setUserData(
			"notes/draft.md",
			{ totalWords: 3 },
			["one two three"],
			1_000
		);
		initialCache.setAuthorEvidence("notes/draft.md", "Author", evidence);
		await initialCache.save();

		expect(saveLocalStorage).toHaveBeenCalledOnce();
		expect(storedCache).not.toBeNull();

		const reloadedCache = new CacheService(plugin);
		await reloadedCache.load();

		expect(reloadedCache.getFile("notes/draft.md")).toMatchObject({
			mtime: 1_000,
			userChunks: ["one two three"],
		});
		expect(reloadedCache.getAuthorEvidence("notes/draft.md", "Author")).toEqual(
			evidence
		);
		expect(reloadedCache.isFileChanged("notes/draft.md", 1_000)).toBe(false);
		expect(reloadedCache.isFileChanged("notes/draft.md", 1_001)).toBe(true);
		expect(reloadedCache.isFileChanged("notes/missing.md", 1_000)).toBe(true);
	});
});
