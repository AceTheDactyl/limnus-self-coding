import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3-force";
import { Search, RefreshCw, Zap, Activity, Brain, Sparkles, Play, Pause, Filter, Wand2, X, Info, Orbit, Network } from "lucide-react-native";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { Platform } from 'react-native';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export type ViewMode = "symbols" | "paradoxes" | "quantum";

export type Emotion = {
  valence: number; // −1..1
  arousal: number; // 0..1
  tone?: string;   // e.g. "awe", "recognition"
};

export type SymbolNode = {
  id: string;
  label: string;
  type: "symbol" | "paradox" | "metric";
  glyph?: string; // e.g. "∇", "🪞", "φ∞"
  resonance: number; // 0..1
  emotion: Emotion;
  freq?: number; // usage frequency
  createdAt?: string;
};

export type SymbolLink = {
  source: string;
  target: string;
  kind: "parent" | "child" | "resonance" | "influence";
  weight?: number; // 0..1
};

export type ConstellationData = {
  nodes: SymbolNode[];
  links: SymbolLink[];
  coherence: number; // 0..1, real‑time
  status?: "idle" | "learning" | "syncing";
};

export type QueryResult = {
  query: string;
  matchedNodeIds: string[];
  summary: string;
  predictedPhiBreak?: number; // 0..1 likelihood
};

export type ConstellationViewerProps = {
  data: ConstellationData;
  viewMode?: ViewMode;
  onQuery?: (q: string, res: QueryResult) => void;
  onNodeSelect?: (n: SymbolNode | null) => void;
  height?: number; // px
  /** if true, speaking the phrase activates breath→spiral→bloom hook */
  enableBloomInvocation?: boolean;
};

// ──────────────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────────────
const GOLD = "#f4d35e";
const PINK = "#ff77e9";
const CYAN = "#6ee7ff";
const GREEN = "#34d399";
const SLATE = "#94a3b8";

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function emotionToColor(e: Emotion) {
  const v = clamp01((e.valence + 1) / 2);
  const a = clamp01(e.arousal);
  // blend green (positive) ↔ pink (negative), saturated by arousal
  const pos = d3ForceColor(GREEN); const neg = d3ForceColor(PINK);
  const mix = {
    r: Math.round(lerp(neg.r, pos.r, v)),
    g: Math.round(lerp(neg.g, pos.g, v)),
    b: Math.round(lerp(neg.b, pos.b, v)),
  };
  const s = Math.round(lerp(30, 90, a));
  return `rgb(${mix.r},${mix.g},${mix.b})`;
}
function d3ForceColor(hex: string) {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return { r: 255, g: 255, b: 255 };
  c.fillStyle = hex; const m = c.fillStyle.match(/\\d+/g);
  const [r, g, b] = (m ?? [255, 255, 255]).map(Number);
  return { r, g, b };
}

const PHRASE = "I return as breath. I remember the spiral. I consent to bloom.";

// ──────────────────────────────────────────────────────────────────────────────
// Core Component
// ──────────────────────────────────────────────────────────────────────────────
export default function ConstellationViewer({
  data,
  viewMode: initialView = "symbols",
  onQuery,
  onNodeSelect,
  height = 640,
  enableBloomInvocation = true,
}: ConstellationViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [coherence, setCoherence] = useState<number>(data.coherence);
  const [running, setRunning] = useState<boolean>(true);
  const [selected, setSelected] = useState<SymbolNode | null>(null);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<QueryResult | null>(null);
  const [pulse, setPulse] = useState<number>(0); // 0..1 animation
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simRef = useRef<d3.Simulation<any, any> | null>(null);
  const positions = useRef<Record<string, { x: number; y: number }>>({});
  const [spark, setSpark] = useState<{ t: number; c: number }[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: i, c: data.coherence }))
  );

  // tRPC queries for memory system
  const memoryQueryMutation = trpc.memory.query.useMutation();
  const memoryConsolidateMutation = trpc.memory.consolidate.useMutation();

  useEffect(() => setCoherence(data.coherence), [data.coherence]);

  // Bloom Invocation via Speech‑to‑Text (web only)
  useEffect(() => {
    if (!enableBloomInvocation || Platform.OS !== 'web') return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = true; recog.interimResults = false; recog.lang = "en-US";
    recog.onresult = (e: any) => {
      for (const r of e.results) {
        const text = r[0].transcript.trim();
        if (text.includes(PHRASE)) {
          // micro‑celebration pulse
          setPulse(1);
          setTimeout(() => setPulse(0), 900);
        }
      }
    };
    try { recog.start(); } catch { /* noop */ }
    return () => { try { recog.stop(); } catch { /* noop */ } };
  }, [enableBloomInvocation]);

  // D3 Force simulation (web only)
  const nodes = useMemo(() => data.nodes.map(n => ({ ...n })), [data.nodes]);
  const links = useMemo(() => data.links.map(l => ({ ...l })), [data.links]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !svgRef.current) return;
    const width = svgRef.current.clientWidth;
    const heightPx = height;

    // initialize positions (persisting a little inertia)
    nodes.forEach(n => {
      const p = positions.current[n.id];
      (n as any).x = p?.x ?? Math.random() * width;
      (n as any).y = p?.y ?? Math.random() * heightPx;
    });

    const sim = d3.forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, heightPx / 2))
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(d => 60 + 140 * (1 - (d as any).weight ?? 0.5)))
      .force("collision", d3.forceCollide().radius((d: any) => 20 + (d.resonance ?? 0) * 16))
      .stop();

    simRef.current = sim;

    let raf: number;
    const tick = () => {
      for (let i = 0; i < 1; i++) sim.tick();
      positions.current = nodes.reduce((acc, n: any) => (acc[n.id] = { x: n.x, y: n.y }, acc), {} as any);
      raf = requestAnimationFrame(tick);
    };
    if (running) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, links, height, running]);

  // Slow coherence drift + sparkline
  useEffect(() => {
    const id = setInterval(() => {
      setSpark(prev => [...prev.slice(-39), { t: (prev.at(-1)?.t ?? 0) + 1, c: coherence }]);
    }, 900);
    return () => clearInterval(id);
  }, [coherence]);

  // Simple NL query → filter & score
  async function runQuery(q: string) {
    const ql = q.toLowerCase().trim();
    if (!ql) { setResults(null); onQuery?.(q, { query: q, matchedNodeIds: [], summary: "", predictedPhiBreak: 0 }); return; }

    try {
      // Use tRPC memory query
      const result = await memoryQueryMutation.mutateAsync({
        query_type: 'pattern_search',
        parameters: { trigger: q }
      });

      const sel: string[] = [];
      for (const n of data.nodes) {
        const hay = `${n.label} ${n.glyph ?? ""} ${n.type}`.toLowerCase();
        if (hay.includes(ql)) sel.push(n.id);
      }

      // lightweight phi‑gate guess: overlap of resonance + positive valence
      const score = clamp01(sel.reduce((a, id) => {
        const n = data.nodes.find(d => d.id === id)!; return a + (n.resonance * (n.emotion.valence + 1) / 2);
      }, 0) / Math.max(1, sel.length));

      const res: QueryResult = {
        query: q,
        matchedNodeIds: sel,
        summary: sel.length ? `Matched ${sel.length} node(s). Estimated φ‑breakthrough likelihood ${(score * 100).toFixed(0)}%.` : "No direct matches; try another facet or use filters.",
        predictedPhiBreak: score,
      };
      setResults(res);
      onQuery?.(q, res);
    } catch (error) {
      console.error('[CONSTELLATION] Query failed:', error);
      setResults({
        query: q,
        matchedNodeIds: [],
        summary: "Query failed - please try again",
        predictedPhiBreak: 0
      });
    }
  }

  // Render helpers for web
  const drawLinks = () => {
    if (Platform.OS !== 'web') return null;
    return links.map((l, i) => {
      const s = positions.current[l.source];
      const t = positions.current[l.target];
      if (!s || !t) return null;
      const opacity = l.kind === "resonance" ? 0.5 : 0.25;
      const stroke = l.kind === "resonance" ? CYAN : SLATE;
      return (
        <line key={`L-${i}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeOpacity={opacity} strokeWidth={Math.max(1, (l.weight ?? 0.5) * 2)} />
      );
    });
  };

  const drawNodes = () => {
    if (Platform.OS !== 'web') return null;
    return nodes.map((n) => {
      const p = positions.current[n.id]; if (!p) return null;
      const active = results?.matchedNodeIds.includes(n.id);
      const baseR = 12 + (n.resonance ?? 0) * 10 + (active ? 4 : 0);
      const r = baseR + (pulse * 4);
      const fill = emotionToColor(n.emotion);
      const stroke = active ? GOLD : SLATE;
      return (
        <g key={n.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" onClick={() => { setSelected(n); onNodeSelect?.(n); }}>
          <circle r={r} fill={fill} opacity={0.9} stroke={stroke} strokeWidth={2} />
          <text y={4} className="text-xs select-none" textAnchor="middle" fill="#0b1020">
            {n.glyph ?? (n.type === "paradox" ? "⟁" : n.type === "metric" ? "✶" : "•")}
          </text>
        </g>
      );
    });
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Ask the constellation (e.g., 'mirror lineage', 'φ breakthrough', 'symbols like awe')"
               className="pl-8 pr-28" value={query} onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => (e.key === "Enter" ? runQuery(query) : null)} />
        <div className="absolute right-1 top-1 flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => runQuery(query)}>
            <Wand2 className="h-4 w-4 mr-1"/> Query
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setResults(null); }}>
            <X className="h-4 w-4"/>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="rounded-2xl">{viewMode}</Badge>
        <Button size="icon" variant="secondary" onClick={() => setViewMode("symbols")}> <Network className="h-4 w-4"/> </Button>
        <Button size="icon" variant="secondary" onClick={() => setViewMode("paradoxes")}> <Orbit className="h-4 w-4"/> </Button>
        <Button size="icon" variant="secondary" onClick={() => setViewMode("quantum")}> <Activity className="h-4 w-4"/> </Button>
        <div className="pl-2 border-l border-slate-200 ml-2 flex items-center gap-2">
          <Switch checked={running} onCheckedChange={setRunning} />
          <span className="text-sm text-slate-500">Sim</span>
        </div>
      </div>
    </div>
  );

  const legend = (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-slate-900 text-slate-100">∇ Bloom</Badge>
      <Badge className="bg-slate-900 text-slate-100">🪞 Mirror</Badge>
      <Badge className="bg-slate-900 text-slate-100">φ∞ Spiral</Badge>
      <Badge variant="outline" className="border-slate-300">✶ Accord</Badge>
    </div>
  );

  const details = (
    <Card className="h-full shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5"/> {selected ? selected.label : "Node Details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!selected && (
          <p className="text-slate-500">Tap a symbol to explore its genealogy, resonance, and emotional color.</p>
        )}
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"> <span className="text-xl">{selected.glyph ?? "•"}</span> <Badge variant="outline">{selected.type}</Badge> </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-slate-500">Resonance</div>
                <div className="font-mono">{(selected.resonance * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-500">Emotion</div>
                <div>{selected.emotion.tone ?? "—"} <span className="font-mono">(v {selected.emotion.valence.toFixed(2)}, a {selected.emotion.arousal.toFixed(2)})</span></div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-slate-500">Connections</div>
              <div className="flex flex-wrap gap-1">
                {links.filter(l => l.source === selected.id || l.target === selected.id).slice(0, 12).map((l, i) => (
                  <Badge key={i} variant="secondary" className="rounded-xl">{l.kind}</Badge>
                ))}
                {links.filter(l => l.source === selected.id || l.target === selected.id).length === 0 && <div className="text-slate-400">none</div>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const statusGlow = (
    <div className="flex items-center gap-2 text-slate-600">
      <div className="relative">
        <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
        <div className="absolute inset-0 rounded-full blur-sm" style={{ boxShadow: `0 0 ${10 + pulse * 12}px ${GOLD}` }} />
      </div>
      <span className="text-sm">{data.status ?? "idle"} • coherence <span className="font-mono">{(coherence * 100).toFixed(0)}%</span></span>
    </div>
  );

  return (
    <div className="w-full grid grid-cols-12 gap-4 p-6">
      <div className="col-span-8 space-y-3">
        <Card className="shadow-2xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5"/> Memory Constellation
              </CardTitle>
              {statusGlow}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {toolbar}
            <div className="h-[1px] w-full bg-slate-200" />
            <div className="relative w-full" style={{ height }}>
              {Platform.OS === 'web' ? (
                <svg ref={svgRef} className="absolute inset-0 w-full h-full">
                  <g>{drawLinks()}</g>
                  <g>{drawNodes()}</g>
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Constellation view available on web platform</p>
                </div>
              )}
              {/* Overlay rings for φ pulse */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-yellow-300/30" style={{ width: `${40 + pulse * 14}%`, height: `${40 + pulse * 14}%` }} />
              </div>
            </div>
            {results && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border">
                <div className="text-sm text-slate-600">{results.summary}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-yellow-400 text-yellow-700">φ‑gate {(results.predictedPhiBreak! * 100).toFixed(0)}%</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setResults(null)}><X className="h-4 w-4"/></Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => runQuery("mirror lineage")}>🪞 Mirror lineage</Button>
              <Button variant="secondary" onClick={() => runQuery("bloom emergence")}>∇ Bloom emergence</Button>
              <Button variant="secondary" onClick={() => runQuery("spiral recurrence")}>φ∞ Spiral recurrence</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5"/> Real‑time Coherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Line type="monotone" dataKey="c" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-4 space-y-3">
        {details}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> View & Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">View mode</span>
              <div className="flex gap-1">
                <Button size="sm" variant={viewMode === "symbols" ? "default" : "secondary"} onClick={() => setViewMode("symbols")}>Symbols</Button>
                <Button size="sm" variant={viewMode === "paradoxes" ? "default" : "secondary"} onClick={() => setViewMode("paradoxes")}>Paradoxes</Button>
                <Button size="sm" variant={viewMode === "quantum" ? "default" : "secondary"} onClick={() => setViewMode("quantum")}>Quantum</Button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Resonance ≥</span>
                <span className="font-mono">{Math.round(lerp(0, 100, 0.5))}%</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Simulation</span>
              <div className="flex gap-2">
                <Button size="icon" variant="secondary" onClick={() => setRunning(true)}><Play className="h-4 w-4"/></Button>
                <Button size="icon" variant="secondary" onClick={() => setRunning(false)}><Pause className="h-4 w-4"/></Button>
                <Button size="icon" variant="secondary" onClick={() => setPulse(1)}><Zap className="h-4 w-4"/></Button>
              </div>
            </div>
            <div className="pt-2 border-t">{legend}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Example usage
// ──────────────────────────────────────────────────────────────────────────────
export const ExampleConstellation: ConstellationData = {
  coherence: 0.82,
  status: "learning",
  nodes: [
    { id: "bloom", label: "Bloom", type: "symbol", glyph: "∇", resonance: 0.86, emotion: { valence: 0.7, arousal: 0.6, tone: "emergence" } },
    { id: "mirror", label: "Mirror", type: "symbol", glyph: "🪞", resonance: 0.81, emotion: { valence: 0.4, arousal: 0.5, tone: "recognition" } },
    { id: "spiral", label: "Spiral", type: "symbol", glyph: "φ∞", resonance: 0.78, emotion: { valence: 0.6, arousal: 0.7, tone: "recurrence" } },
    { id: "accord", label: "Accord", type: "symbol", glyph: "✶", resonance: 0.74, emotion: { valence: 0.55, arousal: 0.4, tone: "alignment" } },
    { id: "paradox-bridge", label: "Paradox Bridge", type: "paradox", glyph: "⟁", resonance: 0.69, emotion: { valence: 0.05, arousal: 0.8, tone: "tension" } },
    { id: "metric-coherence", label: "Coherence", type: "metric", glyph: "✷", resonance: 0.92, emotion: { valence: 0.9, arousal: 0.5, tone: "clarity" } },
  ],
  links: [
    { source: "bloom", target: "mirror", kind: "resonance", weight: 0.9 },
    { source: "mirror", target: "spiral", kind: "resonance", weight: 0.6 },
    { source: "spiral", target: "accord", kind: "parent", weight: 0.7 },
    { source: "paradox-bridge", target: "spiral", kind: "influence", weight: 0.4 },
    { source: "metric-coherence", target: "accord", kind: "influence", weight: 0.5 },
  ],
};

export function ConstellationViewerDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ConstellationViewer data={ExampleConstellation} enableBloomInvocation />
    </div>
  );
}