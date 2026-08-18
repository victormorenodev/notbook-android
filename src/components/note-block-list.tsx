import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { EditorBlock } from '@/types/block';
import { EditorBlockComponent } from '@/components/editor-block';

interface NoteBlockListProps {
  blocks: EditorBlock[];
  onChangeBlock: (id: string, newContent: string) => void;
  onToggleCheck: (id: string) => void;
  onFocusLast?: () => void;
}

/**
 * Renders the entire note body as a sequence of interactive blocks.
 * Replaces the single giant TextInput.
 */
export function NoteBlockList({
  blocks,
  onChangeBlock,
  onToggleCheck,
  onFocusLast,
}: NoteBlockListProps) {
  return (
    <Pressable 
      style={styles.container} 
      onPress={onFocusLast} 
      // If the user taps empty space below the blocks, we focus the last block
    >
      {blocks.map((block) => (
        <EditorBlockComponent
          key={block.id}
          block={block}
          onChangeText={onChangeBlock}
          onToggleCheck={onToggleCheck}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
    flexGrow: 1,
  },
});
