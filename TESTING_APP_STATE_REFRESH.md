# Testing App State Refresh Functionality

This guide will help you test the auto-refresh functionality when your app comes back from background.

## 🧪 Testing Methods

### 1. **Real Device Testing (Recommended)**

#### **Setup:**

1. Run your app on a physical device
2. Open React Native Debugger or Metro console
3. Navigate to different screens (Home, Explore, Orders)

#### **Test Scenarios:**

**Scenario A: Quick Background Switch (Should NOT refresh)**

1. Put app in background (press home button)
2. Wait 5 seconds
3. Return to app
4. **Expected:** No refresh should occur (below 10s threshold)

**Scenario B: Extended Background (Should refresh)**

1. Put app in background
2. Wait 15+ seconds
3. Return to app
4. **Expected:** Refresh should trigger

**Scenario C: Multiple Background Sessions**

1. Put app in background for 20 seconds
2. Return to app (should refresh)
3. Put app in background again for 20 seconds
4. Return to app (should refresh again)

### 2. **Using the Test Component**

Add the test component to any screen temporarily:

```tsx
import { AppStateRefreshTest } from '../components/common/AppStateRefreshTest';

// In your screen component
const MyScreen = () => {
  return (
    <View>
      <AppStateRefreshTest
        onRefresh={async () => {
          console.log('Test refresh triggered!');
          // Your refresh logic here
        }}
        threshold={10000} // 10 seconds for testing
      />
      {/* Your existing content */}
    </View>
  );
};
```

### 3. **Console Monitoring**

Watch for these log messages in your console:

```
🔄 [AppStateRefresh] Time in background: 15000 ms
🔄 [AppStateRefresh] Threshold: 10000 ms
✅ [AppStateRefresh] Triggering refresh after 15000 ms in background
✅ [AppStateRefresh] Refresh completed successfully
```

### 4. **Simulator/Emulator Testing**

#### **Android Emulator:**

```bash
# Go to home screen
adb shell input keyevent KEYCODE_HOME

# Wait for threshold time, then return to app
adb shell input keyevent KEYCODE_APP_SWITCH
```

#### **iOS Simulator:**

- Press `Cmd + H` to go home
- Wait for threshold time
- Click app icon to return

## 🔍 What to Test

### **1. Threshold Behavior**

- ✅ **Below threshold:** No refresh
- ✅ **Above threshold:** Refresh triggers
- ✅ **Multiple refreshes:** Each background session resets timer

### **2. Different Screens**

- ✅ **Home Screen:** Vendors refresh
- ✅ **Explore Screen:** Vendors refresh
- ✅ **Orders Screen:** Orders refresh
- ✅ **App Initializer:** All critical data refreshes

### **3. Error Handling**

- ✅ **Network errors:** Graceful handling
- ✅ **API failures:** Non-blocking behavior
- ✅ **Component unmount:** No memory leaks

### **4. Performance**

- ✅ **Quick switches:** No unnecessary API calls
- ✅ **Multiple instances:** No conflicts
- ✅ **Memory usage:** No leaks

## 🛠️ Debugging Tips

### **1. Add Temporary Logging**

```tsx
// In any component using useAppStateRefresh
useAppStateRefresh({
  onForeground: async () => {
    console.log('🔄 [DEBUG] Refresh triggered for:', componentName);
    try {
      await yourRefreshFunction();
      console.log('✅ [DEBUG] Refresh completed for:', componentName);
    } catch (error) {
      console.error('❌ [DEBUG] Refresh failed for:', componentName, error);
    }
  },
  refreshThreshold: 10000, // Lower for testing
});
```

### **2. Check App State Changes**

```tsx
import { AppState } from 'react-native';

useEffect(() => {
  const handleAppStateChange = (nextAppState: string) => {
    console.log('📱 App State Changed:', nextAppState);
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, []);
```

### **3. Monitor Network Requests**

Use React Native Debugger or Flipper to monitor:

- API calls when returning from background
- Request timing and responses
- Network errors

## 🎯 Test Checklist

### **Basic Functionality**

- [ ] App goes to background correctly
- [ ] App returns to foreground correctly
- [ ] Refresh triggers after threshold time
- [ ] No refresh for quick background switches

### **Data Refresh**

- [ ] Vendors refresh on Home/Explore screens
- [ ] Orders refresh on Orders screen
- [ ] App config refreshes on app level
- [ ] Theme and pages refresh appropriately

### **Error Scenarios**

- [ ] Network unavailable during refresh
- [ ] API returns errors during refresh
- [ ] Component unmounts during refresh
- [ ] Multiple rapid background/foreground switches

### **Performance**

- [ ] No excessive API calls
- [ ] No memory leaks
- [ ] Smooth user experience
- [ ] No UI freezing during refresh

## 🚨 Common Issues

### **1. Refresh Not Triggering**

- Check if `enabled` prop is true
- Verify threshold time is correct
- Ensure component is mounted
- Check console for errors

### **2. Multiple Refreshes**

- Verify only one instance of hook per component
- Check if multiple components are refreshing same data
- Ensure proper cleanup

### **3. Performance Issues**

- Reduce refresh frequency for heavy operations
- Use `Promise.allSettled()` for multiple API calls
- Implement proper error boundaries

## 📱 Platform-Specific Notes

### **Android**

- Background app limits may affect behavior
- Battery optimization can impact background time
- Test on different Android versions

### **iOS**

- Background app refresh settings matter
- Test with different iOS versions
- Check background app refresh in Settings

## 🎉 Success Criteria

Your auto-refresh implementation is working correctly when:

1. ✅ Users see fresh data after returning from background
2. ✅ No unnecessary API calls for quick app switches
3. ✅ Smooth user experience with no UI freezing
4. ✅ Proper error handling without app crashes
5. ✅ Memory usage remains stable over time

## 🔧 Quick Test Commands

```bash
# Android - Go home and return
adb shell input keyevent KEYCODE_HOME
sleep 15
adb shell input keyevent KEYCODE_APP_SWITCH

# iOS Simulator - Go home and return
# Press Cmd + H, wait 15 seconds, click app icon
```

Happy testing! 🚀

