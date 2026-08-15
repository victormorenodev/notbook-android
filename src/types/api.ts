/**
 * Represents a single field-level validation failure.
 */
export interface ValidationDetail {
  field: string;
  message: string;
}

/**
 * Standard backend error object.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: ValidationDetail[];
}

/**
 * Standard envelope returned by the backend API for all endpoints.
 */
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiError;
    };
