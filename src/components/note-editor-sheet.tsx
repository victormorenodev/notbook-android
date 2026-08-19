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
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

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
  const editorRef = useRef<any>(null);

  // We need to safely parse the initial content. If it's valid JSON (Tiptap format), use the object.
  // Otherwise, use it as a raw string.
  const getInitialContent = (content: string) => {
    if (!content) return '';
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  };

  const scheduleSave = useCallback(
    (newTitle: string, newContentJson?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const updates: Partial<Page> = { title: newTitle };
        if (newContentJson !== undefined) {
          updates.content = newContentJson;
        }
        onSave(page.id, updates);
      }, 500);
    },
    [onSave, page.id]
  );

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: getInitialContent(page.content),
    onChange: () => {
      if (editorRef.current) {
        editorRef.current.getJSON().then((json: any) => {
          // Use a ref to get the most up-to-date title during save
          scheduleSave(titleRef.current, JSON.stringify(json));
        });
      }
    },
  });
  
  editorRef.current = editor;

  // We need a ref for title so the onChange closure can read the latest title
  const titleRef = useRef(title);
  titleRef.current = title;

  // Sync state when switching to a different note ID
  useEffect(() => {
    if (activeNoteIdRef.current !== page.id) {
      activeNoteIdRef.current = page.id;
      setTitle(page.title);
      titleRef.current = page.title;
      editor.setContent(getInitialContent(page.content));
    }
  }, [page.id, page.content, page.title, editor]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    scheduleSave(newTitle);
  };

  return (
    <SafeAreaView style={[styles.container, { width }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Text style={styles.dateStamp}>
            {formatNoteDate ? formatNoteDate(page.updated_at) : page.updated_at}
          </Text>
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
            style={styles.titleInput}
            multiline={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.editorWrapper}>
          <RichText editor={editor} />
        </View>

        <Toolbar editor={editor} />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  editorWrapper: {
    flex: 1,
    paddingHorizontal: 24,
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
    marginBottom: 0, // removed bottom margin since editorWrapper handles spacing
    padding: 0,
  },
});
