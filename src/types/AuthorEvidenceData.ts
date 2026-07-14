import { EvidencePair, StyleFeatureSummary } from "../services/PromptBuilderService";

export interface AuthorEvidenceData {
    score: number;
    bestPairs: EvidencePair[];
    worstPairs: EvidencePair[];
    userFeatures: StyleFeatureSummary;
    authorFeatures: StyleFeatureSummary;
    stylometryDate: number | null;
    aiDate: number | null;
    aiResponse: string | null;
}