import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
      <LinearGradient
        colors={['transparent', LINE_COLOR, 'transparent']}
        style={styles.line}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      <Text style={[styles.text, textStyle, fontSize ? { fontSize } : {}]}>{text}</Text>
      <LinearGradient
        colors={['transparent', LINE_COLOR, 'transparent']}
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
    color: '#AEB2BC',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default SectionDivider;
