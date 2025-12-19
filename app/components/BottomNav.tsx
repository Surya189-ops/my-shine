"use client";

import { usePathname, useRouter } from "next/navigation";
import { AiFillHome } from "react-icons/ai";
import { FiSearch, FiUser } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: <AiFillHome size={24} />, path: "/" },
    { icon: <FiSearch size={24} />, path: "/search" },
    { icon: <IoNotificationsOutline size={24} />, path: "/notifications" },
    { icon: <FiUser size={24} />, path: "/profile" },
  ];

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-700
        transition-colors duration-300
      "
    >
      {/* CENTER CONTAINER */}
      <div className="mx-auto max-w-md md:max-w-xl">
        <div className="flex justify-between items-center px-8 h-14">
          {navItems.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`
                  flex items-center justify-center
                  cursor-pointer transition-all duration-200
                  ${
                    isActive
                      ? "text-pink-500 scale-110"
                      : "text-gray-400 dark:text-gray-500 hover:text-pink-400"
                  }
                `}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
