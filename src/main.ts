import { Notice, Plugin, TFolder } from "obsidian";

import { DEFAULT_SETTINGS, AISpiritPluginSettings, SettingTab } from "./settings";

import { AISpiritView, VIEW_TYPE } from "./views/AISpiritView";

import { AuthorService } from "./services/AuthorService";
import { TextAnalysisService } from "./services/TextAnalysisService";
import { CacheService } from "./services/CacheService";
import { getAISpiritView } from "./utils/ui";

export default class AISpiritPlugin extends Plugin {

	settings!: AISpiritPluginSettings;

	authorService!: AuthorService;

	textAnalysisService!: TextAnalysisService;

	cacheService!: CacheService;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.authorService = new AuthorService(this.app, this.settings);
		this.textAnalysisService = new TextAnalysisService();
		this.cacheService = new CacheService(this);
		await this.cacheService.load();

		this.app.workspace.onLayoutReady(async () => {
			await this.checkSpiritFolder();
		});

		this.registerView(
			VIEW_TYPE,
			(leaf) =>
				new AISpiritView(
					leaf,
					this
				)
		);

        this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (!file) return;
				const view = getAISpiritView(this.app);
				void view?.update();
			})
		);

		this.addRibbonIcon(
			"brain",
			// eslint-disable-next-line
			"AI Author Spirit",
			async () => {
				const { workspace } = this.app;

				let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];

				if (!leaf) {
					const rightLeaf = workspace.getRightLeaf(false);
					if (rightLeaf) {
						await rightLeaf.setViewState({ type: VIEW_TYPE, active: true });
						leaf = rightLeaf;
					}
				}

				if (leaf) {
					await workspace.revealLeaf(leaf);

					const view = leaf.view as AISpiritView;
					if (view) {
						void view.update();
					}
				}
			}
		);

		this.addCommand({
			id: "show-authors",
			name: "Show authors",

			callback: () => {
				const authors =
					this.authorService
						.getAuthorNames();

				new Notice(
					authors.length
						? `Authors found:\n${authors.join("\n")}`
						: "No authors found"
				);
			}
		});

		this.addCommand({
			id: "analyze-authors",
			name: "Analyze authors",

			callback: async () => {
				const authors = this.authorService.getAuthorFolders();

				if (authors.length === 0) {
					new Notice("No authors found");
					return;
				}

				new Notice(`Analyzing ${authors.length} author(s)...`);

				for (const author of authors) {
					const corpus = await this.authorService.buildAuthorCorpus(author);
					
					if (!corpus || corpus.split(/\s+/).length < 10) {
						new Notice(`${author.name}: Not enough text (min 10 words)`);
						continue;
					}
					
					const stats = this.textAnalysisService.analyze(corpus);
					
					const totalChars = corpus.length;
					const totalSentences = corpus.split(/[.!?]+/).filter(Boolean).length;
					
					const topWords = [...stats.wordFrequency.entries()]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([word, count]) => `${word}(${count})`)
						.join(", ");
					
					const topBigrams = [...stats.wordBigrams.entries()]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 5)
						.map(([bigram, count]) => `${bigram}(${count})`)
						.join(", ");
					
					const topTrigrams = [...stats.charTrigrams.entries()]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 5)
						.map(([trigram, count]) => `${trigram}(${count})`)
						.join(", ");
					
					const punctStats = [...stats.punctuation.entries()]
						.sort((a, b) => b[1] - a[1])
						.map(([punct, count]) => `${punct}(${count})`)
						.join(", ");
					
					const funcWordsStats = [...stats.functionWords.entries()]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([word, count]) => `${word}(${count})`)
						.join(", ");

					const message = [
						`=== ${author.name} ===`,
						`Text: ${totalChars} chars, ${stats.totalWords} words, ${stats.uniqueWords} unique`,
						`Richness: ${(stats.vocabularyRichness * 100).toFixed(1)}%`,
						`Avg word: ${stats.avgWordLength.toFixed(1)} chars`,
						`Avg sentence: ${stats.avgSentenceLength.toFixed(1)} words (${totalSentences} sentences)`,
						``,
						`Top words: ${topWords}`,
						`Top bigrams: ${topBigrams}`,
						`Top trigrams: ${topTrigrams}`,
						``,
						`Function words: ${funcWordsStats}`,
						`Punctuation: ${punctStats || "none"}`
					].join("\n");

					new Notice(message, 10000);
				}
			}
		});
		this.addCommand({
			id: "analyze-current-note",
			name: "Analyze current note",

			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				
				if (!file) {
					new Notice("No active file");
					return;
				}

				const text = await this.app.vault.read(file);
				
				if (!text || text.split(/\s+/).length < 10) {
					new Notice("Not enough text (min 10 words)");
					return;
				}

				const stats = this.textAnalysisService.analyze(text);
				
				const totalChars = text.length;
				const totalSentences = text.split(/[.!?]+/).filter(Boolean).length;
				
				const topWords = [...stats.wordFrequency.entries()]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 10)
					.map(([word, count]) => `${word}(${count})`)
					.join(", ");
				
				const topBigrams = [...stats.wordBigrams.entries()]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([bigram, count]) => `${bigram}(${count})`)
					.join(", ");
				
				const topTrigrams = [...stats.charTrigrams.entries()]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([trigram, count]) => `${trigram}(${count})`)
					.join(", ");
				
				const punctStats = [...stats.punctuation.entries()]
					.sort((a, b) => b[1] - a[1])
					.map(([punct, count]) => `${punct}(${count})`)
					.join(", ");
				
				const funcWordsStats = [...stats.functionWords.entries()]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 10)
					.map(([word, count]) => `${word}(${count})`)
					.join(", ");

				const message = [
					`=== ${file.name} ===`,
					`Text: ${totalChars} chars, ${stats.totalWords} words, ${stats.uniqueWords} unique`,
					`Richness: ${(stats.vocabularyRichness * 100).toFixed(1)}%`,
					`Avg word: ${stats.avgWordLength.toFixed(1)} chars`,
					`Avg sentence: ${stats.avgSentenceLength.toFixed(1)} words (${totalSentences} sentences)`,
					``,
					`Top words: ${topWords}`,
					`Top bigrams: ${topBigrams}`,
					`Top trigrams: ${topTrigrams}`,
					``,
					`Function words: ${funcWordsStats}`,
					`Punctuation: ${punctStats || "none"}`
				].join("\n");

				new Notice(message, 10000);
			}
		});
	}

	async checkSpiritFolder() {
		const folderPath = this.settings.spiritFolder;
		
		const exists = await this.app.vault.adapter.exists(folderPath);
		
		if (!exists) {
			try {
				await this.app.vault.createFolder(folderPath);
				new Notice(`Created folder: ${folderPath}`);
			} catch (e) {
				new Notice(`Author Spirit: Failed to create folder ${folderPath}`);
				console.error(e);
			}
			return;
		}

		let folder = this.app.vault.getAbstractFileByPath(folderPath);
		
		if (!folder) {
			await new Promise(resolve => window.setTimeout(resolve, 500));
			folder = this.app.vault.getAbstractFileByPath(folderPath);
		}

		if (!folder || !(folder instanceof TFolder)) {
			new Notice(`${folderPath} exists but is not a folder!`);
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({},DEFAULT_SETTINGS,(await this.loadData()) as Partial<AISpiritPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}