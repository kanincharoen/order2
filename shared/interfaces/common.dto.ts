export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  fieldErrors?: Record<string, string[]>;
  timestamp: string;
}
