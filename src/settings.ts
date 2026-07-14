import { App, Notice, PluginSettingTab, Setting, TextComponent, requestUrl } from 'obsidian';
import AISpiritPlugin from './main';
import { DEFAULT_AI_PROMPT } from './services/PromptBuilderService';
import { PromptEditorModal } from "./components/PromptEditorModal";

export interface AISpiritPluginSettings {
    spiritFolder: string;
    sentenceWeight: number;
    vocabularyWeight: number;
    functionWordsWeight: number;
    punctuationWeight: number;
    charTrigramsWeight: number;
    wordBigramsWeight: number;
    burstinessWeight: number;

    aiEndpoint: string;
    aiModel: string;
    aiApiKey: string;
    aiTemperature: number;
    aiMaxTokens: number;
    aiLanguage: string;
    aiCustomPrompt: string;
}

export const DEFAULT_SETTINGS: AISpiritPluginSettings = {
    spiritFolder: "AuthorSpirits",
    sentenceWeight: 15,
    vocabularyWeight: 5,
    functionWordsWeight: 30,
    punctuationWeight: 10,
    charTrigramsWeight: 25,
    wordBigramsWeight: 15,
    burstinessWeight: 10,

    aiEndpoint: "http://localhost:11434/v1/chat/completions",
    aiModel: "llama3.2:1b",
    aiApiKey: "",
    aiTemperature: 0.3,
    aiMaxTokens: 2000,
    aiLanguage: "english",
    aiCustomPrompt: "",
};

interface ChatResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

export class SettingTab extends PluginSettingTab {
    plugin: AISpiritPlugin;
    private apiKeyInput: TextComponent | null = null;

    constructor(app: App, plugin: AISpiritPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getSettingDefinitions() {
         const definitions: ReturnType<PluginSettingTab['getSettingDefinitions']> = [
            {
                name: 'Author spirits folder',
                desc: 'Folder containing author notes for stylometry comparison',
                control: {
                    type: 'text',
                    key: 'spiritFolder',
                    placeholder: 'AuthorSpirits',
                },
            },

            { name: 'Stylometry weights', heading: 'Stylometry weights'},

            {
                name: 'Sentence length similarity',
                desc: 'Average number of words per sentence.',
                control: { type: 'slider', key: 'sentenceWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Vocabulary richness',
                desc: 'Unique words relative to text size.',
                control: { type: 'slider', key: 'vocabularyWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Function words similarity',
                desc: 'Common words such as: and, the, in, of, to.',
                control: { type: 'slider', key: 'functionWordsWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Punctuation usage',
                desc: 'Frequency of commas, dashes, semicolons and punctuation.',
                control: { type: 'slider', key: 'punctuationWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Character trigrams',
                desc: '3-character patterns. Examples: "ing", "pre", "old".',
                control: { type: 'slider', key: 'charTrigramsWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Word bigrams',
                desc: 'Two-word combinations. Examples: "of the", "in the", "like as".',
                control: { type: 'slider', key: 'wordBigramsWeight', min: 0, max: 99, step: 1 },
            },
            {
                name: 'Burstiness',
                desc: 'How clustered repeated words are throughout the text.',
                control: { type: 'slider', key: 'burstinessWeight', min: 0, max: 99, step: 1 },
            },

            {
                name: 'Reset to recommended',
                desc: 'Restore recommended stylometry weights.',
                action: () => {
                    void this.resetWeights();
                },
            },

            { name: 'AI analysis (OpenAI-compatible)', heading: 'AI analysis (OpenAI-compatible)' },

            {
                name: 'API endpoint',
                desc: 'OpenAI-compatible endpoint. Ollama default: http://localhost:11434/v1/chat/completions',
                control: {
                    type: 'text',
                    key: 'aiEndpoint',
                    placeholder: 'http://localhost:11434/v1/chat/completions',
                },
            },
            {
                name: 'Model',
                desc: 'Model name. Ollama: llama3.2:1b. OpenAI: gpt-4o-mini',
                control: {
                    type: 'text',
                    key: 'aiModel',
                    placeholder: 'llama3.2:1b',
                },
            },

            {
                name: 'API key',
                desc: 'Required for OpenAI and cloud providers. Leave empty for local ollama.',
                render: (setting: Setting) => {
                    let input: TextComponent;
                    setting.addText((text: TextComponent) => {
                        input = text;
                        // eslint-disable-next-line
                        text.setPlaceholder('(optional for local)')
                            .setValue(this.plugin.settings.aiApiKey)
                            .onChange(async (value: string) => {
                                this.plugin.settings.aiApiKey = value.trim();
                                await this.plugin.saveData(this.plugin.settings);
                            });
                        text.inputEl.type = 'password';
                    });
                    setting.addExtraButton((button) => {
                        button.setIcon('eye')
                            .setTooltip('Toggle API key visibility')
                            .onClick(() => {
                                input.inputEl.type =
                                    input.inputEl.type === 'password' ? 'text' : 'password';
                            });
                    });
                },
            },

            {
                name: 'Temperature',
                desc: '0 = consistent, 0.5 = balanced, 1 = creative. Recommended: 0.2–0.4 for style analysis',
                control: { type: 'slider', key: 'aiTemperature', min: 0, max: 1, step: 0.05 },
            },
            {
                name: 'Max tokens',
                desc: 'Maximum response length. Analysis typically needs 300-500 words (~400-700 tokens)',
                control: { type: 'slider', key: 'aiMaxTokens', min: 512, max: 4096, step: 50 },
            },
            {
                name: 'AI response language',
                desc: 'Language for AI analysis.',
                control: {
                    type: 'dropdown',
                    key: 'aiLanguage',
                    options: {
                        chinese: 'Chinese',
                        english: 'English',
                        french: 'French',
                        german: 'German',
                        japanese: 'Japanese',
                        russian: 'Russian',
                        spanish: 'Spanish',
                    },
                },
            },

            {
                name: 'Custom AI prompt',
                desc: this.plugin.settings.aiCustomPrompt
                    ? 'Custom prompt is active. Click to edit or reset.'
                    : 'Default prompt is active. Click to customize.',
                render: (setting: Setting) => {
                    setting.addButton((button) => {
                        button.setButtonText(
                            this.plugin.settings.aiCustomPrompt
                                ? 'Edit custom prompt'
                                : 'Customize prompt'
                        );
                        button.onClick(() => {
                            this.openPromptEditor();
                        });
                    });
                    setting.addExtraButton((button) => {
                        button.setIcon('reset')
                            .setTooltip('Reset to default prompt')
                            .onClick(() => {
                                void this.resetPrompt();
                            });
                    });
                },
            },

            {
                name: 'Test connection',
                desc: 'Send a ping to verify the endpoint works',
                action: () => {
                    void this.testConnection();
                },
            },
        ];
        return definitions;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Author spirits folder')
            .setDesc('Folder containing author notes for stylometry comparison')
            .addText((text: TextComponent) =>
                text
                    // eslint-disable-next-line
                    .setPlaceholder('AuthorSpirits')
                    .setValue(this.plugin.settings.spiritFolder)
                    .onChange(async (value: string) => {
                        this.plugin.settings.spiritFolder = value.trim() || 'AuthorSpirits';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName('Stylometry weights').setHeading();

        const addWeightSlider = (name: string, desc: string, key: keyof AISpiritPluginSettings) => {
            let valueDisplay: HTMLSpanElement;

            const setting = new Setting(containerEl)
                .setName(name)
                .setDesc(desc)
                .addSlider(slider =>
                    slider
                        .setLimits(0, 99, 1)
                        .setValue(this.plugin.settings[key] as number)
                        .onChange(async (value: number) => {
                            (this.plugin.settings[key] as number) = value;
                            if (valueDisplay) valueDisplay.textContent = `${value}%`;
                            await this.plugin.saveSettings();
                        })
                );

            valueDisplay = setting.settingEl.createSpan({
                text: `${this.plugin.settings[key]}%`,
                cls: 'ai-spirit-weight-value',
            });
        };

        addWeightSlider('Sentence length similarity', 'Average number of words per sentence.', 'sentenceWeight');
        addWeightSlider('Vocabulary richness', 'Unique words relative to text size.', 'vocabularyWeight');
        addWeightSlider('Function words similarity', 'Common words such as: and, the, in, of, to.', 'functionWordsWeight');
        addWeightSlider('Punctuation usage', 'Frequency of commas, dashes, semicolons and punctuation.', 'punctuationWeight');
        addWeightSlider('Character trigrams', '3-character patterns. Examples: "ing", "pre", "old".', 'charTrigramsWeight');
        addWeightSlider('Word bigrams', 'Two-word combinations. Examples: "of the", "in the", "like as".', 'wordBigramsWeight');
        addWeightSlider('Burstiness', 'How clustered repeated words are throughout the text.', 'burstinessWeight');

        new Setting(containerEl)
            .setName('Reset to recommended')
            .setDesc('Restore recommended stylometry weights.')
            .addButton(button =>
                button.setButtonText('Reset').onClick(() => {
                    void this.resetWeights();
                })
            );

        new Setting(containerEl).setName('AI analysis (OpenAI-compatible)').setHeading();

        new Setting(containerEl)
            .setName('API endpoint')
            .setDesc('OpenAI-compatible endpoint. Ollama default: http://localhost:11434/v1/chat/completions')
            .addText((text: TextComponent) =>
                text
                    // eslint-disable-next-line
                    .setPlaceholder('http://localhost:11434/v1/chat/completions')
                    .setValue(this.plugin.settings.aiEndpoint)
                    .onChange(async (value: string) => {
                        this.plugin.settings.aiEndpoint = value.trim().replace(/\/+$/, '');
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Model')
            // eslint-disable-next-line
            .setDesc('Model name. Ollama: llama3.2:1b. OpenAI: gpt-4o-mini')
            .addText((text: TextComponent) =>
                text
                    // eslint-disable-next-line
                    .setPlaceholder('llama3.2:1b')
                    .setValue(this.plugin.settings.aiModel)
                    .onChange(async (value: string) => {
                        this.plugin.settings.aiModel = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('API key')
            .setDesc('Required for OpenAI and cloud providers. Leave empty for local ollama.')
            .addText((text: TextComponent) => {
                this.apiKeyInput = text;
                text
                    // eslint-disable-next-line
                    .setPlaceholder('(optional for local)')
                    .setValue(this.plugin.settings.aiApiKey)
                    .onChange(async (value: string) => {
                        this.plugin.settings.aiApiKey = value.trim();
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password';
                return text;
            })
            .addExtraButton(button => {
                button
                    .setIcon('eye')
                    .setTooltip('Toggle API key visibility')
                    .onClick(() => {
                        if (this.apiKeyInput) {
                            this.apiKeyInput.inputEl.type =
                                this.apiKeyInput.inputEl.type === 'password' ? 'text' : 'password';
                        }
                    });
            });

        let tempValueDisplay: HTMLSpanElement;
        const tempSetting = new Setting(containerEl)
            .setName('Temperature')
            .setDesc('0 = consistent, 0.5 = balanced, 1 = creative.')
            .addSlider(slider =>
                slider
                    .setLimits(0, 1, 0.05)
                    .setValue(this.plugin.settings.aiTemperature)
                    .onChange(async (value: number) => {
                        this.plugin.settings.aiTemperature = value;
                        if (tempValueDisplay) tempValueDisplay.textContent = value.toFixed(2);
                        await this.plugin.saveSettings();
                    })
            );
        tempValueDisplay = tempSetting.settingEl.createSpan({
            text: this.plugin.settings.aiTemperature.toFixed(2),
            cls: 'ai-spirit-weight-value',
        });

        let tokensValueDisplay: HTMLSpanElement;
        const tokensSetting = new Setting(containerEl)
            .setName('Max tokens')
            .setDesc('Maximum response length. 300-500 words (~400-700 tokens)')
            .addSlider(slider =>
                slider
                    .setLimits(512, 4096, 50)
                    .setValue(this.plugin.settings.aiMaxTokens)
                    .onChange(async (value: number) => {
                        this.plugin.settings.aiMaxTokens = value;
                        if (tokensValueDisplay) tokensValueDisplay.textContent = value.toString();
                        await this.plugin.saveSettings();
                    })
            );
        tokensValueDisplay = tokensSetting.settingEl.createSpan({
            text: this.plugin.settings.aiMaxTokens.toString(),
            cls: 'ai-spirit-weight-value',
        });

        new Setting(containerEl)
            .setName('AI response language')
            .setDesc('Language for AI analysis.')
            .addDropdown(dropdown =>
                dropdown
                    .addOption('chinese', 'Chinese')
                    .addOption('english', 'English')
                    .addOption('french', 'French')
                    .addOption('german', 'German')
                    .addOption('japanese', 'Japanese')
                    .addOption('russian', 'Russian')
                    .addOption('spanish', 'Spanish')
                    .setValue(this.plugin.settings.aiLanguage)
                    .onChange(async (value: string) => {
                        this.plugin.settings.aiLanguage = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Custom AI prompt')
            .setDesc(this.plugin.settings.aiCustomPrompt
                ? 'Custom prompt is active.'
                : 'Default prompt is active.')
            .addButton(button =>
                button
                    .setButtonText(this.plugin.settings.aiCustomPrompt ? 'Edit custom prompt' : 'Customize prompt')
                    .onClick(() => {
                        this.openPromptEditor();
                    })
            )
            .addExtraButton(button => {
                button
                    .setIcon('reset')
                    .setTooltip('Reset to default prompt')
                    .onClick(() => {
                        void this.resetPrompt();
                    });
            });

        new Setting(containerEl)
            .setName('Test connection')
            .setDesc('Send a ping to verify the endpoint works')
            .addButton(button =>
                button.setButtonText('Test').onClick(() => {
                    void this.testConnection();
                })
            );
    }

    private async resetWeights(): Promise<void> {
        this.plugin.settings.sentenceWeight = DEFAULT_SETTINGS.sentenceWeight;
        this.plugin.settings.vocabularyWeight = DEFAULT_SETTINGS.vocabularyWeight;
        this.plugin.settings.functionWordsWeight = DEFAULT_SETTINGS.functionWordsWeight;
        this.plugin.settings.punctuationWeight = DEFAULT_SETTINGS.punctuationWeight;
        this.plugin.settings.charTrigramsWeight = DEFAULT_SETTINGS.charTrigramsWeight;
        this.plugin.settings.wordBigramsWeight = DEFAULT_SETTINGS.wordBigramsWeight;
        this.plugin.settings.burstinessWeight = DEFAULT_SETTINGS.burstinessWeight;
        await this.plugin.saveSettings();
        super.update();
    }

    private async resetPrompt(): Promise<void> {
        this.plugin.settings.aiCustomPrompt = '';
        await this.plugin.saveSettings();
        super.update();
    }

    private async testConnection(): Promise<void> {
        if (!this.plugin.settings.aiEndpoint) {
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            new Notice('[!] Please enter an API endpoint URL.');
            return;
        }
        if (!this.plugin.settings.aiModel) {
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            new Notice('[!] Please enter a model name.');
            return;
        }

        const notice = new Notice('Testing connection...', 0);

        try {
            const response = await requestUrl({
                url: this.plugin.settings.aiEndpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.plugin.settings.aiApiKey
                        ? { Authorization: `Bearer ${this.plugin.settings.aiApiKey}` }
                        : {}),
                },
                body: JSON.stringify({
                    model: this.plugin.settings.aiModel,
                    messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
                    temperature: 0,
                }),
            });

            notice.hide();

            if (response.status === 200) {
                const data = response.json as ChatResponse;
                const content = data.choices?.[0]?.message?.content ?? 'No content';
                new Notice(`Connected! Response: ${content.slice(0, 100)}`);
            } else {
                new Notice(`Error ${response.status}`);
            }
        } catch (error: unknown) {
            notice.hide();
            const message = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`Connection failed: ${message}`);
        }
    }

    private openPromptEditor(): void {
        const promptModal = new PromptEditorModal(
            this.app,
            this.plugin.settings.aiCustomPrompt || DEFAULT_AI_PROMPT,
            (newPrompt: string) => {
                void this.savePrompt(newPrompt);
            },
            DEFAULT_AI_PROMPT
        );

        promptModal.open();
    }

    private async savePrompt(newPrompt: string): Promise<void> {
        this.plugin.settings.aiCustomPrompt =
            newPrompt.trim() === DEFAULT_AI_PROMPT.trim() ? '' : newPrompt;

        await this.plugin.saveSettings();

        this.refreshSettings();
    }

    private refreshSettings(): void {
        if ("update" in this && typeof this.update === "function") {
            this.update();
        } else {
            // eslint-disable-next-line
            this.display();
        }
    }
}