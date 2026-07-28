import type { DataFile, Exhibit, Stage, StageNote } from "../lib/types.ts";
import type { Dashboard } from "../lib/urlState.ts";

// One shared bundle every dashboard reads from — computed once in App.tsx,
// the 6 Track components plus Overview are pure render.
export interface DashboardContext {
  data: DataFile | null;
  exhibits: Exhibit[]; // the full real corpus, unfiltered
  exhibitsByStage: Record<Stage, Exhibit[]>;
  latestNote: Partial<Record<Stage, StageNote>>;
  dark: boolean;
  generated: string;
  dashboard: Dashboard;
  navigate: (dashboard: Dashboard) => void;
}
