import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Page } from '@/types/note';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
function formatNoteDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
interface NoteEditorSheetProps {
  page: Page;
  width: number;
  onSave: (pageId: string, updates: Partial<Page>) => void;
}

export function NoteEditorSheet({ page, width, onSave }: NoteEditorSheetProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(page.title);
  const activeNoteIdRef = useRef(page.id);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync title when switching to a different note ID
  useEffect(() => {
    if (activeNoteIdRef.current !== page.id) {
      activeNoteIdRef.current = page.id;
      setTitle(page.title);
    }
  }, [page.id, page.title]);

  const scheduleSave = useCallback(
    (newTitle: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSave(page.id, {
          title: newTitle,
        });
      }, 350);
    },
    [onSave, page.id]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    scheduleSave(newTitle);
  };

  return (
    <SafeAreaView style={[styles.container, { width }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <Text style={styles.dateStamp}>{formatNoteDate(page.updated_at)}</Text>
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
            style={styles.titleInput}
            multiline={false}
            returnKeyType="next"
          />
          {/* WebView Editor will go here in Step 3 */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateStamp: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    padding: 0,
  },
});
