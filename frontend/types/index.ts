export type ApiResponse<TData = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
};

