import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

const LIMNUS_HOLD_TASK = 'LIMNUS_HOLD_TASK';

interface HoldTaskData {
  sessionId: string;
  startTime: number;
  duration: number;
}

// Define the background task
TaskManager.defineTask(LIMNUS_HOLD_TASK, async ({ data, error }) => {
  console.log('[BACKGROUND] Hold task executed');
  
  if (error) {
    console.error('[BACKGROUND] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  try {
    const taskData = data as HoldTaskData;
    const now = Date.now();
    const elapsed = now - taskData.startTime;
    
    console.log('[BACKGROUND] Hold elapsed:', elapsed, 'ms');
    
    // Check if hold duration is complete
    if (elapsed >= taskData.duration * 1000) {
      console.log('[BACKGROUND] Hold complete, triggering recheck');
      
      // Trigger recheck via tRPC
      try {
        await trpcClient.limnus.loop.recheck.mutate({
          session_id: taskData.sessionId
        });
        
        // Update local storage to mark hold as complete
        await AsyncStorage.setItem('limnus_hold_status', 'complete');
        
        // Unregister the task
        await BackgroundFetch.unregisterTaskAsync(LIMNUS_HOLD_TASK);
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (apiError) {
        console.error('[BACKGROUND] Recheck API failed:', apiError);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (taskError) {
    console.error('[BACKGROUND] Task execution error:', taskError);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function startBackgroundHold(sessionId: string, duration: number = 120): Promise<boolean> {
  console.log('[BACKGROUND] Starting hold for session:', sessionId);
  
  // Check if device supports background tasks
  if (!Device.isDevice || Platform.OS === 'web') {
    console.log('[BACKGROUND] Background tasks not supported on this platform');
    return false;
  }
  
  try {
    // Check permissions
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.log('[BACKGROUND] Background fetch not available:', status);
      return false;
    }
    
    // Store hold data
    const holdData: HoldTaskData = {
      sessionId,
      startTime: Date.now(),
      duration
    };
    
    await AsyncStorage.setItem('limnus_hold_data', JSON.stringify(holdData));
    await AsyncStorage.setItem('limnus_hold_status', 'active');
    
    // Register background task
    await BackgroundFetch.registerTaskAsync(LIMNUS_HOLD_TASK, {
      minimumInterval: 60, // Check every minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    console.log('[BACKGROUND] Background hold registered successfully');
    return true;
  } catch (error) {
    console.error('[BACKGROUND] Failed to start background hold:', error);
    return false;
  }
}

export async function stopBackgroundHold(): Promise<void> {
  console.log('[BACKGROUND] Stopping background hold');
  
  try {
    await BackgroundFetch.unregisterTaskAsync(LIMNUS_HOLD_TASK);
    await AsyncStorage.removeItem('limnus_hold_data');
    await AsyncStorage.removeItem('limnus_hold_status');
    console.log('[BACKGROUND] Background hold stopped');
  } catch (error) {
    console.error('[BACKGROUND] Failed to stop background hold:', error);
  }
}

export async function getHoldStatus(): Promise<{ status: string; data?: HoldTaskData }> {
  try {
    const status = await AsyncStorage.getItem('limnus_hold_status');
    const dataStr = await AsyncStorage.getItem('limnus_hold_data');
    
    if (!status) {
      return { status: 'none' };
    }
    
    const data = dataStr ? JSON.parse(dataStr) : undefined;
    return { status, data };
  } catch (error) {
    console.error('[BACKGROUND] Failed to get hold status:', error);
    return { status: 'error' };
  }
}

// Fallback timer for web and unsupported platforms
export function startFallbackTimer(sessionId: string, duration: number, onComplete: () => void): ReturnType<typeof setTimeout> {
  console.log('[FALLBACK] Starting fallback timer for', duration, 'seconds');
  
  return setTimeout(() => {
    console.log('[FALLBACK] Timer complete, executing callback');
    onComplete();
  }, duration * 1000);
}