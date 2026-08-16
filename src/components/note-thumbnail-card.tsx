import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Page } from '@/types/note';
import { extractPlainText } from '@/utils/tiptap';

interface NoteThumbnailCardProps {
  page: Page;
  index: number;
  isActive: boolean;
  cardWidth?: number;
  onPress: (index: number) => void;
}

function formatThumbnailDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Renders a compact thumbnail card of a note for the overview grid.
 */
export function NoteThumbnailCard({
  page,
  index,
  isActive,
  cardWidth,
  onPress,
}: NoteThumbnailCardProps) {
  const previewText = extractPlainText(page.content);
  const displayTitle = page.title.trim() || 'Untitled Note';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(index)}
      style={[
        styles.card,
        cardWidth ? { width: cardWidth } : null,
        isActive && styles.activeCard,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.indexBadge}>#{index + 1}</Text>
        <Text style={styles.dateText}>{formatThumbnailDate(page.updated_at)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {displayTitle}
      </Text>

      <Text style={styles.preview} numberOfLines={4}>
        {previewText || 'No additional text'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  activeCard: {
    borderColor: '#EAB308',
    borderWidth: 2,
    backgroundColor: '#FEFCE8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  preview: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
});
