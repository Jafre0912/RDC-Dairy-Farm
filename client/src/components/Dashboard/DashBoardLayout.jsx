import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { Footer } from "../shared/Footer/Footer";
import Sidebar from "../shared/Sidebar/Sidebar";

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarOpen") === "true" || window.innerWidth > 1024
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Listen for sidebar state changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setIsSidebarOpen(localStorage.getItem("sidebarOpen") === "true");
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check for resize events to handle responsive layout
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Update sidebar state based on initial screen size
      if (
        window.innerWidth > 1024 &&
        localStorage.getItem("sidebarOpen") === null
      ) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Trigger a custom event when sidebar state changes internally
  useEffect(() => {
    const checkSidebarState = () => {
      const storedState = localStorage.getItem("sidebarOpen") === "true";
      if (storedState !== isSidebarOpen) {
        setIsSidebarOpen(storedState);
      }
    };

    // Check every 300ms (this is more reliable than depending on storage events)
    const interval = setInterval(checkSidebarState, 300);
    return () => clearInterval(interval);
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar is now self-contained with its own positioning */}
        <Sidebar />

        {/* Scrollable Content Area - Adaptive margin based on sidebar state */}
        <main
          className={`
            flex-1 transition-all duration-300 pt-2 pb-20
            ${isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"}
          `}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30">
        <Footer />
      </footer>
    </div>
  );
}

export default DashboardLayout;
