import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface NoteBodyViewProps {
  body: string;
  onToggleCheckbox: (lineIndex: number) => void;
  onTapBody: () => void;
}

/** Discriminated union of all recognized line formats. */
type ParsedLine =
  | { type: 'checklist'; checked: boolean; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; number: number; text: string }
  | { type: 'heading'; text: string }
  | { type: 'plain'; text: string };

/**
 * Parses a raw line string into a structured format for rendering.
 * Order matters: checklist is checked before bullet so "- [ ] task" matches checklist.
 *
 * @example parseLine('[ ] Buy milk') → { type: 'checklist', checked: false, text: 'Buy milk' }
 */
function parseLine(raw: string): ParsedLine {
  const checkMatch = raw.match(/^(-\s+)?\[([ xX])\]\s?(.*)/);
  if (checkMatch) {
    return { type: 'checklist', checked: checkMatch[2] !== ' ', text: checkMatch[3] || '' };
  }

  const headingMatch = raw.match(/^##\s+(.*)/);
  if (headingMatch) {
    return { type: 'heading', text: headingMatch[1] || '' };
  }

  const bulletMatch = raw.match(/^[•\-*]\s+(.*)/);
  if (bulletMatch) {
    return { type: 'bullet', text: bulletMatch[1] || '' };
  }

  const numMatch = raw.match(/^(\d+)\.\s+(.*)/);
  if (numMatch) {
    return { type: 'numbered', number: parseInt(numMatch[1], 10), text: numMatch[2] || '' };
  }

  return { type: 'plain', text: raw };
}

/** Rounded checkbox square — yellow fill with white checkmark when checked. */
function CheckboxIcon({ checked }: { checked: boolean }): React.ReactElement {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

function renderChecklistLine(
  text: string,
  checked: boolean,
  index: number,
  onToggle: (i: number) => void
): React.ReactElement {
  return (
    <View key={index} style={styles.lineRow}>
      <Pressable
        onPress={() => onToggle(index)}
        hitSlop={6}
        style={styles.checkboxHitArea}
      >
        <CheckboxIcon checked={checked} />
      </Pressable>
      <Text style={[styles.lineText, checked && styles.checkedText]}>
        {text || ' '}
      </Text>
    </View>
  );
}

function renderBulletLine(text: string, index: number): React.ReactElement {
  return (
    <View key={index} style={styles.lineRow}>
      <Text style={styles.prefixText}>{'•  '}</Text>
      <Text style={styles.lineText}>{text || ' '}</Text>
    </View>
  );
}

function renderNumberedLine(num: number, text: string, index: number): React.ReactElement {
  return (
    <View key={index} style={styles.lineRow}>
      <Text style={styles.prefixText}>{`${num}. `}</Text>
      <Text style={styles.lineText}>{text || ' '}</Text>
    </View>
  );
}

function renderHeadingLine(text: string, index: number): React.ReactElement {
  return (
    <Text key={index} style={styles.headingText}>{text || ' '}</Text>
  );
}

function renderPlainLine(text: string, index: number): React.ReactElement {
  return (
    <Text key={index} style={styles.lineText}>{text || ' '}</Text>
  );
}

/**
 * Read-mode body renderer with interactive checkboxes.
 * Tapping a checkbox toggles it without entering edit mode.
 * Tapping text triggers onTapBody (switches to the raw TextInput).
 *
 * @example
 * <NoteBodyView body={body} onToggleCheckbox={handleToggle} onTapBody={handleEdit} />
 */
export function NoteBodyView({ body, onToggleCheckbox, onTapBody }: NoteBodyViewProps) {
  const lines = body.split('\n');

  return (
    <Pressable onPress={onTapBody} style={styles.container}>
      {lines.map((raw, index) => {
        const parsed = parseLine(raw);
        switch (parsed.type) {
          case 'checklist':
            return renderChecklistLine(parsed.text, parsed.checked, index, onToggleCheckbox);
          case 'bullet':
            return renderBulletLine(parsed.text, index);
          case 'numbered':
            return renderNumberedLine(parsed.number, parsed.text, index);
          case 'heading':
            return renderHeadingLine(parsed.text, index);
          default:
            return renderPlainLine(parsed.text, index);
        }
      })}
    </Pressable>
  );
}

// Text metrics match the body TextInput (fontSize: 17, lineHeight: 26)
const styles = StyleSheet.create({
  container: {
    minHeight: 300,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 26,
  },
  lineText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
    flex: 1,
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
  },
  headingText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700',
    color: '#111827',
  },
  checkboxHitArea: {
    paddingRight: 10,
    paddingVertical: 3,
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
