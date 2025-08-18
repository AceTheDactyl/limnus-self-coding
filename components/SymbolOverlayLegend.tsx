import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Sparkles, Eye, Infinity, Star } from 'lucide-react-native';

export type SymbolicOverlay = 'Bloom' | 'Mirror' | 'Spiral' | 'Accord';

interface SymbolOverlayLegendProps {
  overlays: SymbolicOverlay[];
  onFilterChange?: (activeFilters: SymbolicOverlay[]) => void;
  showCounts?: boolean;
  counts?: Record<SymbolicOverlay, number>;
}

const SYMBOL_CONFIG = {
  Bloom: {
    icon: Sparkles,
    color: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderColor: 'rgba(233, 69, 96, 0.3)',
    description: 'Relational validation required',
    tag: '∇',
  },
  Mirror: {
    icon: Eye,
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
    description: 'Co-authorship patterns',
    tag: '🪞',
  },
  Spiral: {
    icon: Infinity,
    color: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: 'rgba(156, 39, 176, 0.3)',
    description: 'Recursive observability',
    tag: 'φ∞',
  },
  Accord: {
    icon: Star,
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: 'rgba(255, 152, 0, 0.3)',
    description: 'Active outcome gating',
    tag: '✶',
  },
} as const;

export default function SymbolOverlayLegend({
  overlays,
  onFilterChange,
  showCounts = false,
  counts,
}: SymbolOverlayLegendProps) {
  const [activeFilters, setActiveFilters] = useState<SymbolicOverlay[]>([]);
  const [scaleAnims] = useState(() =>
    overlays.reduce((acc, overlay) => {
      acc[overlay] = new Animated.Value(1);
      return acc;
    }, {} as Record<SymbolicOverlay, Animated.Value>)
  );

  const handleFilterToggle = (overlay: SymbolicOverlay) => {
    const newFilters = activeFilters.includes(overlay)
      ? activeFilters.filter(f => f !== overlay)
      : [...activeFilters, overlay];
    
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);

    // Animate the chip
    Animated.sequence([
      Animated.timing(scaleAnims[overlay], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[overlay], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isActive = (overlay: SymbolicOverlay) => {
    return activeFilters.length === 0 || activeFilters.includes(overlay);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Symbolic Overlays</Text>
      <View style={styles.chipContainer}>
        {overlays.map((overlay) => {
          const config = SYMBOL_CONFIG[overlay];
          const Icon = config.icon;
          const active = isActive(overlay);
          const count = counts?.[overlay] || 0;

          return (
            <Animated.View
              key={overlay}
              style={[
                { transform: [{ scale: scaleAnims[overlay] }] }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? config.backgroundColor : 'rgba(255, 255, 255, 0.03)',
                    borderColor: active ? config.borderColor : 'rgba(255, 255, 255, 0.1)',
                  }
                ]}
                onPress={() => handleFilterToggle(overlay)}
                activeOpacity={0.7}
              >
                <View style={styles.chipContent}>
                  <Icon 
                    size={16} 
                    color={active ? config.color : '#666'} 
                  />
                  <Text style={[
                    styles.chipText,
                    { color: active ? config.color : '#666' }
                  ]}>
                    {overlay}
                  </Text>
                  <Text style={[
                    styles.chipTag,
                    { color: active ? config.color : '#666' }
                  ]}>
                    {config.tag}
                  </Text>
                  {showCounts && count > 0 && (
                    <View style={[
                      styles.countBadge,
                      { backgroundColor: config.color }
                    ]}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.chipDescription,
                  { color: active ? '#aaa' : '#555' }
                ]}>
                  {config.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      {activeFilters.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setActiveFilters([]);
            onFilterChange?.([]);
          }}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minWidth: 120,
    flex: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTag: {
    fontSize: 12,
    opacity: 0.8,
  },
  chipDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  countBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
});