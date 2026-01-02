import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If we can't parse the error response, use the default message
    }
    throw new ApiError(errorMessage, response.status);
  }

  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new ApiError(data.message || 'Request failed', response.status, data);
  }

  return data;
}

export async function apiGet<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'GET', headers: headers || {} });
}

export async function apiPost<T>(
  url: string, 
  body?: any, 
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'POST',
    headers: headers || {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPostFormData<T>(
  url: string,
  formData: FormData,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  // Don't set Content-Type for FormData, let the browser set it with boundary
  const { 'Content-Type': _, ...otherHeaders } = headers || {};
  return apiRequest<T>(url, {
    method: 'POST',
    headers: otherHeaders,
    body: formData,
  });
}
