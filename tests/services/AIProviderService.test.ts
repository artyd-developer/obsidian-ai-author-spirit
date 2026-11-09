import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSettings } from "../fixtures/settings";

const { requestUrlMock } = vi.hoisted(() => ({
	requestUrlMock: vi.fn<(options: unknown) => Promise<unknown>>(),
}));

vi.mock("obsidian", () => ({
	requestUrl: requestUrlMock,
}));

import { AIProviderService } from "../../src/services/AIProviderService";

describe("AIProviderService", () => {
	beforeEach(() => {
		requestUrlMock.mockReset();
	});

	it("constructs an authenticated OpenAI-compatible request and returns content", async () => {
		requestUrlMock.mockResolvedValue({
			status: 200,
			text: "",
			json: {
				choices: [{ message: { content: "analysis result" } }],
			},
		});
		const provider = new AIProviderService(
			createSettings({
				aiEndpoint: "https://example.com/v1/chat/completions///",
				aiModel: "model",
				aiApiKey: "secret-key",
				aiTemperature: 0.2,
				aiMaxTokens: 750,
			})
		);

		await expect(provider.analyze("Compare these texts")).resolves.toBe(
			"analysis result"
		);
		expect(requestUrlMock).toHaveBeenCalledOnce();

		const options = requestUrlMock.mock.calls[0]?.[0] as {
			url: string;
			method: string;
			headers: Record<string, string>;
			body: string;
		};
		expect(options).toMatchObject({
			url: "https://example.com/v1/chat/completions",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer secret-key",
			},
		});
		expect(JSON.parse(options.body)).toEqual({
			model: "model",
			messages: [{ role: "user", content: "Compare these texts" }],
			temperature: 0.2,
			max_tokens: 750,
		});
	});

	it("rejects a non-successful API response with status and response text", async () => {
		requestUrlMock.mockResolvedValue({
			status: 429,
			text: "rate limited",
			json: {},
		});
		const provider = new AIProviderService(createSettings());

		await expect(provider.analyze("prompt")).rejects.toThrow(
			"API error 429: rate limited"
		);
		expect(requestUrlMock).toHaveBeenCalledOnce();
	});

});
