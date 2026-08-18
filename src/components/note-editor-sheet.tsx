import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormattingToolbar } from '@/components/formatting-toolbar';
import { Page } from '@/types/note';
import { extractPlainText, textToTiptapDoc } from '@/utils/tiptap';

interface NoteEditorSheetProps {
  page: Page;
  width: number;
  onSave: (id: string, updates: { title?: string; content?: string }) => void;
}

const ACCESSORY_VIEW_ID = 'noteFormattingAccessory';

function formatNoteDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Inserts or toggles a formatting prefix (e.g. "[ ] ") at the start of the active line.
 */
function insertPrefixAtCurrentLine(
  text: string,
  cursorPosition: number,
  prefix: string
): string {
  const safePosition = Math.max(0, Math.min(cursorPosition, text.length));
  const lineStart = text.lastIndexOf('\n', Math.max(0, safePosition - 1)) + 1;
  const lineEnd = text.indexOf('\n', lineStart);
  const currentLine = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

  // If the line already starts with this exact prefix, toggle it off
  if (currentLine.startsWith(prefix)) {
    const toggledLine = currentLine.slice(prefix.length);
    const before = text.slice(0, lineStart);
    const after = lineEnd === -1 ? '' : text.slice(lineEnd);
    return `${before}${toggledLine}${after}`;
  }

  // Otherwise, insert the prefix
  const before = text.slice(0, lineStart);
  const after = text.slice(lineStart);
  return `${before}${prefix}${after}`;
}

/**
 * Checks if the difference between prevText and nextText is specifically an inserted newline.
 */
function isNewlineAddition(prevText: string, nextText: string): boolean {
  if (nextText.length !== prevText.length + 1) {
    return false;
  }
  for (let i = 0; i < prevText.length; i++) {
    if (prevText[i] !== nextText[i]) {
      return nextText[i] === '\n';
    }
  }
  return nextText.endsWith('\n');
}

/**
 * Handles Smart Enter behavior ONLY when a newline is actively pressed.
 */
function applySmartEnter(prevText: string, nextText: string): string {
  if (!isNewlineAddition(prevText, nextText)) {
    return nextText;
  }

  const lines = nextText.split('\n');
  const prevLineIndex = lines.length - 2;
  const prevLine = lines[prevLineIndex]?.trim() || '';

  // Empty checklist item -> exit checklist mode
  if (/^(\-\s+)?\[( |x|X)\]\s*$/.test(prevLine)) {
    lines[prevLineIndex] = '';
    return lines.join('\n');
  }

  // Active checklist item -> continue checklist
  if (/^(\-\s+)?\[( |x|X)\]\s+/.test(prevLine)) {
    lines[lines.length - 1] = `[ ] ${lines[lines.length - 1]}`;
    return lines.join('\n');
  }

  // Empty bullet item -> exit bullet mode
  if (/^(\•|\-|\*)\s*$/.test(prevLine)) {
    lines[prevLineIndex] = '';
    return lines.join('\n');
  }

  // Active bullet item -> continue bullet list
  if (/^(\•|\-|\*)\s+/.test(prevLine)) {
    lines[lines.length - 1] = `• ${lines[lines.length - 1]}`;
    return lines.join('\n');
  }

  // Numbered list item -> auto-increment next number
  const matchNum = prevLine.match(/^(\d+)\.\s+/);
  if (matchNum) {
    const nextNum = parseInt(matchNum[1], 10) + 1;
    lines[lines.length - 1] = `${nextNum}. ${lines[lines.length - 1]}`;
    return lines.join('\n');
  }

  return nextText;
}

/**
 * Distraction-free single note editor sheet with rich text formatting and smart lists.
 */
export function NoteEditorSheet({ page, width, onSave }: NoteEditorSheetProps) {
  const insets = useSafeAreaInsets();
  const bodyInputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(() => extractPlainText(page.content));
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const activeNoteIdRef = useRef(page.id);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state only when switching to a different note ID
  useEffect(() => {
    if (activeNoteIdRef.current !== page.id) {
      activeNoteIdRef.current = page.id;
      setTitle(page.title);
      setBody(extractPlainText(page.content));
    }
  }, [page.id, page.content, page.title]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scheduleSave = useCallback(
    (newTitle: string, newBody: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSave(page.id, {
          title: newTitle,
          content: textToTiptapDoc(newBody),
        });
      }, 350);
    },
    [onSave, page.id]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    scheduleSave(newTitle, body);
  };

  const handleBodyChange = (rawBody: string) => {
    const smartBody = applySmartEnter(body, rawBody);
    setBody(smartBody);
    scheduleSave(title, smartBody);
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setSelection(e.nativeEvent.selection);
  };

  const handleInsertFormat = (prefix: string) => {
    const updated = insertPrefixAtCurrentLine(body, selection.start, prefix);
    setBody(updated);
    scheduleSave(title, updated);
  };

  return (
    <View style={[styles.container, { width }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
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
            ref={bodyInputRef}
            value={body}
            onChangeText={handleBodyChange}
            onSelectionChange={handleSelectionChange}
            placeholder="Start typing your note..."
            placeholderTextColor="#9CA3AF"
            style={styles.bodyInput}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_VIEW_ID : undefined}
          />
        </ScrollView>

        {/* Android Keyboard Accessory */}
        {Platform.OS === 'android' && isKeyboardVisible && (
          <FormattingToolbar
            onInsertChecklist={() => handleInsertFormat('[ ] ')}
            onInsertBullet={() => handleInsertFormat('• ')}
            onInsertNumbered={() => handleInsertFormat('1. ')}
            onInsertHeading={() => handleInsertFormat('## ')}
          />
        )}
      </KeyboardAvoidingView>

      {/* iOS Native Keyboard Accessory View */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_VIEW_ID}>
          <FormattingToolbar
            onInsertChecklist={() => handleInsertFormat('[ ] ')}
            onInsertBullet={() => handleInsertFormat('• ')}
            onInsertNumbered={() => handleInsertFormat('1. ')}
            onInsertHeading={() => handleInsertFormat('## ')}
          />
        </InputAccessoryView>
      )}
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
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
    padding: 0,
    minHeight: 300,
  },
});
