import "server-only";
import { randomUUID } from "node:crypto";
import type { JourneyDraft } from "../context";
import { fetchPaidChartData } from "../prokerala";
import { createMarriageReport } from "./rules";
import { saveReport } from "./store";
import type { MarriageStoryReport } from "./types";

// This function must ONLY be called after a verified payment webhook,
// or from the dev-only gated testing route. It is never public checkout logic.
export async function generateAndStoreReport(draft:JourneyDraft):Promise<MarriageStoryReport>{
  if(!draft.relationship||!draft.timeKnown||!draft.birthTime)throw new Error("REPORT_REQUIRES_COMPLETE_BIRTH_DATA");
  const data=await fetchPaidChartData(draft);
  const report=createMarriageReport(draft,data,randomUUID());
  await saveReport(report);
  return report;
}
