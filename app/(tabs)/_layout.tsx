import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.navbarIcon,
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: Colors.navbarBackground,
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[
              props.style,
              {
                opacity: props.accessibilityState?.selected ? 1 : 0.7,
              },
            ]}
          />
        ),
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 
              name="home" 
              size={size} 
              color={color} 
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 
              name="thumbs-up" 
              size={size} 
              color={color} 
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 
              name="heart" 
              size={size} 
              color={color} 
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 
              name="envelope" 
              size={size} 
              color={color} 
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 
              name="user-circle" 
              size={size} 
              color={color} 
              solid={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
