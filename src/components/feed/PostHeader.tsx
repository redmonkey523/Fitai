import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Avatar from '../Avatar';

type Author = {
  id: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  badges?: { coach?: boolean; verified?: boolean };
};

type Props = {
  author: Author;
  createdAt?: string | number | Date;
  location?: string | null;
  onPressAuthor?: (id: string) => void;
  size?: number;
};

const Subtle = '#9CA3AF';

export default function PostHeader({ author, createdAt, location, onPressAuthor, size = 40 }: Props) {
  const date = createdAt ? new Date(createdAt) : null;
  const timeAgo = date ? formatTimeAgo(date) : '';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => author?.id && onPressAuthor && onPressAuthor(author.id)}>
        <Avatar uri={author?.avatarUrl || undefined} size={size} verified={Boolean(author?.badges?.verified || author?.badges?.coach)} ring />
      </TouchableOpacity>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <TouchableOpacity onPress={() => author?.id && onPressAuthor && onPressAuthor(author.id)}>
          <Text style={{ color: '#E5E7EB', fontWeight: '600' }} numberOfLines={1}>
            {author?.displayName || author?.username || 'User'}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: Subtle, fontSize: 12 }} numberOfLines={1}>
          {author?.username ? `@${author.username}` : ''}{author?.username && (timeAgo || location) ? ' • ' : ''}{location || timeAgo}
        </Text>
      </View>
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date().getTime();
  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}


