export interface DeleteUserRequest {
  userId: string;
}

export interface DeleteUserResponse {
  id: string;
  username: string;
}

export interface IDeleteUserUseCase {
  execute(request: DeleteUserRequest): Promise<DeleteUserResponse>;
}
