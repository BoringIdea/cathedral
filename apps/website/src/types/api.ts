export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}
