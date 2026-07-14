import { Notice } from 'obsidian';
import AISpiritPlugin from "../main";
import { AuthorEvidenceData } from "../types/AuthorEvidenceData";

const CACHE_KEY = "ai-spirit-cache";

interface CacheData {
    version: number;
    files: Record<string, FileCacheData>;
}

interface FileCacheData {
    mtime: number;
    userStats: unknown;
    userChunks: string[];
    authors: Record<string, AuthorEvidenceData>;
}

export class CacheService {
    
    private cache: CacheData = {
        version: 1,
        files: {},
    };

    constructor(private plugin: AISpiritPlugin) {}

    async load(): Promise<void> {
        try {
            const raw: unknown = this.plugin.app.loadLocalStorage(CACHE_KEY);

            if (typeof raw !== "string") {
                return;
            }

            const parsed: unknown = JSON.parse(raw);

            if (this.isCacheData(parsed)) {
                this.cache = parsed;
            }
        } catch {
            this.cache = {
                version: 1,
                files: {},
            };
        }
    }

    private isCacheData(value: unknown): value is CacheData {
        if (typeof value !== "object" || value === null) {
            return false;
        }

        return (
            "version" in value &&
            "files" in value &&
            typeof value.version === "number" &&
            typeof value.files === "object" &&
            value.files !== null
        );
    }

    async save() {
        try {
            this.plugin.app.saveLocalStorage(CACHE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            console.debug('AISpirit: Failed to save cache', e);
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            new Notice('AI Autor Spirit: Failed to save analysis cache');
        }
    }

    getFile(path: string): FileCacheData | undefined {
        return this.cache.files[path];
    }

    isFileChanged(path: string, mtime: number): boolean {
        const cached = this.cache.files[path];
        if (!cached) {
            return true;
        }
        const changed = cached.mtime !== mtime;
        return changed;
    }

    setUserData(path: string, userStats: unknown, userChunks: string[], fileMtime: number) {
        if (!this.cache.files[path]) {
            this.cache.files[path] = {
                mtime: fileMtime,
                userStats: null,
                userChunks: [],
                authors: {}
            };
        }
        this.cache.files[path].userStats = userStats;
        this.cache.files[path].userChunks = userChunks;
        this.cache.files[path].mtime = fileMtime;
    }

    setAuthorEvidence(path: string, authorName: string, evidence: AuthorEvidenceData) {
        if (!this.cache.files[path]) {
            console.warn(`AISpirit: No cache entry for ${path}, creating...`);
            this.cache.files[path] = {
                mtime: Date.now(),
                userStats: null,
                userChunks: [],
                authors: {}
            };
        }
        if (!this.cache.files[path].authors) {
            this.cache.files[path].authors = {};
        }
        this.cache.files[path].authors[authorName] = evidence;
    }

    getAuthorEvidence(path: string, authorName: string): AuthorEvidenceData | undefined {
        return this.cache.files[path]?.authors?.[authorName];
    }

    clearFileCache(filePath: string) {
        delete this.cache.files[filePath];
    }
}