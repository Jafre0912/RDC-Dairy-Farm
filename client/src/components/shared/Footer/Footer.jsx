export const Footer = () => {
  return (
    <div className="w-full text-center bg-green-600 text-white">
      <p className="text-sm py-2">
        &copy; {new Date().getFullYear()} FarmFlow. All rights reserved.
      </p>
    </div>
  );
};
