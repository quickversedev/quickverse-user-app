import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CategoryScreen from '../screens/Category/CategoryScreen';
import HomeScreen from '../screens/Home/HomeScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Category: { categoryName: string };
};

const Stack = createStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="HomeMain"
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
