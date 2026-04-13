export interface PaginaResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface FiltrosBase {
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  error?: string;
  timestamp: string;
  path: string;
}

export interface ConfirmDeletionData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

