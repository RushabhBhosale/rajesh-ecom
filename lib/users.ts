import { connectDB } from "@/lib/db";
import type { Role, UserDocument } from "@/models/user";
import { UserModel } from "@/models/user";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date | null;
}

export async function listUsers(): Promise<UserSummary[]> {
  await connectDB();
  const users = (await UserModel.find().sort({ createdAt: -1 }).lean()) as unknown as UserDocument[];
  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt ?? null,
  }));
}
