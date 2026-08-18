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
import { NoteBodyView } from '@/components/note-body-view';
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
 * Returns the index where a single newline was inserted, or -1 if the change
 * is not a single newline insertion.
 */
function findNewlineInsertionIndex(prevText: string, nextText: string): number {
  if (nextText.length !== prevText.length + 1) {
    return -1;
  }
  for (let i = 0; i < prevText.length; i++) {
    if (prevText[i] !== nextText[i]) {
      return nextText[i] === '\n' ? i : -1;
    }
  }
  return nextText[nextText.length - 1] === '\n' ? nextText.length - 1 : -1;
}

/**
 * Extracts the line content from `text` that contains the character at `index`.
 * Returns { lineStart, lineContent }.
 */
function getLineAt(text: string, index: number): { lineStart: number; content: string } {
  const lineStart = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const lineEnd = text.indexOf('\n', index);
  const content = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return { lineStart, content };
}

/** Matches a checklist prefix like "[ ] " or "- [x] " */
const CHECKLIST_ACTIVE = /^(-\s+)?\[( |x|X)\]\s+/;
const CHECKLIST_EMPTY = /^(-\s+)?\[( |x|X)\]\s*$/;

/** Matches a bullet prefix like "• " or "- " or "* " */
const BULLET_ACTIVE = /^[•\-*]\s+/;
const BULLET_EMPTY = /^[•\-*]\s*$/;

/** Matches a numbered list prefix like "1. " */
const NUMBERED_ACTIVE = /^(\d+)\.\s+/;

/**
 * Handles Smart Enter behavior ONLY when a newline is actively pressed.
 * Finds the actual insertion point and continues or exits the list on that line.
 */
function applySmartEnter(prevText: string, nextText: string): string {
  const newlineIndex = findNewlineInsertionIndex(prevText, nextText);
  if (newlineIndex === -1) {
    return nextText;
  }

  // The line BEFORE the newline is the one that was just split
  const prevLine = getLineAt(nextText, newlineIndex);
  const prevContent = prevLine.content.trim();

  // The new (empty or partial) line starts right after the '\n'
  const newLineStart = newlineIndex + 1;

  // Empty checklist item -> exit checklist mode (clear the prefix)
  if (CHECKLIST_EMPTY.test(prevContent)) {
    return nextText.slice(0, prevLine.lineStart) + nextText.slice(newlineIndex);
  }

  // Active checklist item -> continue checklist on new line
  if (CHECKLIST_ACTIVE.test(prevContent)) {
    return nextText.slice(0, newLineStart) + '[ ] ' + nextText.slice(newLineStart);
  }

  // Empty bullet item -> exit bullet mode
  if (BULLET_EMPTY.test(prevContent)) {
    return nextText.slice(0, prevLine.lineStart) + nextText.slice(newlineIndex);
  }

  // Active bullet item -> continue bullet list
  if (BULLET_ACTIVE.test(prevContent)) {
    return nextText.slice(0, newLineStart) + '• ' + nextText.slice(newLineStart);
  }

  // Numbered list item -> auto-increment next number
  const matchNum = prevContent.match(NUMBERED_ACTIVE);
  if (matchNum) {
    const nextNum = parseInt(matchNum[1], 10) + 1;
    return nextText.slice(0, newLineStart) + `${nextNum}. ` + nextText.slice(newLineStart);
  }

  return nextText;
}

/**
 * Toggles a checkbox on the specified line between checked [x] and unchecked [ ].
 * Returns the text unchanged if the line is not a checklist item.
 */
function toggleCheckboxAtLine(text: string, lineIndex: number): string {
  const lines = text.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return text;

  const line = lines[lineIndex];

  if (/^(-\s+)?\[ \]/.test(line)) {
    lines[lineIndex] = line.replace('[ ]', '[x]');
    return lines.join('\n');
  }

  if (/^(-\s+)?\[[xX]\]/.test(line)) {
    lines[lineIndex] = line.replace(/\[[xX]\]/, '[ ]');
    return lines.join('\n');
  }

  return text;
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
  const [isBodyFocused, setIsBodyFocused] = useState(false);

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
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      bodyInputRef.current?.blur();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Focus the body TextInput when entering edit mode from read mode
  useEffect(() => {
    if (isBodyFocused) {
      setTimeout(() => bodyInputRef.current?.focus(), 50);
    }
  }, [isBodyFocused]);

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

  const handleToggleCheckbox = (lineIndex: number) => {
    const updated = toggleCheckboxAtLine(body, lineIndex);
    setBody(updated);
    scheduleSave(title, updated);
  };

  const handleTapBody = () => {
    setIsBodyFocused(true);
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

          {isBodyFocused || body.length === 0 ? (
            <TextInput
              ref={bodyInputRef}
              value={body}
              onChangeText={handleBodyChange}
              onSelectionChange={handleSelectionChange}
              onBlur={() => setIsBodyFocused(false)}
              placeholder="Start typing your note..."
              placeholderTextColor="#9CA3AF"
              style={styles.bodyInput}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_VIEW_ID : undefined}
            />
          ) : (
            <NoteBodyView
              body={body}
              onToggleCheckbox={handleToggleCheckbox}
              onTapBody={handleTapBody}
            />
          )}
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
