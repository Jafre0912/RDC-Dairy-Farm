import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaChartLine,
  FaClipboardList,
  FaUsers,
  FaArrowRight,
} from "react-icons/fa";
import { FaCow } from "react-icons/fa6";

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const testimonial = {
    name: "John Smith",
    role: "Dairy Farm Owner",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "This system has revolutionized how we manage our dairy operations. Milk production is up 15% and labor costs are down.",
  };

  return (
    <div className="bg-gradient-to-b pt-20 from-white to-green-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        {/* Modern abstract shapes */}
        <div className="absolute top-0 right-0 w-2/3 h-2/3">
          <div className="absolute top-10 left-0 w-64 h-64 rounded-full bg-green-200 mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div
            className="absolute top-40 left-40 w-72 h-72 rounded-full bg-blue-100 mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"
            style={{ animationDelay: "2s", animationDuration: "8s" }}
          ></div>
        </div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-green-100 mix-blend-multiply filter blur-3xl opacity-40"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div
              className={`w-full md:w-1/2 space-y-8 transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 rounded-full shadow-sm">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  Dairy Management Reimagined
                </p>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
                Run your farm{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500">
                  smarter
                </span>
                , not harder
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                All-in-one platform that helps you track cattle health, optimize
                milk production, and increase profitability.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/auth/signup"
                  className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 relative overflow-hidden"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <span className="absolute top-0 left-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full"></span>
                </Link>
                <Link
                  to="/auth/demo"
                  className="group px-8 py-4 bg-white border border-green-200 text-green-700 hover:text-green-800 hover:border-green-300 rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center"
                >
                  Watch demo{" "}
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    <FaArrowRight />
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">500+</span> farms
                  already managing smarter
                </p>
              </div>
            </div>

            <div
              className={`w-full md:w-1/2 transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="relative">
                <img
                  src="/assets/images/MilkingACow.svg"
                  alt="Smart Dairy Farm Management"
                  className="h-[500px] w-[500px] rounded-3xl drop-shadow-2xl z-10 relative"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Everything you need in one place
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform makes dairy farm management effortless
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FaCow />,
                title: "Cattle Tracking",
                desc: "Monitor health, breeding cycles, and individual performance.",
              },
              {
                icon: <FaChartLine />,
                title: "Production Analytics",
                desc: "Get insights on milk production and quality metrics.",
              },
              {
                icon: <FaClipboardList />,
                title: "Inventory Control",
                desc: "Manage feed, medicine and other farm supplies.",
              },
              {
                icon: <FaUsers />,
                title: "Staff Management",
                desc: "Assign tasks and track team performance.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:border-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl transform transition-transform group-hover:rotate-6 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial & CTA with Cow Image */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto relative">
            {/* Modern decorative elements */}
            <div className="absolute -right-16 -top-10 w-40 h-40 opacity-5">
              <FaCow className="w-full h-full text-green-800" />
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 md:p-12 mb-16 shadow-xl before:absolute before:inset-0 before:bg-white before:opacity-40 before:blur-xl relative overflow-hidden">
              <div className="relative z-10">
                <svg
                  className="h-16 w-16 text-green-500/20 mb-6"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>

                <p className="text-xl md:text-2xl text-gray-800 italic mb-6 leading-relaxed">
                  {testimonial.text}
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {testimonial.name}
                    </h3>
                    <p className="text-green-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>

              {/* Abstract blurred circles in the background */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
            </div>

            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 leading-tight">
                Ready to transform your dairy farm?
              </h2>

              <Link
                to="/auth/signup"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white text-lg rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Start Free Trial
                  <svg
                    className="ml-2 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <span className="absolute top-0 left-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full"></span>
              </Link>

              <p className="mt-6 text-gray-600">
                No credit card required • Free 14-day trial
              </p>

              {/* Modern cow illustration */}
              <div className="flex justify-center mt-12">
                <img
                  src="https://img.freepik.com/free-vector/cute-cow-cartoon-vector-illustration_138676-2773.jpg"
                  alt="Happy Cow"
                  className="h-24 w-auto drop-shadow-lg hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
