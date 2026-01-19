import { AppHeader } from '@/components/app-header';
import { PostCard } from '@/components/post-card';
import { Colors } from '@/constants/theme';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const handleShare = () => {
    console.log('Share pressed');
  };

  const handleComment = () => {
    console.log('Comment pressed');
  };

  const handleNotification = () => {
    console.log('Notification pressed');
  };

  const handleInvite = () => {
    console.log('Invite pressed');
  };

  const handleSearch = (text: string) => {
    console.log('Search:', text);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        onNotificationPress={handleNotification}
        onSharePress={handleShare}
        onInvitePress={handleInvite}
        onSearch={handleSearch}
        showNotificationDot={true}
        showShareDot={true}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <PostCard
          profileName="Jake"
          location="Austin"
          username="DarlingDaisy"
          timeAgo="32m"
          postImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
          postText="We went on 3 dates and then he just disappeared on me. I slept with him which I'm now regretting. Should I reach out or just move on?"
          commentCount={32}
          onShare={handleShare}
          onComment={handleComment}
        />
        
        <PostCard
          profileName="Sarah"
          location="Los Angeles"
          username="CityGirl23"
          timeAgo="1h"
          postImage="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop"
          postText="Met someone amazing but he's always busy with work. Is it worth waiting for someone who can't make time for you? I'm starting to doubt if he's really interested."
          commentCount={45}
          onShare={handleShare}
          onComment={handleComment}
        />
        
        <PostCard
          profileName="Mike"
          location="Chicago"
          username="WindyCityMike"
          timeAgo="2h"
          postImage="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
          postText="Dating in 2024 is so confusing. Everyone seems to want something different. How do you know if someone is genuinely interested or just playing games?"
          commentCount={67}
          onShare={handleShare}
          onComment={handleComment}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
  },
});
