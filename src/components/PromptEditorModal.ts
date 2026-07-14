import { App, Modal } from "obsidian";

export class PromptEditorModal extends Modal {
    
    private prompt: string;
    private onSave: (prompt: string) => void;
    private defaultPrompt: string;
    private defaultUIRowSize = 20;

    constructor(app: App, prompt: string, onSave: (prompt: string) => void, defaultPrompt: string) {
        super(app);
        this.prompt = prompt;
        this.onSave = onSave;
        this.defaultPrompt = defaultPrompt;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.empty();
        contentEl.createEl("h2", { text: "Edit AI prompt" });
        contentEl.createEl("p", { 
            text: "Available placeholders: {{langRule}}, {{userFeatures.vocabulary}}, {{userFeatures.syntax}}, {{userFeatures.functionWords}}, {{userFeatures.punctuation}}, {{userFeatures.rhythm}}, {{authorFeatures.*}}, {{topMatches}}, {{topDifferences}}",
            cls: "ai-spirit-prompt-info"
        });

        const textarea = contentEl.createEl("textarea", {
            cls: "ai-spirit-prompt-textarea"
        });
        textarea.value = this.prompt;
        textarea.rows = this.defaultUIRowSize;

        const buttonContainer = contentEl.createDiv({ cls: "ai-spirit-prompt-buttons" });

        const resetButton = buttonContainer.createEl("button", {
            text: "Reset to default",
            cls: "mod-warning"
        });
        resetButton.addEventListener("click", () => {
            textarea.value = this.defaultPrompt;
        });

        const cancelButton = buttonContainer.createEl("button", {
            text: "Cancel"
        });
        cancelButton.addEventListener("click", () => {
            this.close();
        });

        const saveButton = buttonContainer.createEl("button", {
            text: "Save",
            cls: "mod-cta"
        });
        saveButton.addEventListener("click", () => {
            this.onSave(textarea.value);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}