import { Colors } from '@/constants/theme';
import { decryptMessage, deriveMatchKey } from '@/lib/encryption';
import { getMessages, getUserProfile, markMessagesAsRead, sendMessage, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  pending?: boolean; // For messages being sent
}

export default function ChatScreen() {
  const { matchId, userId } = useLocalSearchParams<{ matchId: string; userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [partnerProfile, setPartnerProfile] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    photos: string[];
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (matchId && userId) {
      setIsInitialLoad(true); // Reset for new chat
      setMessages([]); // Clear previous messages
      fetchMessages(true); // Show loading on initial load
      fetchPartnerProfile();
    }
  }, [matchId, userId]);

  // Auto-focus input when screen loads (keyboard opens automatically)
  useEffect(() => {
    if (!loading && matchId && userId) {
      // Small delay to ensure screen is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [loading, matchId, userId]);

  // Real-time subscription for new messages (like WhatsApp)
  useEffect(() => {
    if (!matchId || !currentUserId) return;

    // console.log('🔔 Setting up real-time subscription for match:', matchId);

    // Subscribe to new messages for this match
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // console.log('📨 New message received:', payload.new);
          
          // Get match info to decrypt the message
          const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .maybeSingle();

          if (match) {
            // Decrypt the new message
            const encryptionKey = deriveMatchKey(matchId, match.user1_id, match.user2_id);
            const decryptedContent = decryptMessage(payload.new.content, encryptionKey);
            
            const newMessage: Message = {
              ...payload.new,
              content: decryptedContent,
            } as Message;

            // Add new message to list (avoid duplicates)
            setMessages((prev) => {
              // Check if message already exists
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });

            // Mark as read if it's for current user
            if (newMessage.receiver_id === currentUserId) {
              markMessagesAsRead(matchId);
            }
          }
        }
      )
      .subscribe((status) => {
        // console.log('📡 Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      // console.log('🔕 Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  }, [matchId, currentUserId]);

  // Refresh messages silently when screen comes into focus (like WhatsApp/Telegram)
  useFocusEffect(
    React.useCallback(() => {
      if (matchId && userId) {
        // Only refresh silently if we already have messages (not initial load)
        if (!isInitialLoad && messages.length > 0) {
          fetchMessages(false); // Silent refresh, no loading
        }
        markMessagesAsRead(matchId);
      }
    }, [matchId, userId, isInitialLoad, messages.length])
  );

  useEffect(() => {
    // Mark messages as read when screen is focused
    if (matchId && messages.length > 0) {
      markMessagesAsRead(matchId);
    }
  }, [matchId, messages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when typing (to show last message)
  useEffect(() => {
    if (messageText.length > 0 && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messageText]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const fetchPartnerProfile = async () => {
    if (!userId) return;
    const { data } = await getUserProfile(userId);
    if (data) {
      setPartnerProfile(data);
    }
  };

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

  const fetchMessages = async (showLoading: boolean = false) => {
    if (!matchId) return;
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const { data, error } = await getMessages(matchId);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (data) {
        setMessages(data);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }

      if (showLoading) {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error in fetchMessages:', error);
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !matchId || !userId || sending) return;

    const trimmedMessage = messageText.trim();
    setMessageText('');
    setSending(true);

    // Create pending message with clock icon (optimistic update)
    const pendingMessageId = `pending-${Date.now()}`;
    const pendingMessage: Message = {
      id: pendingMessageId,
      sender_id: currentUserId || '',
      receiver_id: userId,
      content: trimmedMessage,
      read: false,
      created_at: new Date().toISOString(),
      pending: true,
    };

    // Add pending message immediately
    setMessages((prev) => [...prev, pendingMessage]);

    try {
      const { data, error } = await sendMessage(userId, matchId, trimmedMessage);

      if (error) {
        console.error('❌ Error sending message:', error);
        // Remove pending message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== pendingMessageId));
        setMessageText(trimmedMessage); // Restore message on error
        setSending(false);
        return;
      }

      if (data) {
        // Replace pending message with real message
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== pendingMessageId);
          // Check if message already exists (from real-time subscription)
          const exists = filtered.some((msg) => msg.id === data.id);
          if (exists) return filtered;
          return [...filtered, data];
        });
      }

      setSending(false);
    } catch (error) {
      console.error('❌ Exception in handleSendMessage:', error);
      // Remove pending message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== pendingMessageId));
      setMessageText(trimmedMessage);
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const partnerName = partnerProfile
    ? `${partnerProfile.first_name} ${partnerProfile.last_name}`
    : 'Loading...';
  const partnerPhoto = partnerProfile?.photos?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {partnerPhoto ? (
            <Image source={{ uri: partnerPhoto }} style={styles.headerPhoto} />
          ) : (
            <View style={styles.headerPhotoPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.textLight} />
            </View>
          )}
          <Text style={styles.headerName} numberOfLines={1}>
            {partnerName}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
          {loading && isInitialLoad ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : messages.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => {
                const isSent = message.sender_id === currentUserId;
                return (
                  <View
                    key={message.id}
                    style={[styles.messageWrapper, isSent ? styles.messageSent : styles.messageReceived]}
                  >
                    <View style={[styles.messageBubble, isSent ? styles.messageBubbleSent : styles.messageBubbleReceived]}>
                      <View style={styles.messageContentRow}>
                        <Text style={[styles.messageText, isSent ? styles.messageTextSent : styles.messageTextReceived]}>
                          {message.content}
                        </Text>
                        <View style={styles.messageFooterRow}>
                          <Text style={[styles.messageTime, isSent ? styles.messageTimeSent : styles.messageTimeReceived]}>
                            {formatTime(message.created_at)}
                          </Text>
                          {isSent && (
                            <View style={styles.readReceipt}>
                              {message.pending ? (
                                // Show clock icon for pending messages (like WhatsApp)
                                <Ionicons 
                                  name="time-outline" 
                                  size={14} 
                                  color="rgba(255, 255, 255, 0.7)" 
                                />
                              ) : message.read ? (
                                // Show double checkmark for read messages
                                <>
                                  <Ionicons 
                                    name="checkmark-done" 
                                    size={14} 
                                    color="#4FC3F7" 
                                  />
                                  <Ionicons 
                                    name="checkmark-done" 
                                    size={14} 
                                    color="#4FC3F7" 
                                    style={{ marginLeft: -4 }}
                                  />
                                </>
                              ) : (
                                // Show single checkmark for sent but not read
                                <Ionicons 
                                  name="checkmark" 
                                  size={14} 
                                  color="rgba(255, 255, 255, 0.7)" 
                                />
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

        {/* Input Area - Always visible */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textLight}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              // Scroll to bottom when typing to show last message
              if (messages.length > 0) {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 50);
              }
            }}
            multiline
            maxLength={1000}
            editable={!sending && !(loading && isInitialLoad)}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSendMessage}
            onFocus={() => {
              // Scroll to bottom when input is focused (keyboard opens)
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textLight,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageSent: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageReceived: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    maxWidth: '100%',
  },
  messageBubbleSent: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  messageBubbleReceived: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flexShrink: 1,
  },
  messageTextSent: {
    color: Colors.primaryText,
  },
  messageTextReceived: {
    color: Colors.textDark,
  },
  messageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeReceived: {
    color: Colors.textLight,
  },
  readReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'android' ? 8 : 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    minHeight: 60,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 22,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

