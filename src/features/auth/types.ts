export type Admin = {
  createdAt: string;
  email: string;
  id: string;
  lastLoginAt: string | null;
  name: string;
  status: "active" | "disabled";
  updatedAt: string;
};
