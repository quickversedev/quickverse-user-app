import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface OrderProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
}

const OrderProgress: React.FC<OrderProgressProps> = ({ currentStep, totalSteps, steps }) => {
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
      marginBottom: 16,
    },
    stepContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    lastStep: {
      marginBottom: 0,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    completedStep: {
      backgroundColor: getColor('success'),
    },
    currentStep: {
      backgroundColor: getColor('primary'),
    },
    pendingStep: {
      backgroundColor: getColor('border'),
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      color: getColor('text'),
      marginBottom: 4,
    },
    stepDescription: {
      color: getColor('subText'),
    },
    completedTitle: {
      color: getColor('success'),
    },
    currentTitle: {
      color: getColor('primary'),
    },
  });

  const getStepStatus = (step: any, index: number) => {
    if (step.completed) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check';
      case 'current':
        return 'clock-outline';
      default:
        return 'circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
        Order Progress
      </ThemeText>

      {steps.map((step, index) => {
        const status = getStepStatus(step, index);
        const isLast = index === steps.length - 1;

        return (
          <View key={step.id} style={[styles.stepContainer, isLast && styles.lastStep]}>
            <View
              style={[
                styles.stepIcon,
                status === 'completed' && styles.completedStep,
                status === 'current' && styles.currentStep,
                status === 'pending' && styles.pendingStep,
              ]}
            >
              <MaterialCommunityIcons
                name={getStepIcon(status)}
                size={16}
                color={getColor('white')}
              />
            </View>
            <View style={styles.stepContent}>
              <ThemeText
                variant="body"
                color={
                  status === 'completed'
                    ? getColor('success')
                    : status === 'current'
                    ? getColor('primary')
                    : getColor('text')
                }
                style={[
                  styles.stepTitle,
                  status === 'completed' && styles.completedTitle,
                  status === 'current' && styles.currentTitle,
                ]}
              >
                {step.title}
              </ThemeText>
              <ThemeText
                variant="caption"
                color={getColor('subText')}
                style={styles.stepDescription}
              >
                {step.description}
              </ThemeText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default OrderProgress;
