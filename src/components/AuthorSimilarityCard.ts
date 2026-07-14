import { setIcon } from "obsidian";
import { ProgressBar } from "./ProgressBar";

export class AuthorSimilarityCard {
    
    private card: HTMLDivElement;
    private aiContainer: HTMLDivElement;
    private aiButton: HTMLButtonElement;
    private dateEl: HTMLDivElement;
    private copyButton: HTMLButtonElement | null = null;

    constructor(parent: HTMLElement, authorName: string, score: number) {
        this.card = parent.createDiv({ cls: "ai-spirit-author-card" });

        this.card.createEl("h4", { text: authorName });

        new ProgressBar(this.card, score);
        this.card.createSpan({ text: `${score.toFixed(1)}%` });

        this.dateEl = this.card.createDiv({ cls: "ai-spirit-author-dates" });

        this.aiContainer = this.card.createDiv({ cls: "ai-spirit-ai-container" });

        this.aiButton = this.aiContainer.createEl("button", {
            cls: "ai-spirit-ai-button"
        });
        const btnIcon = this.aiButton.createSpan();
        setIcon(btnIcon, "bot");
        this.aiButton.appendText(" Analyze with AI");
        this.aiButton.addClass("ai-spirit-hidden");
    }

    setStylometryDate(timestamp: number) {
        const existing = this.dateEl.querySelector(".ai-spirit-stylometry-date");
        if (existing) existing.remove();

        const span = this.dateEl.createSpan({
            cls: "ai-spirit-stylometry-date"
        });
        const icon = span.createSpan();
        setIcon(icon, "bar-chart-2");
        span.appendText(` Stylometry: ${new Date(timestamp).toLocaleString()}`);
    }

    setAIDate(timestamp: number | null) {
        const existing = this.dateEl.querySelector(".ai-spirit-ai-date");
        if (existing) existing.remove();

        const span = this.dateEl.createSpan({
            cls: "ai-spirit-ai-date" + (timestamp ? "" : " ai-spirit-ai-pending")
        });
        const icon = span.createSpan();
        setIcon(icon, "bot");
        
        if (timestamp) {
            span.appendText(` AI Analysis: ${new Date(timestamp).toLocaleString()}`);
        } else {
            span.appendText(` AI Analysis: Click "Analyze with AI" to start`);
        }
    }

    addAIButton(callback: () => Promise<void>) {
        this.aiButton.removeClass("ai-spirit-hidden");
        this.aiButton.addEventListener("click", () => {
            void callback();
        });
    }

    showAILoading() {
        this.aiButton.disabled = true;
        this.aiButton.empty();
        const loaderIcon = this.aiButton.createSpan({ cls: "ai-spirit-spinner" });
        setIcon(loaderIcon, "hourglass");
        this.aiButton.appendText(" Analyzing...");
        this.removeCopyButton();
    }

    showAIResult(text: string) {
        this.aiButton.addClass("ai-spirit-hidden");
        
        const existing = this.aiContainer.querySelector(".ai-spirit-ai-result-wrapper");
        if (existing) existing.remove();

        const resultWrapper = this.aiContainer.createDiv({ cls: "ai-spirit-ai-result-wrapper" });
        const result = resultWrapper.createDiv({ cls: "ai-spirit-ai-result" });
        result.createEl("pre", { text });

        this.removeCopyButton();
        this.copyButton = resultWrapper.createEl("button", {
            cls: "ai-spirit-copy-button"
        });
        const copyIcon = this.copyButton.createSpan();
        setIcon(copyIcon, "clipboard-copy");
        this.copyButton.appendText(" Copy");
        this.copyButton.addEventListener("click", () => {
            void this.copyToClipboard(text);
        });
    }

    private async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            if (this.copyButton) {
                this.copyButton.empty();
                const checkIcon = this.copyButton.createSpan();
                setIcon(checkIcon, "check");
                this.copyButton.appendText(" Copied!");
                window.setTimeout(() => { 
                    if (this.copyButton) {
                        this.copyButton.empty();
                        const copyIcon = this.copyButton.createSpan();
                        setIcon(copyIcon, "clipboard-copy");
                        this.copyButton.appendText(" Copy");
                    }
                }, 2000);
            }
        } catch {
            if (this.copyButton) {
                this.copyButton.empty();
                const xIcon = this.copyButton.createSpan();
                setIcon(xIcon, "x");
                this.copyButton.appendText(" Failed");
                window.setTimeout(() => {
                    if (this.copyButton) {
                        this.copyButton.empty();
                        const copyIcon = this.copyButton.createSpan();
                        setIcon(copyIcon, "clipboard-copy");
                        this.copyButton.appendText(" Copy");
                    }
                }, 2000);
            }
        }
    }

    showAIError(message: string) {
        this.aiButton.disabled = false;
        this.aiButton.empty();
        const btnIcon = this.aiButton.createSpan();
        setIcon(btnIcon, "bot");
        this.aiButton.appendText(" Analyze with AI");
        this.removeCopyButton();

        const existing = this.aiContainer.querySelector(".ai-spirit-ai-error");
        if (existing) existing.remove();

        const error = this.aiContainer.createDiv({ cls: "ai-spirit-ai-error" });
        const warnIcon = error.createSpan();
        setIcon(warnIcon, "alert-triangle");
        error.createSpan({ text: ` ${message}` });
    }

    private removeCopyButton() {
        if (this.copyButton) {
            this.copyButton.remove();
            this.copyButton = null;
        }
    }
}