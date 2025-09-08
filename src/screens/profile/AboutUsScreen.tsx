import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';

const AboutUsScreen: React.FC = () => {
  const { getColor, getTypography, theme } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('card'),
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 4,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getColor('background'),
      marginRight: 16,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 2,
    },
    headerTitle: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    manifestoSection: {
      marginTop: 32,
      marginBottom: 40,
      paddingHorizontal: 8,
    },
    manifestoTitle: {
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    manifestoSubtitle: {
      fontSize: getTypography('subtitle'),
      color: getColor('subText'),
      textAlign: 'center',
      marginBottom: 40,
      fontStyle: 'italic',
      letterSpacing: 0.3,
    },
    paragraph: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      lineHeight: getTypography('body') * 1.7,
      marginBottom: 24,
      textAlign: 'left',
      letterSpacing: 0.2,
    },
    highlightText: {
      fontSize: getTypography('body'),
      color: getColor('main'),
      fontWeight: '700',
      lineHeight: getTypography('body') * 1.7,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    visionSection: {
      // marginTop: 20,
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    visionTitle: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 32,
      letterSpacing: 0.5,
    },
    visionCards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 40,
      gap: 12,
    },
    visionCard: {
      flex: 1,
      backgroundColor: getColor('card'),
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 6,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    visionIcon: {
      fontSize: 36,
      color: getColor('main'),
      marginBottom: 16,
    },
    visionCardText: {
      fontSize: getTypography('caption'),
      color: getColor('text'),
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0.3,
      lineHeight: getTypography('caption') * 1.4,
    },
    visionCardSubtext: {
      fontSize: getTypography('small'),
      color: getColor('subText'),
      textAlign: 'center',
      marginTop: 8,
      lineHeight: getTypography('small') * 1.4,
    },
    conclusionSection: {
      marginTop: 32,
      marginBottom: 40,
      paddingHorizontal: 8,
    },
    conclusionText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      lineHeight: getTypography('body') * 1.7,
      textAlign: 'center',
      fontStyle: 'italic',
      letterSpacing: 0.2,
    },
    logoSection: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    logoIcon: {
      fontSize: 48,
      color: getColor('main'),
      marginRight: 12,
    },
    logoText: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    tagline: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textAlign: 'center',
    },
    smartbizLogo: {
      width: 48,
      height: 48,
      marginRight: 12,
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: getColor('border') }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: getColor('card') }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <ThemeText variant="h2" color={getColor('text')} style={styles.headerTitle}>
            About Us
          </ThemeText>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Manifesto Section */}
          <View style={styles.manifestoSection}>
            <ThemeText variant="h1" color={getColor('text')} style={styles.manifestoTitle}>
              QuickVerse Manifesto
            </ThemeText>
            <ThemeText
              variant="subtitle"
              color={getColor('subText')}
              style={styles.manifestoSubtitle}
            >
              Redefining how things move
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              We are not just delivering faster.{'\n'}
              We are redefining how things move.
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              From our very first test flight to serving 20+ campuses, QuickVerse has always stood
              for one thing: making tomorrow's tech a part of today's student life.
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              For months, we've been the lifeline of hostels, libraries, and late-night canteens. A
              campus-first movement—where drones and partners deliver food, essentials, and joy in
              minutes.
            </ThemeText>

            <ThemeText variant="body" color={getColor('main')} style={styles.highlightText}>
              But this is just the beginning.
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              Now, we're taking flight beyond the gates. From college campuses to open streets,
              neighborhoods, and entire cities—QuickVerse is scaling to become India's fastest, most
              futuristic urban delivery network.
            </ThemeText>
          </View>

          {/* Vision Section */}
          <View style={styles.visionSection}>
            <ThemeText variant="h2" color={getColor('text')} style={styles.visionTitle}>
              Our Vision is Clear
            </ThemeText>

            <View style={styles.visionCards}>
              <View style={styles.visionCard}>
                <Icon name="drone" size={32} style={styles.visionIcon} />
                <ThemeText variant="caption" color={getColor('text')} style={styles.visionCardText}>
                  Access to Anything, Anytime
                </ThemeText>
              </View>

              <View style={styles.visionCard}>
                <Icon name="bike" size={32} style={styles.visionIcon} />
                <ThemeText variant="caption" color={getColor('text')} style={styles.visionCardText}>
                  Drones as Normal as Bikes
                </ThemeText>
              </View>

              <View style={styles.visionCard}>
                <Icon name="star" size={32} style={styles.visionIcon} />
                <ThemeText variant="caption" color={getColor('text')} style={styles.visionCardText}>
                  Building a Magical World
                </ThemeText>
              </View>
            </View>
          </View>
          {/* SmartBiz Section */}
          <View style={styles.conclusionSection}>
            <ThemeText variant="h2" color={getColor('text')} style={styles.visionTitle}>
              Powered by SmartBiz
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              SmartBiz by Amazon is an end-to-end eCommerce website builder designed to help
              businesses launch, manage, and scale their online presence with ease.
            </ThemeText>

            <ThemeText variant="body" color={getColor('text')} style={styles.paragraph}>
              From seamless storefront creation to secure payments and reliable logistics, SmartBiz
              empowers entrepreneurs and startups to focus on growth while technology handles the
              heavy lifting.
            </ThemeText>

            <ThemeText variant="body" color={getColor('main')} style={styles.highlightText}>
              Together with SmartBiz, QuickVerse is building the future of smart commerce and faster
              deliveries.
            </ThemeText>
          </View>

          {/* Conclusion Section */}

          {/* Logo Section */}
          {/* <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Icon name="rocket-launch" size={48} style={styles.logoIcon} />
              <ThemeText variant="h2" color={getColor('text')} style={styles.logoText}>
                QuickVerse
              </ThemeText>
            </View>
            <ThemeText variant="caption" color={getColor('subText')} style={styles.tagline}>
              Tomorrow's tech, today's reality
            </ThemeText>
            <ThemeText
              variant="small"
              color={getColor('subText')}
              style={[styles.tagline, { marginTop: 8, fontStyle: 'italic' }]}
            >
              in collaboration with SmartBiz
            </ThemeText>
          </View> */}
          {/* Logo Section */}
          <View style={styles.logoSection}>
            {/* QuickVerse Logo Row */}
            <View style={styles.logoContainer}>
              <Icon name="rocket-launch" size={48} style={styles.logoIcon} />
              <ThemeText variant="h2" color={getColor('text')} style={styles.logoText}>
                QuickVerse
              </ThemeText>
            </View>
            <ThemeText variant="caption" color={getColor('subText')} style={styles.tagline}>
              Tomorrow's tech, today's reality
            </ThemeText>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: getColor('border'),
                marginVertical: 20,
                alignSelf: 'stretch',
              }}
            />

            {/* SmartBiz Logo Row */}
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: 'https://m.media-amazon.com/images/G/31/smartcommerce/SmartBIZ_Logo_2-03.png',
                }}
                style={styles.smartbizLogo}
                resizeMode="contain"
              />
              <ThemeText variant="h2" color={getColor('text')} style={styles.logoText}>
                SmartBiz
              </ThemeText>
            </View>
            <ThemeText
              variant="small"
              color={getColor('subText')}
              style={[styles.tagline, { marginTop: 8, fontStyle: 'italic' }]}
            >
              Empowering businesses with smart eCommerce solutions
            </ThemeText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AboutUsScreen;
