import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  title?: string;
  profileName: string;
  location: string;
  username: string;
  timeAgo: string;
  profileImage?: string;
  postImage?: string;
  photos?: string[]; // Array of photos for swiper
  postText: string;
  nationality?: string[]; // Array of nationalities
  commentCount?: number;
  onShare?: () => void;
  onComment?: () => void;
}

export function PostCard({
  title,
  profileName,
  location,
  username,
  timeAgo,
  profileImage,
  postImage,
  photos,
  postText,
  nationality,
  commentCount = 0,
  onShare,
  onComment,
}: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  
  // Use photos array if provided, otherwise fallback to postImage
  const imageArray = photos && photos.length > 0 ? photos : (postImage ? [postImage] : []);
  
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH - 64; // Account for padding
    const index = Math.round(contentOffsetX / cardWidth);
    setCurrentImageIndex(index);
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
            <View style={styles.profileRow}>
              <Text style={styles.profileName}>{profileName}</Text>
              <View style={styles.dot} />
              <Text style={styles.location}>{location}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
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
                  // Add view profile action here
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
                  // Add block action here
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
          <TouchableOpacity style={[styles.actionButton, styles.likeButton]}>
            <Ionicons name="heart" size={14} color={Colors.green} />
            <Text style={[styles.actionButtonText, styles.likeButtonText]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.passButton]}>
            <Ionicons name="close" size={14} color={Colors.red} />
            <Text style={[styles.actionButtonText, styles.passButtonText]}>Pass</Text>
          </TouchableOpacity>
        </View>

        {/* Post Text */}
        <View style={styles.postTextContainer}>
          <Text style={styles.postText}>
            {postText}
            {postText.length > 100 && (
              <Text style={styles.showMore}> Show more</Text>
            )}
          </Text>
          
          {/* Nationality */}
          {nationality && nationality.length > 0 && (
            <View style={styles.nationalityContainer}>
              <Ionicons name="flag" size={14} color={Colors.textLight} style={styles.nationalityIcon} />
              <Text style={styles.nationalityText}>
                {nationality.join(', ')}
              </Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    backgroundColor: Colors.cardBackground,
    borderRadius: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.iconLight,
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
  username: {
    fontSize: 14,
    color: Colors.textLight,
  },
  timeAgo: {
    fontSize: 14,
    color: Colors.textLight,
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
    borderRadius: 12,
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
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageScrollView: {
    width: SCREEN_WIDTH - 64, // Account for card padding (16*2) + margin (16*2)
  },
  postImage: {
    width: SCREEN_WIDTH - 64,
    height: 400,
    resizeMode: 'cover',
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
    borderRadius: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    fontSize: 12,
    fontWeight: '600',
  },
  likeButtonText: {
    color: Colors.green,
  },
  passButtonText: {
    color: Colors.red,
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
  nationalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nationalityIcon: {
    marginRight: 6,
  },
  nationalityText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
});

