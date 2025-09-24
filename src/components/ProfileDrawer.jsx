"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { FaUser, FaGift, FaBell, FaHeart, FaBox, FaSignOutAlt, FaTimes, FaCog, FaChartLine, FaHistory } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileDrawer({ closeDrawer }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    closeDrawer();
  };

  const menuItems = [
    { id: 1, name: "Profile", icon: <FaUser />, description: "View and edit your profile" },
    { id: 2, name: "Dashboard", icon: <FaChartLine />, description: "Your fitness dashboard" },
    { id: 3, name: "Order History", icon: <FaHistory />, description: "Past purchases and orders" },
    { id: 4, name: "Gift Cards", icon: <FaGift />, description: "Manage gift cards" },
    { id: 5, name: "Notifications", icon: <FaBell />, description: "Notification settings" },
    { id: 6, name: "Wishlist", icon: <FaHeart />, description: "Saved items" },
    { id: 7, name: "Settings", icon: <FaCog />, description: "Account settings" },
  ];

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="profile-drawer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-opacity-50 z-50"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <motion.div
        key="profile-drawer-content"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b  from-gray-900 to-blue-950 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-700 bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={closeDrawer}
            className="text-gray-400 hover:text-white text-xl p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <FaTimes />
          </motion.button>
        </div>

        {/* User Stats */}
        <div className="p-4 bg-gray-800/50 m-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">12</p>
              <p className="text-xs text-gray-400">Workouts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">85%</p>
              <p className="text-xs text-gray-400">Goals</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <motion.button
              key={item.id} // Use unique ID instead of index
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 text-gray-200 text-left transition-all duration-200 group"
            >
              <span className="text-lg text-green-400 group-hover:text-green-300 transition-colors">
                {item.icon}
              </span>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </motion.button>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-700/40 bg-gradient-to-b from-gray-900 to-blue-950">
  <motion.button
    whileHover={{ 
      scale: 1.02,
      y: -2,
      rotateX: 5
    }}
    whileTap={{ scale: 0.98 }}
    onClick={handleLogout}
    className="w-full flex items-center justify-center gap-3 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/20 transform-style-preserve-3d group perspective-1000"
    style={{
      transformStyle: 'preserve-3d',
    }}
  >
    {/* 3D depth effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-red-800 to-red-900 rounded-xl transform translate-z-[-10px] group-hover:translate-z-[-8px] transition-transform duration-300" />
    
    <motion.span
      whileHover={{ 
        rotate: 180,
        translateZ: '10px'
      }}
      transition={{ duration: 0.3 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <FaSignOutAlt className="text-red-100 group-hover:text-white transition-colors relative z-10" />
    </motion.span>
    <span 
      className="font-medium text-red-50 group-hover:text-white transition-colors relative z-10"
      style={{ transformStyle: 'preserve-3d' }}
    >
      Logout
    </span>
  </motion.button>
</div>
      </motion.div>
    </AnimatePresence>
  );
}