export const Fonts = {
  regular: 'BricolageGrotesque-Regular',
  medium: 'BricolageGrotesque-Medium',
  bold: 'BricolageGrotesque-Bold',
  base: 'BricolageGrotesque',
} as const;

export type FontToken = keyof typeof Fonts;

export const fontStyle = (weight: FontToken, fontSize?: number) => ({
  fontFamily: Fonts[weight],
  ...(fontSize ? { fontSize } : {}),
});
