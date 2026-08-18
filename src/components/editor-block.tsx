import React, { useRef } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { EditorBlock } from '@/types/block';

interface EditorBlockProps {
  block: EditorBlock;
  onChangeText: (id: string, text: string) => void;
  onToggleCheck: (id: string) => void;
  onKeyPress?: (e: NativeSyntheticEvent<TextInputKeyPressEventData>, id: string) => void;
}

/** Rounded checkbox square — yellow fill with white checkmark when checked. */
function CheckboxIcon({ checked }: { checked: boolean }): React.ReactElement {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

/**
 * Renders a single block in the editor (e.g., a checklist item, a paragraph, a heading).
 * Mixes interactive UI elements (like the checkbox) with a TextInput for seamless editing.
 */
export function EditorBlockComponent({
  block,
  onChangeText,
  onToggleCheck,
  onKeyPress,
}: EditorBlockProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    onChangeText(block.id, text);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (onKeyPress) {
      onKeyPress(e, block.id);
    }
  };

  const textInputStyle = [
    styles.textInput,
    block.type === 'heading' && styles.headingText,
    block.type === 'checklist' && block.checked && styles.checkedText,
  ];

  const renderPrefix = () => {
    switch (block.type) {
      case 'checklist':
        return (
          <Pressable
            onPress={() => onToggleCheck(block.id)}
            hitSlop={6}
            style={styles.checkboxHitArea}
          >
            <CheckboxIcon checked={!!block.checked} />
          </Pressable>
        );
      case 'bullet':
        return <Text style={styles.prefixText}>{'•  '}</Text>;
      case 'numbered':
        return <Text style={styles.prefixText}>{`${block.number}. `}</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.blockRow}>
      {renderPrefix()}
      <TextInput
        ref={inputRef}
        value={block.content}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        multiline
        scrollEnabled={false}
        style={textInputStyle}
        placeholder={block.type === 'paragraph' ? "Start typing..." : ""}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 26,
    marginBottom: Platform.OS === 'ios' ? 4 : 0, // slight spacing
  },
  textInput: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
    flex: 1,
    padding: 0, // Strip default RN padding
    textAlignVertical: 'top',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  prefixText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: Platform.OS === 'ios' ? 0 : 2, // Align with text
  },
  headingText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700',
    color: '#111827',
  },
  checkboxHitArea: {
    paddingRight: 10,
    paddingTop: Platform.OS === 'ios' ? 2 : 4,
    paddingBottom: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EAB308',
    borderColor: '#EAB308',
  },
  checkmark: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -1,
  },
});
