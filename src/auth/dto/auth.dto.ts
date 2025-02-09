export class SignUpDto {
  email: string;
  password: string;
  name: string;
}

export class SignInDto {
  email: string;
  password: string;
}

export class AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}
