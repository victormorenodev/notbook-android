import React from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface FormattingToolbarProps {
  onInsertChecklist: () => void;
  onInsertBullet: () => void;
  onInsertNumbered: () => void;
  onInsertHeading: () => void;
}

/**
 * Apple Notes-style accessory bar with formatting buttons.
 * Relies on parent ScrollView/FlatList having keyboardShouldPersistTaps="always"
 * so taps here don't dismiss the keyboard.
 *
 * @example
 * <FormattingToolbar
 *   onInsertChecklist={() => handleInsertFormat('[ ] ')}
 *   onInsertBullet={() => handleInsertFormat('• ')}
 *   onInsertNumbered={() => handleInsertFormat('1. ')}
 *   onInsertHeading={() => handleInsertFormat('## ')}
 * />
 */
export function FormattingToolbar({
  onInsertChecklist,
  onInsertBullet,
  onInsertNumbered,
  onInsertHeading,
}: FormattingToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <Pressable
        onPress={onInsertChecklist}
        style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
        hitSlop={8}
      >
        <Text style={styles.toolIcon}>☑</Text>
        <Text style={styles.toolLabel}>Task</Text>
      </Pressable>

      <Pressable
        onPress={onInsertBullet}
        style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
        hitSlop={8}
      >
        <Text style={styles.toolIcon}>•</Text>
        <Text style={styles.toolLabel}>Bullet</Text>
      </Pressable>

      <Pressable
        onPress={onInsertNumbered}
        style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
        hitSlop={8}
      >
        <Text style={styles.toolIcon}>1.</Text>
        <Text style={styles.toolLabel}>List</Text>
      </Pressable>

      <Pressable
        onPress={onInsertHeading}
        style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
        hitSlop={8}
      >
        <Text style={styles.toolIcon}>Aa</Text>
        <Text style={styles.toolLabel}>Heading</Text>
      </Pressable>

      <Pressable
        onPress={Keyboard.dismiss}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.toolButtonPressed]}
        hitSlop={8}
      >
        <Text style={styles.dismissIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  toolButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  toolIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  dismissButton: {
    padding: 6,
    borderRadius: 8,
  },
  dismissIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
