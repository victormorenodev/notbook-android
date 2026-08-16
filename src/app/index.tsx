import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoteEditorSheet } from '@/components/note-editor-sheet';
import { NotesGridModal } from '@/components/notes-grid-modal';
import { useCreatePage, useDeletePage, usePages, useUpdatePage } from '@/hooks/use-pages';
import { Page } from '@/types/note';

/**
 * Main application screen implementing the Apple Notes-style swipe carousel and grid overview.
 */
export default function NotesCarouselScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Page>>(null);

  const { data: pages = [], isLoading } = usePages();
  const { mutateAsync: createPage } = useCreatePage();
  const { mutateAsync: updatePage } = useUpdatePage();
  const { mutateAsync: deletePage } = useDeletePage();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const isInitializingRef = useRef(false);

  // Initialize with a blank note if the database is completely empty
  useEffect(() => {
    if (!isLoading && pages.length === 0 && !isInitializingRef.current) {
      isInitializingRef.current = true;
      createPage({ input: { title: '' } }).finally(() => {
        isInitializingRef.current = false;
      });
    }
  }, [isLoading, pages.length, createPage]);

  const scrollToPage = useCallback((index: number) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleCreateNewPage = useCallback(async () => {
    const currentPage = pages[activeIndex];
    const afterPos = currentPage ? currentPage.position : undefined;
    const newPage = await createPage({
      input: { title: '' },
      afterPosition: afterPos,
    });

    const targetIndex = activeIndex + 1;
    setTimeout(() => {
      scrollToPage(Math.min(targetIndex, pages.length));
    }, 80);
    return newPage;
  }, [activeIndex, createPage, pages, scrollToPage]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / width);

      if (newIndex >= pages.length) {
        handleCreateNewPage();
        return;
      }

      if (newIndex < 0 && pages.length > 1) {
        scrollToPage(pages.length - 1);
        return;
      }

      setActiveIndex(Math.max(0, Math.min(newIndex, pages.length - 1)));
    },
    [handleCreateNewPage, pages.length, scrollToPage, width]
  );

  const handlePreviousPage = useCallback(() => {
    if (pages.length <= 1) return;
    const targetIndex = activeIndex === 0 ? pages.length - 1 : activeIndex - 1;
    scrollToPage(targetIndex);
  }, [activeIndex, pages.length, scrollToPage]);

  const handleNextPage = useCallback(() => {
    if (activeIndex === pages.length - 1) {
      handleCreateNewPage();
      return;
    }
    scrollToPage(activeIndex + 1);
  }, [activeIndex, handleCreateNewPage, pages.length, scrollToPage]);

  const handleDeleteCurrentPage = useCallback(async () => {
    if (pages.length === 0) return;
    const currentPage = pages[activeIndex];
    if (!currentPage) return;

    await deletePage(currentPage.id);
    const nextIndex = Math.max(0, activeIndex - 1);
    setActiveIndex(nextIndex);
  }, [activeIndex, deletePage, pages]);

  const handleSaveNote = useCallback(
    (id: string, updates: { title?: string; content?: string }) => {
      updatePage({ id, input: updates });
    },
    [updatePage]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteEditorSheet page={item} width={width} onSave={handleSaveNote} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Overview Grid Modal */}
      <NotesGridModal
        visible={isGridVisible}
        pages={pages}
        activeIndex={activeIndex}
        onSelectPage={scrollToPage}
        onClose={() => setIsGridVisible(false)}
      />

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleDeleteCurrentPage}
          style={styles.barButton}
          hitSlop={12}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePreviousPage} hitSlop={12}>
          <Text style={styles.navIndicatorText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsGridVisible(true)}
          style={styles.pageCounterButton}
          hitSlop={12}
        >
          <Text style={styles.pageCounterText}>
            {pages.length > 0 ? `${activeIndex + 1} of ${pages.length}` : 'New Note'}
          </Text>
          <Text style={styles.gridIconText}> ⊞</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextPage} hitSlop={12}>
          <Text style={styles.navIndicatorText}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCreateNewPage}
          style={styles.barButton}
          hitSlop={12}
        >
          <Text style={styles.newButtonText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  barButton: {
    padding: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  pageCounterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  pageCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  gridIconText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },
  navIndicatorText: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  newButtonText: {
    fontSize: 20,
    color: '#EAB308',
    fontWeight: '700',
  },
});
