import { Link } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';

/**
 * A simple link to the Admin Access Troubleshooter tool
 */
const AdminAccessLink = () => {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaTools className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Having trouble accessing the admin dashboard? Use the{' '}
            <Link 
              to="/fix-admin-access" 
              className="font-medium underline text-yellow-800 hover:text-yellow-900"
            >
              Admin Access Troubleshooter
            </Link>
            {' '}to fix permissions issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessLink; 