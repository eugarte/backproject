export interface TokenPayload {
  sub: string;      // user id
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;      // token id for revocation
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
