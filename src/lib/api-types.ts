export interface ApiSuccessResponse<T> {
  statusCode: number;
  reqId: string;
  message: string;
  result: T;
  timestamp: string;
  path: string;
  total?: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors: string[];
  timestamp: string;
  path: string;
}
