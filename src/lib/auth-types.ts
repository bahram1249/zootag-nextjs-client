export interface AuthDto {
  username: string;
  password: string;
}

export interface RefreshDto {
  refresh_token: string;
  sessionId: number;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  expires_at: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  session_id: number;
}

export interface SessionResponse {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  isRevoked: boolean;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_id: number;
  expires_in?: number;
  refresh_token_expires_at?: string;
}

export interface MenuNode {
  id: number;
  title: string;
  url: string;
  icon: string;
  className: string;
  parentMenuId?: number | null;
  order?: number;
  subMenus?: MenuNode[];
}

export interface UserProfile {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  birthDate?: string;
  profileAttachment?: {
    id: number;
    originalFileName: string;
    fileName: string;
    mimetype: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}
