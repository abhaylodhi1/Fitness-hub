"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      <Link href="/" className="text-lg font-bold">Fitness Site</Link>
      <div className="space-x-4">
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded-lg">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
