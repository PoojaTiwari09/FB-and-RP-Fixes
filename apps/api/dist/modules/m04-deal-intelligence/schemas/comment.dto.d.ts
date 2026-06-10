export declare class CreateCommentDto {
    content: string;
    isCoaching?: boolean;
}
export declare class UpdateCommentDto {
    content: string;
}
export declare class CommentResponseDto {
    id: string;
    dealId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    isCoaching: boolean;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
