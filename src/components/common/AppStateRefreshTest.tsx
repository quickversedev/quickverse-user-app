import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppStateRefresh } from '../../hooks/useAppStateRefresh';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from './theme/ThemeText';

interface AppStateRefreshTestProps {
  onRefresh?: () => void | Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export const AppStateRefreshTest: React.FC<AppStateRefreshTestProps> = ({
  onRefresh,
  threshold = 10000, // 10 seconds for testing
  enabled = true,
}) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isInBackground, setIsInBackground] = useState(false);

  const handleRefresh = async () => {
    setRefreshCount(prev => prev + 1);
    setLastRefreshTime(new Date());

    if (onRefresh) {
      await onRefresh();
    }
  };

  const { manualRefresh, isInBackground: backgroundState } = useAppStateRefresh({
    onForeground: handleRefresh,
    refreshThreshold: threshold,
    enabled,
  });

  useEffect(() => {
    setIsInBackground(backgroundState);
  }, [backgroundState]);

  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    title: {
      color: getColor('text'),
      marginBottom: 12,
    },
    statusText: {
      color: getColor('subText'),
      marginBottom: 16,
    },
    refreshButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: 'center',
      opacity: isInBackground ? 0.6 : 1,
    },
    refreshButtonText: {
      color: getColor('white'),
    },
  });

  return (
    <View style={styles.container}>
      <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
        App State Refresh Test
      </ThemeText>

      <ThemeText variant="body" color={getColor('subText')} style={styles.statusText}>
        {lastRefreshTime
          ? `Last refreshed: ${lastRefreshTime.toLocaleTimeString()}`
          : 'No refresh data available'}
      </ThemeText>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={manualRefresh}
        disabled={isInBackground}
        activeOpacity={0.8}
      >
        <ThemeText variant="body" color={getColor('white')} style={styles.refreshButtonText}>
          {isInBackground ? 'Refreshing...' : 'Refresh App State'}
        </ThemeText>
      </TouchableOpacity>
    </View>
  );
};
