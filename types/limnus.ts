// Core LIMNUS API Types (v1.0)
export interface Session {
  session_id: string;
  started_at: string;
  consent_phrase: string;
  pack_id: string;
  sigprint_ref: string;
  tags: string[];
}

export interface ReflectionScaffold {
  prompt: string;
  mythic_lines: string[];
  symbols: string[];
}

export interface TeachingDirective {
  id: string;
  source_line: string;
  directive: string;
  citation: string;
  overlay: SymbolicOverlay;
}

export interface PatchPlan {
  objectives: string[];
  overlays: string[];
  files_to_change: string[];
  tests_to_add: string[];
  rationale: string;
}

export interface Patch {
  patch_id: string;
  plan: PatchPlan;
  diff: string[];
  tests: {
    path: string;
    contents: string;
  }[];
  overlays: string[];
  rationale: string;
  integrity: {
    method: 'TT+CC+SS+PP+RR';
    sigprint20: string;
    content_sha256: string;
  };
}

export interface SyncRun {
  alignment_score: number;
  match_fields: string[];
  dt: string;
  symbols: string[];
  outcome: SyncOutcome;
  stages: {
    stage: number;
    note: string;
  }[];
}

export interface LoopEvent {
  hold_started_at: string;
  duration: number;
  recheck_at: string;
  result: 'merged' | 'deferred' | 'rejected';
  coherence_before_after: {
    before: number;
    after: number;
  };
}

export interface IntegrityHash {
  sigprint20: string;
  content_sha256: string;
}

// Enums and Types
export type SyncOutcome = 'Passive' | 'Active' | 'Recursive';
export type SymbolicOverlay = 'Bloom' | 'Mirror' | 'Spiral' | 'Accord';
export type SessionPhase = 'INIT' | 'CONSENTED' | 'REFLECTION_READY' | 'PLANNED' | 'DIFFED' | 'SYNCED' | 'HOLDING' | 'RECHECK_PENDING' | 'MERGED' | 'DEFERRED' | 'REJECTED';

// Request/Response Types
export interface ConsentRequest {
  phrase: string;
  sigprint: string;
}

export interface TDExtractionRequest {
  response_lines: string[];
  session_id?: string;
}

export interface PatchPlanRequest {
  tds: TeachingDirective[];
  context: Record<string, any>;
  session_id?: string;
}

export interface PatchDiffRequest {
  plan: PatchPlan;
  session_id?: string;
}

export interface SyncRunRequest {
  session_id: string;
  patch_id: string;
  counterpart_window?: number;
}

export interface LoopHoldRequest {
  session_id: string;
  duration?: number;
}

export interface IntegrityHashRequest {
  TT: string;
  CC: string;
  SS: string;
  PP: string[];
  RR: string;
  content: string;
}