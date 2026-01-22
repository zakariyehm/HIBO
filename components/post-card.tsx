import { MatchPopup } from '@/components/MatchPopup';
import { Colors } from '@/constants/theme';
import { blockUser, checkForMatch, getUserStatus, likeUser, passUser, recordProfileView, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  commentCount?: number;
  userId?: string; // User ID for profile navigation
  onShare?: () => void;
  onComment?: () => void;
  onLike?: (userId: string) => void; // Callback when user is liked
  onPass?: (userId: string) => void; // Callback when user is passed
  onBlock?: (userId: string) => void; // Callback when user is blocked
}

export function PostCard({
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
  commentCount = 0,
  userId,
  onShare,
  onComment,
  onLike,
  onPass,
  onBlock,
}: PostCardProps) {
  const { text: statusText, isOnline } = getUserStatus(lastActive);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Single state for both actions
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  
  // Use photos array if provided, otherwise fallback to postImage
  const imageArray = photos && photos.length > 0 ? photos : (postImage ? [postImage] : []);
  
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH;
    const index = Math.round(contentOffsetX / cardWidth);
    setCurrentImageIndex(index);
  };

  const handleLike = async () => {
    if (!userId || isProcessing) return;
    setIsProcessing(true);

    // OPTIMISTIC UPDATE - Remove card immediately (like Tinder - instant!)
    if (onLike) {
      onLike(userId);
    }

    // Run operations in background (don't wait)
    Promise.all([
      likeUser(userId),
      recordProfileView(userId)
    ]).then(([likeResult]) => {
      if (likeResult.error) {
        console.error('❌ Error liking user:', likeResult.error);
        return;
      }

      // Check for match in background (don't block UI)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && userId) {
          checkForMatch(session.user.id, userId).then((matchResult: any) => {
            if (matchResult.data) {
              // console.log('🎉 MATCH FOUND!');
              setShowMatchPopup(true);
            }
          }).catch((err: any) => {
            console.error('❌ Error checking match:', err);
          });
        }
      });
    }).catch((error) => {
      console.error('❌ Exception in handleLike:', error);
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const handlePass = async () => {
    if (!userId || isProcessing) return;
    setIsProcessing(true);

    // OPTIMISTIC UPDATE - Remove card immediately (like Tinder - instant!)
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
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.imageScrollView}
            >
              {imageArray.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.postImage}
                />
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
          </View>
        )}

        {/* Action Buttons - Like & Pass */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton, isProcessing && styles.actionButtonDisabled]}
            onPress={handleLike}
            disabled={isProcessing || !userId}
          >
            <Ionicons name="heart" size={12} color={Colors.green} />
            <Text style={[styles.actionButtonText, styles.likeButtonText]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.passButton, isProcessing && styles.actionButtonDisabled]}
            onPress={handlePass}
            disabled={isProcessing || !userId}
          >
            <Ionicons name="close" size={12} color={Colors.red} />
            <Text style={[styles.actionButtonText, styles.passButtonText]}>Pass</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section - Hinge Style */}
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

      </View>

      {/* Match Popup */}
      <MatchPopup
        visible={showMatchPopup}
        matchedUserName={profileName}
        matchedUserPhoto={imageArray.length > 0 ? imageArray[0] : undefined}
        onClose={() => {
          // console.log('🚪 Closing match popup - removing card');
          setShowMatchPopup(false);
          // Remove card after popup closes
          if (onLike && userId) {
            onLike(userId);
          }
        }}
        onViewMatch={() => {
          // console.log('👀 View match pressed - removing card');
          setShowMatchPopup(false);
          // Remove card after navigating
          if (onLike && userId) {
            onLike(userId);
          }
          router.push('/(tabs)/match');
        }}
      />
    </View>
  );
}

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
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  imageScrollView: {
    width: SCREEN_WIDTH,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: 500,
    resizeMode: 'cover',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#000000',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  actionButton: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  likeButton: {
    borderColor: Colors.green,
    backgroundColor: '#F0FDF4',
  },
  passButton: {
    borderColor: Colors.red,
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  likeButtonText: {
    color: Colors.green,
  },
  passButtonText: {
    color: Colors.red,
  },
  actionButtonDisabled: {
    opacity: 0.5,
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
});

