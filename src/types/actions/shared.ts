export interface ActionResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>; // Field validation errors
}
