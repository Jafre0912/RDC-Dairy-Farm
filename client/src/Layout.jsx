import { Outlet } from "react-router-dom";
import Navbar from "./components/shared/Navbar/Navbar";
import { Footer } from "./components/shared/Footer/Footer";

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content - Scrollable */}
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0">
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
