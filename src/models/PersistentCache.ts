import { FileCacheEntry } from "./FileCacheEntry";

export type PersistentCache = {
    version: number;
    files: Record<string, FileCacheEntry>;
};