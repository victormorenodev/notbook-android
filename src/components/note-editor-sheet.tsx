import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Page } from '@/types/note';
import { extractPlainText, textToTiptapDoc } from '@/utils/tiptap';

interface NoteEditorSheetProps {
  page: Page;
  width: number;
  onSave: (id: string, updates: { title?: string; content?: string }) => void;
}

function formatNoteDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NoteEditorSheet({ page, width, onSave }: NoteEditorSheetProps) {
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(() => extractPlainText(page.content));

  useEffect(() => {
    setTitle(page.title);
    setBody(extractPlainText(page.content));
  }, [page.id, page.content, page.title]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onSave(page.id, { title: newTitle });
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    onSave(page.id, { content: textToTiptapDoc(newBody) });
  };

  return (
    <View style={[styles.container, { width }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

          <TextInput
            value={body}
            onChangeText={handleBodyChange}
            placeholder="Start typing your note..."
            placeholderTextColor="#9CA3AF"
            style={styles.bodyInput}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
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
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
    padding: 0,
    minHeight: 300,
  },
});
