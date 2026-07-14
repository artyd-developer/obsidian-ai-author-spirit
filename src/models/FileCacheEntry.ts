import { AuthorComparisonSummary } from "./AuthorComparisonSummary";
import { TextStats } from "./TextStats";

export type FileCacheEntry = {
    mtime: number;
    userStats: TextStats | null;
    userChunks: string[];
    authors: Record<string, AuthorComparisonSummary>;
};