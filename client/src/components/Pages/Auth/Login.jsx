import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCow } from "react-icons/fa6";
import useAuthStore from "../../../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import AdminAccessLink from "../../AdminAccessLink";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand store
  const { loading, error, login, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Call the login action from the store
      await login(email, password);

      // After successful login, navigate to dashboard or previous attempted page
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled by the store
      console.error("Login failed:", error.message);
    }
  };

  // Clear any previous errors when the component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen md:overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="w-full max-w-6xl p-8 flex flex-col md:flex-row items-center justify-between">
        {/* Left side - Farm Illustration */}
        <div className="w-full hidden md:block md:w-1/2 px-8">
          <img
            src="/assets/images/MilkingACow.svg"
            alt="Dairy farm illustration"
            className="w-full max-w-xl mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl border border-green-100">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-8">
              <FaCow className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-3xl font-bold text-green-800 mb-2">
                FarmFlow
              </h2>
              <p className="text-green-600">Dairy Management System</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-green-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-green-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-green-700">Remember me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-green-600 hover:text-green-700 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200 flex items-center justify-center space-x-2 disabled:bg-green-400"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-green-700">
                New to FarmFlow?{" "}
                <Link
                  to="/auth/signup"
                  className="text-green-600 hover:text-green-700 hover:underline font-medium"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
