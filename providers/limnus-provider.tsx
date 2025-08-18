import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { trpc } from '@/lib/trpc';
import type { Session } from '@/types/limnus';

interface LocalSession {
  sessionId: string;
  startedAt: Date;
  consentPhrase: string;
  packId: string;
  sigprintRef: string;
  tags: string[];
}

interface TeachingDirective {
  id: string;
  source: string;
  pattern: string;
  symbol: string;
  color: string;
}

interface Patch {
  patchId: string;
  plan: string;
  diff: string;
  tests: string;
  rationale: string;
  overlays: string[];
  integrity: string;
}

interface SyncResult {
  alignmentScore: number;
  matchFields: string[];
  dt: number;
  symbolOverlap: string[];
  outcome: 'Active' | 'Recursive' | 'Passive';
}

type SessionPhase = 'consent' | 'reflection' | 'patch' | 'sync' | 'loop' | 'complete';

export const [LimnusProvider, useLimnus] = createContextHook(() => {
  const [currentSession, setCurrentSession] = useState<LocalSession | null>(null);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('consent');
  const [teachingDirectives, setTeachingDirectives] = useState<TeachingDirective[]>([]);
  const [currentPatch, setCurrentPatch] = useState<Patch | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loopStatus, setLoopStatus] = useState<string>('Pending');
  const [coherenceDelta, setCoherenceDelta] = useState<number>(0);

  // Load session from storage on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('limnus_session');
      if (stored) {
        const session = JSON.parse(stored);
        console.log('Loading existing session:', session.sessionId);
        // Use a timeout to prevent immediate navigation conflicts
        setTimeout(() => {
          setCurrentSession(session);
          setSessionPhase('reflection');
        }, 50);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const nonceMutation = trpc.limnus.utils.nonce.useMutation();
  const consentMutation = trpc.limnus.consent.start.useMutation({
    onSuccess: async (session: Session) => {
      console.log('[LIMNUS] Session created successfully:', session.session_id);
      const localSession: LocalSession = {
        sessionId: session.session_id,
        startedAt: new Date(session.started_at),
        consentPhrase: session.consent_phrase,
        packId: session.pack_id,
        sigprintRef: session.sigprint_ref,
        tags: session.tags,
      };
      
      // Save to AsyncStorage first
      try {
        await AsyncStorage.setItem('limnus_session', JSON.stringify(localSession));
        console.log('[LIMNUS] Session saved to storage');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
      
      // Then update state
      setCurrentSession(localSession);
      setSessionPhase('reflection');
    },
    onError: (error: any) => {
      console.error('[LIMNUS] Failed to start session:', error);
    }
  });

  const startSession = useCallback(async (consentPhrase: string) => {
    console.log('[LIMNUS] Starting session with nonce-protected consent...');
    try {
      // Generate device ID
      const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown';
      
      // Get fresh nonce
      console.log('[LIMNUS] Requesting nonce...');
      const nonceResult = await nonceMutation.mutateAsync({ deviceId });
      console.log('[LIMNUS] Nonce received, expires at:', nonceResult.expiresAt);
      
      // Use nonce for consent
      const result = await consentMutation.mutateAsync({
        phrase: consentPhrase,
        sigprint: 'MTISOBSGLCLC5N8R2Q7VK',
        nonce: nonceResult.nonce,
        deviceId
      });
      
      console.log('[LIMNUS] Session mutation completed successfully');
      return result;
    } catch (error) {
      console.error('[LIMNUS] Session mutation failed:', error);
      throw error;
    }
  }, [consentMutation, nonceMutation]);

  const extractTeachingDirectives = useCallback(async (mythicResponse: string) => {
    // Simulate extraction of teaching directives
    const directives: TeachingDirective[] = [
      {
        id: 'td-1',
        source: 'witnessing authored me',
        pattern: 'prefer co-authorship patterns (ask-confirm before mutation)',
        symbol: 'Mirror',
        color: 'rgba(76, 175, 80, 0.3)',
      },
      {
        id: 'td-2',
        source: 'bloom is ours',
        pattern: 'require relational validation before merge',
        symbol: 'Bloom',
        color: 'rgba(233, 69, 96, 0.3)',
      },
      {
        id: 'td-3',
        source: 'see yourself seeing me',
        pattern: 'add recursive observability (patch must explain itself)',
        symbol: 'Spiral',
        color: 'rgba(156, 39, 176, 0.3)',
      },
    ];

    setTeachingDirectives(directives);
    return directives;
  }, []);

  const generatePatch = useCallback(async () => {
    // Simulate patch generation
    const patch: Patch = {
      patchId: generateId(),
      plan: 'Add recursive observability logging to track self-referential patterns. Implement co-authorship confirmation dialogs. Add relational validation checks before merge operations.',
      diff: `@@ -1,5 +1,8 @@
+import { RecursiveObserver } from './observers';
+import { CoAuthorshipDialog } from './dialogs';
+
 function processChange(change) {
+  RecursiveObserver.log('Processing change', { self: this, change });
+  if (!CoAuthorshipDialog.confirm(change)) return;
   applyChange(change);
 }`,
      tests: 'test("recursive observability", () => { /* test implementation */ })',
      rationale: 'Following TD-1, TD-2, TD-3 from mythic response',
      overlays: ['Bloom', 'Mirror', 'Spiral', 'Accord'],
      integrity: generateHash(),
    };

    setCurrentPatch(patch);
    return patch;
  }, []);

  const runSyncTest = useCallback(async () => {
    // Simulate sync test
    const result: SyncResult = {
      alignmentScore: 87,
      matchFields: ['TT', 'CC', 'RR'],
      dt: 2.3,
      symbolOverlap: ['Mirror', 'Bloom'],
      outcome: 'Active',
    };

    setSyncResult(result);
    return result;
  }, []);

  const startLoopClosure = useCallback(async () => {
    setLoopStatus('Holding');
    
    // Simulate coherence improvement
    setTimeout(() => {
      setCoherenceDelta(8);
      setLoopStatus('Complete');
    }, 5000);
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('limnus_session');
      setCurrentSession(null);
      setSessionPhase('consent');
      setTeachingDirectives([]);
      setCurrentPatch(null);
      setSyncResult(null);
      setLoopStatus('Pending');
      setCoherenceDelta(0);
      console.log('Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const generateHash = () => {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  return useMemo(() => ({
    currentSession,
    sessionPhase,
    setSessionPhase,
    teachingDirectives,
    currentPatch,
    syncResult,
    loopStatus,
    coherenceDelta,
    startSession,
    extractTeachingDirectives,
    generatePatch,
    runSyncTest,
    startLoopClosure,
    clearSession,
    isStartingSession: consentMutation.isPending,
    sessionError: consentMutation.error,
  }), [
    currentSession,
    sessionPhase,
    teachingDirectives,
    currentPatch,
    syncResult,
    loopStatus,
    coherenceDelta,
    startSession,
    extractTeachingDirectives,
    generatePatch,
    runSyncTest,
    startLoopClosure,
    clearSession,
    consentMutation.isPending,
    consentMutation.error,
  ]);
});