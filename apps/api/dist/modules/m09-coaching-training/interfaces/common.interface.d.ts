export interface ICurrentUser {
    id: string;
    email: string;
    role: string;
    org_id: string;
    status: string;
}
export interface IPaginationQuery {
    page?: number;
    limit?: number;
}
export interface IPaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
