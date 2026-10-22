import type { BirthDraft } from "./birth";

export const RELATIONSHIP_STATUSES = ["single", "dating", "relationship", "engaged", "private"] as const;
export const INTERESTS = ["path", "timing", "partner"] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];
export type RelationshipInterest = (typeof INTERESTS)[number];
export type RelationshipContext = { status: RelationshipStatus; interest: RelationshipInterest };

export type PreviewInsight = {
  planet: "Venus";
  sign: string;
  signId: number;
  descriptionEn: string;
  descriptionHi: string;
  source: "Prokerala planet-position";
  ayanamsa: "Lahiri";
  generatedAt: number;
};

export type JourneyDraft = BirthDraft & {
  relationship?: RelationshipContext;
  preview?: PreviewInsight;
};

export function parseContext(value: unknown): RelationshipContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.status !== "string" || typeof obj.interest !== "string") return null;
  if (!RELATIONSHIP_STATUSES.includes(obj.status as RelationshipStatus)) return null;
  if (!INTERESTS.includes(obj.interest as RelationshipInterest)) return null;
  return { status: obj.status as RelationshipStatus, interest: obj.interest as RelationshipInterest };
}
