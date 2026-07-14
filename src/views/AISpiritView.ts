import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";

import AISpiritPlugin from "../main";
import { StatsComparisonService } from "../services/StatsComparisonService";
import { AuthorSimilarityCard } from "../components/AuthorSimilarityCard";
import { ChunkComparisonService } from "../services/ChunkComparisonService";
import { PromptBuilderService, EvidencePair, StyleFeatureSummary } from "../services/PromptBuilderService";
import { AIProviderService } from "../services/AIProviderService";
import { CacheService } from "../services/CacheService";
import { AuthorService } from "../services/AuthorService";
import { AuthorEvidenceData } from "../types/AuthorEvidenceData";

export const VIEW_TYPE = "ai-author-spirit-view";

interface TextStats {
    wordFrequency: Map<string, number>;
    wordBigrams: Map<string, number>;
    charTrigrams: Map<string, number>;
    functionWords: Map<string, number>;
    punctuation: Map<string, number>;
    burstiness: Map<string, number>;

    totalWords: number;
    uniqueWords: number;
    vocabularyRichness: number;
    avgWordLength: number;
    avgSentenceLength: number;
}

export class AISpiritView extends ItemView {
    private static readonly SIGNIFICANCE_THRESHOLD = 0.90;  // Score below this is significant style gap
    private static readonly MIN_CHUNK_SIZE = 10;
    private static readonly MAX_CHUNK_SIZE = 100;
    plugin: AISpiritPlugin;
    private statsEl: HTMLElement | null = null;
    private headerEl: HTMLElement | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: AISpiritPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    private compareService = new StatsComparisonService();
    private chunkService = new ChunkComparisonService();
    private promptBuilder!: PromptBuilderService;
    private aiProvider!: AIProviderService;
    private cacheService!: CacheService;

    getViewType() { return VIEW_TYPE; }
    // eslint-disable-next-line
    getDisplayText() { return "AI Author Spirit"; }

    async onOpen() {
        const container = this.containerEl.children[1];
        if (!container) return;
        container.empty();

        this.promptBuilder = new PromptBuilderService(this.plugin);
        this.cacheService = new CacheService(this.plugin);
        await this.cacheService.load();
        this.aiProvider = new AIProviderService(this.plugin.settings);

        this.headerEl = container.createDiv({ cls: "ai-spirit-header" });
        this.statsEl = container.createDiv();

        await this.update();
    }

    async update(forceRecalc: boolean = false) {
        if (!this.statsEl || !this.headerEl) return;

        const file = this.app.workspace.getActiveFile();
        if (!file) {
            this.headerEl.empty();
            this.statsEl.empty();
            this.statsEl.createEl("p", { text: "No active file" });
            return;
        }

        const filePath = file.path;
        const fileMtime = file.stat.mtime;

        const cached = this.cacheService.getFile(filePath);
        const needsRecalc = forceRecalc || !cached?.userStats || this.cacheService.isFileChanged(filePath, fileMtime);

        if (!needsRecalc && cached) {
            this.renderHeader(cached.authors);
            this.statsEl.empty();

            const sorted = Object.entries(cached.authors)
                .sort(
                    (a, b) =>
                        b[1].score - a[1].score
                );

            for (const [authorName, evidence] of sorted) {
                this.renderAuthorCard(authorName, evidence, filePath);
            }
            return;
        }

        this.renderHeader(null);

        const userText = await this.app.vault.read(file);
        const authors = this.plugin.authorService.getAuthorFolders();
        if (authors.length === 0) {
            this.statsEl.empty();
            this.statsEl.createEl("p", { text: "No authors found" });
            return;
        }

        const statsService = this.plugin.textAnalysisService;
        const userStats = statsService.analyze(userText);
        const userChunks = this.chunkService.splitIntoChunks(userText, Math.min(Math.max(AISpiritView.MIN_CHUNK_SIZE, userStats.totalWords), AISpiritView.MAX_CHUNK_SIZE));


        this.cacheService.clearFileCache(filePath);

        this.cacheService.setUserData(filePath, userStats, userChunks, fileMtime);

        const results: Record<string, AuthorEvidenceData> = {};
        const now = Date.now();

        for (const author of authors) {
            const authorText = await this.plugin.authorService.buildAuthorCorpus(author);
            if (!authorText || authorText.split(/\s+/).length < AuthorService.MIN_WORDS_FOR_ANALYSIS) continue;

            const chunkSize = Math.min(Math.max(AISpiritView.MIN_CHUNK_SIZE, userStats.totalWords), AISpiritView.MAX_CHUNK_SIZE);
            const authorChunks = this.chunkService.splitIntoChunks(authorText, chunkSize);
            const allPairs: EvidencePair[] = [];

            for (const userChunk of userChunks) {
                let bestScore = 0;
                let bestAuthorChunk = "";
                for (const authorChunk of authorChunks) {
                    const score = this.compareService.compare(
                        statsService.analyze(userChunk),
                        statsService.analyze(authorChunk),
                        this.plugin.settings
                    ).score;
                    if (score > bestScore) {
                        bestScore = score;
                        bestAuthorChunk = authorChunk;
                    }
                }
                allPairs.push({ score: bestScore, userChunk, authorChunk: bestAuthorChunk });
            }

            allPairs.sort((a, b) => b.score - a.score);
            const finalScore = this.chunkService.weightedAverage(allPairs.map(p => p.score));

            const significantDifferences = allPairs
                .filter(p => p.score < AISpiritView.SIGNIFICANCE_THRESHOLD)
                .slice(0, 5);

            const evidenceData = {
                score: finalScore,
                bestPairs: allPairs.slice(0, 5),
                worstPairs: significantDifferences,
                userFeatures: this.buildFeatureSummary(userStats),
                authorFeatures: this.buildFeatureSummary(statsService.analyze(authorText)),
                stylometryDate: now,
                aiDate: null,
                aiResponse: null
            };

            this.cacheService.setAuthorEvidence(filePath, author.name, evidenceData);
            results[author.name] = evidenceData;
        }

        await this.cacheService.save();

        this.renderHeader(results);
        this.statsEl.empty();
        
        const sortedResults = Object.entries(results).sort((a, b) => b[1].score - a[1].score);
        for (const [authorName, evidence] of sortedResults) {
            this.renderAuthorCard(authorName, evidence, filePath);
        }
    }

    private renderHeader(authors: Record<string, AuthorEvidenceData> | null) {
        if (!this.headerEl) return;
        this.headerEl.empty();

        const infoEl = this.headerEl.createDiv({ cls: "ai-spirit-header-info" });

        if (authors && Object.keys(authors).length > 0) {
            const stylDates = Object.values(authors)
                .map((e: AuthorEvidenceData) => e.stylometryDate)
                .filter((date): date is number => typeof date === "number");
            
            if (stylDates.length > 0) {
                const stylSpan = infoEl.createSpan();
                const stylIcon = stylSpan.createSpan();
                setIcon(stylIcon, "bar-chart-2");
                stylSpan.appendText(` Stylometry: ${new Date(Math.max(...stylDates)).toLocaleString()}`);
            }
        } else {
            infoEl.createSpan({ text: "Calculating..." });
        }

        const btnEl = this.headerEl.createDiv({ cls: "ai-spirit-header-actions" });
        const recalcBtn = btnEl.createEl("button", { 
            cls: "ai-spirit-recalc-button" 
        });
        const recalcIcon = recalcBtn.createSpan();
        setIcon(recalcIcon, "refresh-cw");
        recalcBtn.appendText(" Recalculate");
        recalcBtn.addEventListener("click", () => {
            void (async () => {
                const file = this.app.workspace.getActiveFile();

                if (file) {
                    this.cacheService.clearFileCache(file.path);
                    await this.cacheService.save();
                }

                await this.update(true);
            })();
        });
    }

    private renderAuthorCard(authorName: string, evidence: AuthorEvidenceData, filePath: string) {
        if (!this.statsEl) return;

        const card = new AuthorSimilarityCard(this.statsEl, authorName, evidence.score * 100);

        card.setAIDate(evidence.aiDate || null);

        if (evidence.aiResponse) {
            card.showAIResult(evidence.aiResponse);
        }

        card.addAIButton(async () => {
            const prompt = this.promptBuilder.buildPrompt({
                userFeatures: evidence.userFeatures,
                authorFeatures: evidence.authorFeatures,
                topMatches: evidence.bestPairs,
                topDifferences: evidence.worstPairs
            });

            card.showAILoading();
            try {
                const aiResponse = await this.aiProvider.analyze(prompt);
                card.showAIResult(aiResponse);

                const cached = this.cacheService.getFile(filePath);
                if (cached?.authors?.[authorName]) {
                    cached.authors[authorName].aiDate = Date.now();
                    cached.authors[authorName].aiResponse = aiResponse;
                    await this.cacheService.save();
                }

                card.setAIDate(Date.now());
            } catch (e: unknown) {
                let errorMessage = "Failed to connect to AI service";

                if (e instanceof TypeError && e.message === "Failed to fetch") {
                    errorMessage = "Unable to connect. Check your internet connection and API endpoint.";
                } else if (e instanceof Error) {
                    if (e.message.includes("401")) {
                        errorMessage = "Authentication failed. Check your API key.";
                    } else if (e.message.includes("404")) {
                        errorMessage = "Endpoint not found. Check the API URL.";
                    } else if (e.message.includes("429")) {
                        errorMessage = "Too many requests. Please wait and try again.";
                    } else if (e.message.includes("500")) {
                        errorMessage = "Server error. The AI service may be temporarily unavailable.";
                    } else {
                        errorMessage = `AI error: ${e.message}`;
                    }
                }

                card.showAIError(errorMessage);
            }
        });
    }

    private buildFeatureSummary(stats: TextStats): StyleFeatureSummary {
        const topWords = [...stats.wordFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, c]) => `${w}(${c})`).join(", ");
        const topBigrams = [...stats.wordBigrams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w, c]) => `${w}(${c})`).join(", ");
        const topTrigrams = [...stats.charTrigrams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w, c]) => `${w}(${c})`).join(", ");

        return {
            vocabulary: `${stats.totalWords} words,` + 
            ` ${stats.uniqueWords} unique (richness: ${(stats.vocabularyRichness * 100).toFixed(1)}%),` +
            ` avg word length: ${stats.avgWordLength.toFixed(1)}, top: ${topWords}`,
            syntax: `Avg sentence length: ${stats.avgSentenceLength.toFixed(1)} words`,
            functionWords: [...stats.functionWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, c]) => `${w}(${c})`).join(", "),
            punctuation: [...stats.punctuation.entries()].sort((a, b) => b[1] - a[1]).map(([w, c]) => `${w}(${c})`).join(", "),
            rhythm: `Burstiness variance avg: ${[...stats.burstiness.values()].reduce((s, v) => s + v, 0) / Math.max(1, stats.burstiness.size)}`,
            ngrams: `Word bigrams: ${topBigrams} | Char trigrams: ${topTrigrams}`
        };
    }

    async onClose() {
        this.statsEl = null;
        this.headerEl = null;
    }
}