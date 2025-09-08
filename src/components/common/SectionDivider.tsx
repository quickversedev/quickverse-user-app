import React from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeText } from './theme/ThemeText';

interface SectionDividerProps {
  text: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fontSize?: number;
}

const LINE_COLOR = '#888C99';

const SectionDivider: React.FC<SectionDividerProps> = ({ text, style, textStyle, fontSize }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Left line: thick near text, fade outward */}
      <LinearGradient
        colors={[LINE_COLOR, 'transparent']}
        style={styles.line}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
      />
      <ThemeText
        variant="h2"
        color="#AEB2BC"
        style={[
          styles.text,
          textStyle,
          fontSize ? { fontSize } : {},
          { letterSpacing: 1, textAlign: 'center' },
        ]}
      >
        {text}
      </ThemeText>
      {/* Right line: thick near text, fade outward */}
      <LinearGradient
        colors={[LINE_COLOR, 'transparent']}
        style={styles.line}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  text: {
    fontSize: 22,
  },
});

export default SectionDivider;
