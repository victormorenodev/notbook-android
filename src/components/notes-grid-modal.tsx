import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoteThumbnailCard } from '@/components/note-thumbnail-card';
import { Page } from '@/types/note';

interface NotesGridModalProps {
  visible: boolean;
  pages: Page[];
  activeIndex: number;
  onSelectPage: (index: number) => void;
  onClose: () => void;
}

const TARGET_CARD_WIDTH = 180;
const HORIZONTAL_PADDING = 24;
const COLUMN_GAP = 10;

/**
 * Responsive overview grid modal that scales smoothly from phones to large tablets.
 */
export function NotesGridModal({
  visible,
  pages,
  activeIndex,
  onSelectPage,
  onClose,
}: NotesGridModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Calculate dynamic column count: 2 on portrait phones, 3-5 on tablets
  const numColumns = Math.max(
    2,
    Math.floor((width - HORIZONTAL_PADDING) / TARGET_CARD_WIDTH)
  );

  // Exact card width so all items on all rows are identical
  const cardWidth =
    (width - HORIZONTAL_PADDING - (numColumns - 1) * COLUMN_GAP) / numColumns;

  const handleCardPress = (index: number) => {
    onSelectPage(index);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>All Notes</Text>
            <Text style={styles.subtitle}>
              {pages.length} {pages.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.doneButton} hitSlop={12}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Responsive Grid */}
        <FlatList
          key={`grid-cols-${numColumns}`}
          data={pages}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={[styles.columnWrapper, { gap: COLUMN_GAP }]}
          contentContainerStyle={[styles.gridContent, { gap: COLUMN_GAP }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NoteThumbnailCard
              page={item}
              index={index}
              cardWidth={cardWidth}
              isActive={index === activeIndex}
              onPress={handleCardPress}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEFCE8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CA8A04',
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
});
