"use client";
import { useAuthCtx } from "./AuthProvider";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthCtx();
  const router = useRouter();

  if (loading) return <p>Loading...</p>;
  if (!user) {
    router.replace("/login");
    return null;
  }
  return <>{children}</>;
}
