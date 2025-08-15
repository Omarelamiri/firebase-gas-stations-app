"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <button
          onClick={() => auth.signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </ProtectedRoute>
  );
}
