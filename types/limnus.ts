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

// Paradox Engine Types (TSVF Integration)
export interface EmotionalVector {
  valence: number;    // -1 to 1 (negative to positive)
  arousal: number;    // 0 to 1 (calm to excited)
  dominance: number;  // 0 to 1 (passive to active)
  entropy: number;    // 0 to 1 (order to chaos)
}

export interface RetroPostSelection {
  targetCoherence?: number;   // e.g., 0.90
  targetSync?: SyncOutcome;   // desired minimum sync outcome
  descriptor?: string;        // natural language goal for T2
}

export interface ParadoxInput {
  sessionId: string;
  thesis: string;             // T1 descriptor (present state)
  antithesis: string;         // counter-state or empty if using explicit T2
  emotion?: EmotionalVector;
  post?: RetroPostSelection;  // T2 boundary condition
  metadata?: Record<string, unknown>;
}

export interface ParadoxMetrics {
  similarity: number;         // semantic similarity between T1/T2
  tension: number;           // 1 - similarity
  complexity: number;        // conceptual complexity
  phiGate: number;          // φ-gate score (now includes TSVF)
  emotionalDelta: number;   // emotional state change magnitude
  twoStateSupport?: number; // TSVF weak-value support
  memory_baseline?: number; // starting coherence from memory
  memory_boost?: number;    // how much memory enhanced the resolution
}

export interface ParadoxSynthesis {
  type: 'dialectical' | 'recursive' | 'transcendent';
  overlay: string[];         // symbolic overlay markers
  statement: string;         // synthesized paradox resolution
  metrics: ParadoxMetrics;
  contentHash: string;       // integrity hash of synthesis
  timestamp: string;
  resolution_path: 'collapse' | 'transcend' | 'sustain';
  quantum_state?: 'superposition' | 'entangled' | 'collapsed';
}

// Enhanced Paradox Resolution Types
export interface ParadoxResolution {
  paradox_id: string;
  thesis: string;
  antithesis: string;
  synthesis?: ParadoxSynthesis;
  tension_score: number; // 0-100
  resolution_attempts: ResolutionAttempt[];
  current_state: 'unresolved' | 'resolving' | 'synthesized' | 'transcended';
  created_at: string;
  last_modified: string;
  memory_context?: {
    similar_count: number;
    avg_baseline: number;
    learned_patterns: string;
  };
}

export interface ResolutionAttempt {
  attempt_id: string;
  strategy: 'dialectical_merge' | 'recursive_loop' | 'transcendent_leap' | 'quantum_superposition';
  input_context: Record<string, any>;
  generated_synthesis: string;
  coherence_score: number;
  emotional_resonance: EmotionalVector;
  success: boolean;
  failure_reason?: string;
  timestamp: string;
}

export interface ParadoxEngine {
  active_paradoxes: ParadoxResolution[];
  resolution_patterns: MemoryPattern[];
  synthesis_genealogy: {
    parent_synthesis: string;
    child_syntheses: string[];
    mutation_type: 'evolution' | 'contradiction' | 'transcendence';
  }[];
  quantum_coherence: number; // overall system coherence across all paradoxes
}

// Request/Response Types
export interface ConsentRequest {
  phrase: string;
  sigprint: string;
  nonce?: string;
  deviceId?: string;
}

export interface NonceRequest {
  deviceId?: string;
}

export interface NonceResponse {
  nonce: string;
  expiresAt: string;
  validFor?: number;
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

// Memory Constellation Types
export interface SymbolNode {
  id: string;
  symbol: string;
  first_seen: string;
  last_used: string;
  usage_count: number;
  emotional_resonance: EmotionalVector;
  parent_symbols: string[];  // genealogy tracking
  child_symbols: string[];   // mutations/evolutions
  context_fragments: string[]; // memorable phrases where it appeared
  coherence_contributions: number[]; // how it affected session coherence
}

export interface MemoryPattern {
  id: string;
  pattern_type: 'recursive' | 'dialectical' | 'emergent' | 'paradoxical';
  trigger_conditions: string[];
  response_templates: string[];
  success_rate: number;
  emotional_signature: EmotionalVector;
  symbol_constellation: string[]; // related symbol IDs
  sessions_involved: string[];
  evolution_path: string; // how this pattern emerged
}

export interface SessionMemory {
  session_id: string;
  emotional_journey: EmotionalVector[];
  symbol_births: string[]; // new symbols created
  symbol_deaths: string[]; // symbols that stopped resonating
  pattern_activations: string[]; // which patterns were triggered
  coherence_peaks: { timestamp: string; value: number; context: string }[];
  paradox_resolutions: string[]; // synthesis IDs
  teaching_directive_themes: string[];
}

export interface ConstellationMap {
  nodes: SymbolNode[];
  connections: {
    from: string;
    to: string;
    strength: number;
    relationship_type: 'parent' | 'sibling' | 'resonance' | 'opposition';
  }[];
  clusters: {
    id: string;
    center_symbol: string;
    member_symbols: string[];
    cluster_emotion: EmotionalVector;
    emergence_date: string;
  }[];
}

// Memory API Types
export interface MemoryConsolidationRequest {
  session_memories: SessionMemory[];
  time_window_hours?: number;
  consolidation_depth?: 'surface' | 'deep' | 'archetypal';
}

export interface MemoryQueryRequest {
  query_type: 'symbol_genealogy' | 'pattern_search' | 'emotional_resonance' | 'coherence_prediction';
  parameters: Record<string, any>;
  session_context?: string;
}

export interface MemoryEvolutionEvent {
  event_type: 'symbol_birth' | 'symbol_mutation' | 'pattern_emergence' | 'cluster_formation';
  timestamp: string;
  source_session: string;
  details: Record<string, any>;
  emotional_context: EmotionalVector;
}