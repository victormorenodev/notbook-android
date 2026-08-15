import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates an RFC-compliant UUID v4 string for new entities.
 *
 * @example
 * const noteId = generateEntityId();
 * // => "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 */
export function generateEntityId(): string {
  return uuidv4();
}
