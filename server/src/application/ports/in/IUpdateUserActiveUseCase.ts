export interface UpdateUserActiveRequest {
  userId: string;
  isActive: boolean;
}

export interface UpdateUserActiveResponse {
  id: string;
  username: string;
  isActive: boolean;
}

export interface IUpdateUserActiveUseCase {
  execute(request: UpdateUserActiveRequest): Promise<UpdateUserActiveResponse>;
}
