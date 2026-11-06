export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  displayName: string;
  email: string;
  role: "user" | "admin" | null;
  tier: "free" | "paid" | null;
  avatar: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};
