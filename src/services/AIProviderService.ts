import { AISpiritPluginSettings } from "../settings";

import { requestUrl } from "obsidian";

interface AIResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}


export class AIProviderService {
    
    constructor(private settings: AISpiritPluginSettings) {}

    async analyze(prompt: string): Promise<string> {
        const endpoint = this.settings.aiEndpoint.replace(/\/+$/, "");
        
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        
        if (this.settings.aiApiKey) {
            headers["Authorization"] = `Bearer ${this.settings.aiApiKey}`;
        }

        const response = await requestUrl({
            url: endpoint,
            method: "POST",
            headers,
            body: JSON.stringify({
                model: this.settings.aiModel,
                messages: [{ role: "user", content: prompt }],
                temperature: this.settings.aiTemperature,
                max_tokens: this.settings.aiMaxTokens
            })
        });

        if (response.status !== 200) {
            throw new Error(`API error ${response.status}: ${response.text}`);
        }

        const data = response.json as AIResponse;
        return data.choices?.[0]?.message?.content ?? "";
    }
}