import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getTotalUnreadCount, supabase } from '@/lib/supabase';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Check for unread messages
  const checkUnreadMessages = async () => {
    const { data } = await getTotalUnreadCount();
    if (data !== null) {
      setUnreadCount(data);
    }
  };

  // Check on mount and set up real-time updates
  useEffect(() => {
    checkUnreadMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh unread count when messages change
          checkUnreadMessages();
        }
      )
      .subscribe();

    // Check periodically (every 30 seconds) as backup
    const interval = setInterval(() => {
      checkUnreadMessages();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

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
            <View style={styles.iconContainer}>
              <FontAwesome5 
                name="envelope" 
                size={size} 
                color={color} 
                solid={focused}
              />
              {!focused && unreadCount > 0 && (
                <View style={styles.badge}>
                  {unreadCount > 99 ? (
                    <Text style={styles.badgeText}>99+</Text>
                  ) : (
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  )}
                </View>
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            // Clear notification when messages tab is clicked
            setUnreadCount(0);
          },
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

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.navbarBackground,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
