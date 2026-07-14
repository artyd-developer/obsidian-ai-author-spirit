import { PairScore } from "./PairScore";

export type AuthorComparisonSummary = {
    authorName: string;
    
    best: PairScore[];
    worst: PairScore[];
};