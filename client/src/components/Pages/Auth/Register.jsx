import { useState } from "react";
import { FaCow } from "react-icons/fa6";
import { Link } from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand store
  const { loading, error, register } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      // Call the register action from the store with the farmer role
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      
      const response = await register(registerData);

      // After successful registration, navigate to dashboard or previous attempted page
      if (response.message === "success") {
        const from = location.state?.from || "/dashboard";
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error handling is already managed by the store
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
            <div className="flex flex-col items-center mb-6">
              <FaCow className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-3xl font-bold text-green-800">
                Join FarmFlow
              </h2>
              <p className="text-green-600 mt-2">
                Create your farm management account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-green-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-green-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
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
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-green-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200 flex items-center justify-center space-x-2 disabled:bg-green-400"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-green-700">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-green-600 hover:text-green-700 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
