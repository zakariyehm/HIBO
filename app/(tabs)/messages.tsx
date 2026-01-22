import { Colors } from '@/constants/theme';
import { decryptMessage, deriveMatchKey } from '@/lib/encryption';
import { getConversations, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Conversation {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
  };
  partner: {
    id: string;
    first_name: string;
    last_name: string;
    photos: string[];
  } | null;
  lastMessage: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Get current user ID
    const getCurrentUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUserId();
  }, []);

  useEffect(() => {
    // Only show loading on initial mount
    fetchConversations(true);
  }, []);

  // Real-time subscription for all messages (like WhatsApp)
  useEffect(() => {
    if (!currentUserId) return;

    console.log('🔔 Setting up real-time subscription for all messages');

    // Subscribe to all message changes
    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('📨 New message received in list:', payload.new);
          
          // Refresh conversations silently in background (no loading)
          await fetchConversations(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('📝 Message updated:', payload.new);
          
          // Refresh conversations silently when messages are marked as read
          await fetchConversations(false);
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages list subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Unsubscribing from messages list updates');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Refresh conversations silently when screen comes into focus (like WhatsApp/Telegram)
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we already have conversations loaded (not initial load)
      if (!isInitialLoad && conversations.length > 0) {
        fetchConversations(false);
      }
    }, [isInitialLoad, conversations.length])
  );

  const fetchConversations = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const { data, error } = await getConversations();

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (data) {
        setConversations(data);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }

      if (showLoading) {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error in fetchConversations:', error);
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(false);
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    if (conversation.partner?.id) {
      router.push({
        pathname: '/chat',
        params: {
          matchId: conversation.match.id,
          userId: conversation.partner.id,
        },
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Text style={styles.title}>Messages</Text>
      </SafeAreaView>

      {loading && isInitialLoad ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start chatting with your matches! 💬
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
        >
          {conversations.map((conversation) => {
            if (!conversation.partner) return null;

            const partnerName = `${conversation.partner.first_name} ${conversation.partner.last_name}`;
            const partnerPhoto = conversation.partner.photos?.[0];
            
            // Decrypt last message content if it exists
            let lastMessageText = 'No messages yet';
            if (conversation.lastMessage?.content) {
              try {
                const encryptionKey = deriveMatchKey(
                  conversation.match.id,
                  conversation.match.user1_id,
                  conversation.match.user2_id
                );
                lastMessageText = decryptMessage(conversation.lastMessage.content, encryptionKey);
              } catch (error) {
                console.error('❌ Error decrypting last message:', error);
                lastMessageText = conversation.lastMessage.content;
              }
            }
            
            const lastMessageTime = conversation.lastMessage
              ? formatTime(conversation.lastMessage.created_at)
              : '';

            return (
              <TouchableOpacity
                key={conversation.match.id}
                style={styles.conversationItem}
                onPress={() => handleConversationPress(conversation)}
                activeOpacity={0.7}
              >
                <View style={styles.photoContainer}>
                  {partnerPhoto ? (
                    <Image source={{ uri: partnerPhoto }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="person" size={24} color={Colors.textLight} />
                    </View>
                  )}
                  {conversation.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                      {partnerName}
                    </Text>
                    {lastMessageTime && (
                      <Text style={styles.conversationTime}>{lastMessageTime}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.conversationPreview,
                      conversation.unreadCount > 0 && styles.conversationPreviewUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {lastMessageText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.cardBackground,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  conversationPreviewUnread: {
    fontWeight: '600',
    color: Colors.textDark,
  },
});

