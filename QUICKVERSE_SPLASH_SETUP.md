# QuickVerse Splash Screen Setup

## Overview

This guide explains how to set up the QuickVerse splash screen for both Android and iOS platforms.

## What's Been Configured

### Android

- ✅ Created `splash_screen.xml` drawable that uses the full splash screen image
- ✅ Created `SplashTheme` style
- ✅ Updated `AndroidManifest.xml` to use splash theme

### iOS

- ✅ Updated `LaunchScreen.storyboard` to use the full splash screen image
- ✅ Configured to fill the entire screen with the image

## Required Actions

### 1. Add the Full QuickVerse Splash Screen Image

You need to add the complete QuickVerse splash screen image (as described) to both platforms:

#### For Android:

Add the image file:

```
android/app/src/main/res/drawable/splash_screen_image.png
```

#### For iOS:

Add the image to the asset catalog:

```
ios/qvuserapp_ui/Images.xcassets/splash_screen_image.imageset/
```

### 2. Image Specifications

The image should be:

- **High resolution**: At least 1080x1920px for good quality
- **Format**: PNG or JPG
- **Content**: The complete QuickVerse splash screen with:
  - Light yellow/cream background
  - Food-themed pattern overlay
  - Centered QuickVerse logo with stylized "Q"
  - "Quick Verse" text

### 3. Image Sizing

#### Android:

- Place the image in `drawable/` folder
- Android will automatically scale it to fit different screen sizes

#### iOS:

- Add to `Images.xcassets/splash_screen_image.imageset/`
- Include different sizes if needed (1x, 2x, 3x)

## Testing

After adding the image:

1. Clean and rebuild your project
2. Test on both Android and iOS devices
3. Verify the splash screen appears correctly during app launch

## Notes

- The splash screen will show immediately when the app starts
- It will transition to your main app screen once React Native loads
- The image will fill the entire screen on both platforms
