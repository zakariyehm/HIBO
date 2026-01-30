import { Colors } from '@/constants/theme';
import type { Post } from '@/lib/supabase';
import { blockUser, checkForMatch, getUserPosts, getUserPrompts, getUserStatus, likeUser, passUser, recordProfileView, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  title?: string;
  profileName: string;
  location: string;
  username: string;
  timeAgo: string;
  lastActive?: string | null; // Last active timestamp
  profileImage?: string;
  postImage?: string;
  photos?: string[]; // Array of photos for swiper
  postText?: string; // Legacy support
  bio_title?: string; // Bio title (Hinge-style)
  bio?: string; // Bio text (Hinge-style)
  nationality?: string[]; // Array of nationalities
  prompts?: Array<{ question: string; answer: string }>; // Prompts/Questions (Hinge-style)
  commentCount?: number;
  userId?: string; // User ID for profile navigation
  onShare?: () => void;
  onComment?: (comment: string, userId?: string) => void;
  onLike?: (userId: string, index?: number) => Promise<void> | void;
  onPass?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  index?: number; // meeshii saxda ah (rollback haddii limit)
  remainingLikes?: number; // daily likes left (for purple pill)
  /** Feed pass: card width for images (avoids overflow). Defaults to SCREEN_WIDTH. */
  contentWidth?: number;
  /** Profile details: Age, Orientation, Height, Location, Education, Nationality, Profession, Looking for */
  age?: number;
  height?: number;
  interested_in?: string;
  education_level?: string;
  profession?: string;
  looking_for?: string;
}

function PostCardBase({
  title,
  profileName,
  location,
  username,
  timeAgo,
  lastActive,
  profileImage,
  postImage,
  photos,
  postText,
  bio_title,
  bio,
  nationality,
  prompts,
  commentCount = 0,
  userId,
  onShare,
  onComment,
  onLike,
  onPass,
  onBlock,
  index,
  remainingLikes,
  contentWidth = SCREEN_WIDTH,
  age,
  height,
  interested_in,
  education_level,
  profession,
  looking_for,
}: PostCardProps) {
  const { text: statusText, isOnline } = getUserStatus(lastActive);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPrompts, setUserPrompts] = useState<Array<{ question: string; answer: string }>>(prompts || []);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Soo aqriso dhamaan prompts ee user-ka (add prompt)
  useEffect(() => {
    if (userId) {
      getUserPrompts(userId).then(({ data }) => {
        if (data?.length) setUserPrompts(data.map((p: any) => ({ question: p.question, answer: p.answer })));
      });
    }
  }, [userId]);

  // Soo aqriso dhamaan posts ee user-ka (post user uu soo galiyo)
  useEffect(() => {
    if (userId) {
      getUserPosts(userId).then(({ data }) => {
        if (data) setUserPosts(data);
      });
    }
  }, [userId]);
  
  // Helper: extract post image URL (string, JSON string, or object)
  const getPostImageUrl = (imageUrl: any): string | null => {
    if (!imageUrl) return null;
    if (typeof imageUrl === 'string') {
      const t = imageUrl.trim();
      if (t.startsWith('http')) return t;
      if (t.startsWith('{') || t.startsWith('[')) {
        try {
          const p = JSON.parse(t);
          return p.publicUrl || p.path || null;
        } catch {
          return null;
        }
      }
      return null;
    }
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      return (imageUrl as any).publicUrl || (imageUrl as any).path || null;
    }
    return null;
  };

  // Use photos array if provided, otherwise fallback to postImage
  const imageArray = photos && photos.length > 0 ? photos : (postImage ? [postImage] : []);
  
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = contentWidth;
    const idx = Math.round(contentOffsetX / cardWidth);
    setCurrentImageIndex(idx);
  };

  const handleLike = async () => {
    if (!userId || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 400);

    if (onLike) {
      onLike(userId, index);
      return;
    }

    // Fallback: If no parent callback, handle like directly
    try {
      const likeResult = await likeUser(userId);
      
      // If there's an error, DO NOT remove the card
      if (likeResult.error) {
        if (likeResult.error.message === 'DAILY_LIKE_LIMIT_REACHED') {
          // Parent component will handle the limit modal
          // DO NOT remove card - keep it visible
          return;
        }
        if (likeResult.error.message === 'MATCH_LIMIT_REACHED') {
          // Parent component will show blocking modal
          // DO NOT remove card - keep it visible
          return;
        }
        console.error('❌ Error liking user:', likeResult.error);
        // DO NOT remove card on any error
        return;
      }
      
      // ONLY remove card if like was successful (no error)
      if (likeResult.data && !likeResult.error) {
        // Check for match in background
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && userId) {
            checkForMatch(session.user.id, userId).then((matchResult: any) => {
              if (matchResult.data) {
                router.push({
                  pathname: '/match-congratulations',
                  params: {
                    userId,
                    userName: profileName,
                    userPhoto: imageArray.length > 0 ? imageArray[0] : '',
                  },
                });
              }
            }).catch((err: any) => {
              console.error('❌ Error checking match:', err);
            });
          }
        });
      }
    } catch (error) {
      console.error('❌ Error in handleLike:', error);
      // DO NOT remove card on exception
    }
    
    // Record profile view in background (non-blocking)
    recordProfileView(userId).catch((err) => {
      console.error('❌ Error recording profile view:', err);
    });
  };

  const handlePass = async () => {
    if (!userId || isProcessing) return;
    setIsProcessing(true);
    if (onPass) {
      onPass(userId);
    }

    // Run operations in background (don't wait)
    Promise.all([
      passUser(userId),
      recordProfileView(userId)
    ]).catch((error) => {
      console.error('❌ Exception in handlePass:', error);
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      <View style={styles.card}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={isOnline ? styles.profileRowOnline : styles.profileRow}>
              <Text style={styles.profileName}>{profileName}</Text>
              {isOnline ? (
                <>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.statusText, styles.onlineText]}>Online</Text>
                </>
              ) : (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.statusText}>{statusText || location}</Text>
                </>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* More Menu Dropdown */}
        {showMenu && (
          <>
            {/* Backdrop overlay - closes menu when touched */}
            <TouchableOpacity 
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
            <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                if (userId) {
                  router.push({
                    pathname: '/view-profile',
                    params: { userId },
                  });
                }
              }}
            >
              <Ionicons name="person-outline" size={16} color={Colors.textDark} />
              <Text style={styles.menuItemText}>View Profile</Text>
            </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  // Add report action here
                }}
              >
                <Ionicons name="flag-outline" size={16} color={Colors.textDark} />
                <Text style={styles.menuItemText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  if (userId) {
                    Alert.alert(
                      'Block User',
                      `Are you sure you want to block ${profileName}? You will no longer see them in your feed or matches.`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Block',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const { error } = await blockUser(userId);
                              if (error) {
                                Alert.alert('Error', 'Failed to block user. Please try again.');
                                return;
                              }
                              // Call the callback to remove from list
                              if (onBlock) {
                                onBlock(userId);
                              }
                              Alert.alert('Success', 'User blocked successfully');
                            } catch (error) {
                              Alert.alert('Error', 'An error occurred. Please try again.');
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="ban-outline" size={16} color={Colors.red} />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Block</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Post Images - Swiper */}
        {imageArray.length > 0 && (
          <View style={[styles.imageContainer, { width: contentWidth }]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={[styles.imageScrollView, { width: contentWidth }]}
            >
              {imageArray.map((photo, idx) => (
                <View key={idx} style={[styles.postImageWrapper, { width: contentWidth, height: contentWidth * 1.1 }]}>
                  <View style={styles.postImagePlaceholder} />
                  <ExpoImage
                    source={{ uri: photo }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              ))}
            </ScrollView>
            
            {/* Pagination Dots */}
            {imageArray.length > 1 && (
              <View style={styles.paginationContainer}>
                {imageArray.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            
            {/* Image Counter */}
            {imageArray.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {imageArray.length}
                </Text>
              </View>
            )}

            {/* Like overlay – center of image (flip: like on image, pass in bar) */}
            <View style={styles.imageOverlayButtons} pointerEvents={isProcessing ? 'none' : 'auto'}>
              <TouchableOpacity
                style={[styles.imageOverlayBtn, styles.imageOverlayBtnLike]}
                onPress={handleLike}
                disabled={isProcessing || !userId}
              >
                <Ionicons name="thumbs-up-outline" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pass (X) + Send Comment bar – hide when typing; same spot shows text field */}
        {!showCommentInput ? (
          <View style={styles.sendLikeBar} pointerEvents={isProcessing ? 'none' : 'auto'}>
            <TouchableOpacity
              style={styles.sendLikeCountPill}
              onPress={handlePass}
              disabled={isProcessing || !userId}
              activeOpacity={0.7}
            >
              <Text style={styles.passEmoji}>✌🏽</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendLikeButtonPill}
              onPress={() => setShowCommentInput(true)}
              disabled={isProcessing || !userId}
              activeOpacity={0.7}
            >
              <Text style={styles.sendLikeButtonText}>Send Comment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment…"
              placeholderTextColor={Colors.textLight}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              autoFocus
            />
            <View style={styles.commentInputActions}>
              <TouchableOpacity
                style={styles.commentInputCancel}
                onPress={() => {
                  setShowCommentInput(false);
                  setCommentText('');
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.commentInputCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commentInputSend, !commentText.trim() && styles.commentInputSendDisabled]}
                onPress={() => {
                  const text = commentText.trim();
                  if (!text) return;
                  onComment?.(text, userId);
                  setCommentText('');
                  setShowCommentInput(false);
                  Keyboard.dismiss();
                }}
                disabled={!commentText.trim()}
              >
                <Text style={styles.commentInputSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bio Section - Hinge Style (for prompt content blocks) */}
        {(bio || bio_title || postText) && (
          <View style={styles.bioContainer}>
            {bio_title && (
              <Text style={styles.bioTitle}>{bio_title}</Text>
            )}
            {bio && (
              <Text style={styles.bioText}>{bio}</Text>
            )}
            {/* Legacy support for postText */}
            {!bio && postText && (
              <Text style={styles.bioText}>{postText}</Text>
            )}
          </View>
        )}

        {/* Prompts Section - Hinge Style (only show if prompts array provided AND no bio_title to avoid duplication) */}
        {userPrompts && userPrompts.length > 0 && !bio_title && (
          <View style={styles.promptsContainer}>
            {userPrompts.map((prompt, index) => (
              <View key={index} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{prompt.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Profile details – ONE card: 1 row (Age, Orientation, Height, Location, Nationality, Education) + vertical list (icon + label + value) */}
        {(age != null && age > 0) || interested_in || height || location || education_level || (nationality && nationality.length > 0) || profession || looking_for ? (
          <View style={styles.profileDetailsCard}>
            {/* Top row: Age, Orientation, Height, Location, Nationality only (no Education) */}
            <View style={styles.profileDetailsRow}>
              {age != null && age > 0 && (
                <View style={styles.profileDetailsPill}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textDark} style={styles.profileDetailsRowIcon} />
                  <Text style={styles.profileDetailsRowText}>{age}</Text>
                </View>
              )}
              {interested_in ? (
                <View style={styles.profileDetailsPill}>
                  <Ionicons name="people-outline" size={16} color={Colors.textDark} style={styles.profileDetailsRowIcon} />
                  <Text style={styles.profileDetailsRowText} numberOfLines={1}>{interested_in}</Text>
                </View>
              ) : null}
              {height ? (
                <View style={styles.profileDetailsPill}>
                  <Ionicons name="resize-outline" size={16} color={Colors.textDark} style={styles.profileDetailsRowIcon} />
                  <Text style={styles.profileDetailsRowText}>{height} cm</Text>
                </View>
              ) : null}
              {location ? (
                <View style={styles.profileDetailsPill}>
                  <Ionicons name="location-outline" size={16} color={Colors.textDark} style={styles.profileDetailsRowIcon} />
                  <Text style={styles.profileDetailsRowText} numberOfLines={1}>{location}</Text>
                </View>
              ) : null}
              {nationality && nationality.length > 0 ? (
                <View style={styles.profileDetailsPill}>
                  <Ionicons name="earth-outline" size={16} color={Colors.textDark} style={styles.profileDetailsRowIcon} />
                  <Text style={styles.profileDetailsRowText} numberOfLines={1}>{nationality.join(', ')}</Text>
                </View>
              ) : null}
            </View>
            {/* Vertical list: icon + label + value (sida screenshot) */}
            <View style={styles.profileDetailsList}>
              {profession ? (
                <View style={styles.profileDetailsItem}>
                  <Ionicons name="briefcase-outline" size={20} color={Colors.textDark} style={styles.profileDetailsItemIcon} />
                  <Text style={styles.profileDetailsItemLabel}>Profession</Text>
                  <Text style={styles.profileDetailsItemValue}>{profession}</Text>
                </View>
              ) : null}
              {education_level ? (
                <View style={styles.profileDetailsItem}>
                  <Ionicons name="school-outline" size={20} color={Colors.textDark} style={styles.profileDetailsItemIcon} />
                  <Text style={styles.profileDetailsItemLabel}>Education</Text>
                  <Text style={styles.profileDetailsItemValue}>{education_level}</Text>
                </View>
              ) : null}
              {location ? (
                <View style={styles.profileDetailsItem}>
                  <Ionicons name="home-outline" size={20} color={Colors.textDark} style={styles.profileDetailsItemIcon} />
                  <Text style={styles.profileDetailsItemLabel}>Location</Text>
                  <Text style={styles.profileDetailsItemValue}>{location}</Text>
                </View>
              ) : null}
              {looking_for ? (
                <View style={styles.profileDetailsItem}>
                  <Ionicons name="search-outline" size={20} color={Colors.textDark} style={styles.profileDetailsItemIcon} />
                  <Text style={styles.profileDetailsItemLabel}>Looking for</Text>
                  <Text style={styles.profileDetailsItemValue}>{looking_for}</Text>
                </View>
              ) : null}
              {interested_in ? (
                <View style={styles.profileDetailsItem}>
                  <Ionicons name="people-outline" size={20} color={Colors.textDark} style={styles.profileDetailsItemIcon} />
                  <Text style={styles.profileDetailsItemLabel}>Orientation</Text>
                  <Text style={styles.profileDetailsItemValue}>{interested_in}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Section 7: Posts – dhamaan posts ee user-ka (soo aqriso profile kiisa) */}
        {userPosts.length > 0 && (
          <View style={styles.postsSection}>
            <View style={styles.postsList}>
              {userPosts.map((post) => {
                const imageUri = getPostImageUrl(post.image_url);
                return (
                  <View key={post.id} style={styles.userPostCard}>
                    {post.title ? (
                      <Text style={styles.userPostCardTitle}>{post.title}</Text>
                    ) : null}
                    {imageUri ? (
                      <View style={styles.userPostCardImageContainer}>
                        <ExpoImage
                          source={{ uri: imageUri }}
                          style={styles.userPostCardImage}
                          contentFit="cover"
                        />
                      </View>
                    ) : null}
                    {post.description ? (
                      <View style={styles.userPostCardDescriptionContainer}>
                        <Text style={styles.userPostCardDescription}>{post.description}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </View>
    </View>
  );
}

export const PostCard = React.memo(PostCardBase);

const styles = StyleSheet.create({
  container: {
  },
  titleContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  card: {
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  profileRowOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.iconLight,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50', // Green for online
    marginRight: 4,
    borderWidth: 1.5,
    borderColor: Colors.cardBackground,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '400',
  },
  onlineText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    padding: 4,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemText: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: Colors.red,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  imageScrollView: {
    flexGrow: 0,
  },
  postImageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  postImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.borderLight,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageOverlayButtons: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  imageOverlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  imageOverlayBtnLike: {
    backgroundColor: '#E8DAEF',
    borderColor: '#E8DAEF',
  },
  sendLikeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sendLikeCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#DAEFDA',
  },
  passEmoji: {
    fontSize: 22,
  },
  sendLikeButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#F4E4BC',
  },
  sendLikeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  commentInputRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  commentInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  commentInputCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  commentInputCancelText: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '500',
  },
  commentInputSend: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F4E4BC',
  },
  commentInputSendDisabled: {
    opacity: 0.5,
  },
  commentInputSendText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  bioContainer: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
  },
  bioTitle: {
    fontSize: 13,
    color: Colors.textDark,
    fontWeight: '400',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 32,
    color: Colors.textDark,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.5,
    fontFamily: 'serif',
  },
  postTextContainer: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  showMore: {
    color: Colors.textLight,
  },
  profileDetailsCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  profileDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  profileDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileDetailsRowIcon: {
    opacity: 0.85,
  },
  profileDetailsRowText: {
    fontSize: 15,
    color: Colors.textDark,
    fontWeight: '500',
  },
  profileDetailsList: {
    gap: 0,
  },
  profileDetailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileDetailsItemIcon: {
    marginRight: 12,
    opacity: 0.85,
  },
  profileDetailsItemLabel: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '500',
    flex: 1,
  },
  profileDetailsItemValue: {
    fontSize: 15,
    color: Colors.textDark,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
  },
  postsSection: {
    marginBottom: 12,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  postsList: {
    gap: 12,
  },
  userPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 0,
  },
  userPostCardTitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userPostCardImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.borderLight,
  },
  userPostCardImage: {
    width: '100%',
    height: '100%',
  },
  userPostCardDescriptionContainer: {
    padding: 16,
  },
  userPostCardDescription: {
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 22,
  },
  promptsContainer: {
    marginBottom: 12,
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  promptQuestion: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '400',
    marginBottom: 8,
  },
  promptAnswer: {
    fontSize: 20,
    color: Colors.textDark,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
});

