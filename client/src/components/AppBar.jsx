// AppBar.js
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaUserPlus } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const AppBar = ({ isUserLoggedIn, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname === '/create';
  const [showButtons, setShowButtons] = useState(isAdmin || (isUserLoggedIn && !isCreateRoute));

  useEffect(() => {
    setShowButtons((isAdmin || (isUserLoggedIn && !isCreateRoute)) && location.pathname !== '/login');
  }, [location, isAdmin, isUserLoggedIn, isCreateRoute]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleCreateUser = () => {
    navigate('/create');
  };

  const logoClass = showButtons ? 'ml-4' : 'mx-auto';

  return (
    <header className="bg-slate-100 py-2 shadow-md text-center fixed w-full top-0">
      <div className={`container mx-auto flex items-center ${showButtons ? 'justify-between' : 'justify-center'}`}>
        <Link to="/">
          <img
            src={process.env.PUBLIC_URL + '/tempeh_logo.png'}
            alt="App Logo"
            className={`h-20 md:h-24 lg:h-28 object-contain cursor-pointer ${logoClass}`}
          />
        </Link>
        {showButtons && (
          <div className="flex items-center space-x-4 ml-auto">
            {!isCreateRoute && isAdmin && isUserLoggedIn && (
              <button
                className="text-red-500 font-semibold px-4 py-2 border rounded border-red-500 flex items-center"
                onClick={handleCreateUser}
              >
                <FaUserPlus className="mr-2" />
                Create User
              </button>
            )}
            {isUserLoggedIn && (
              <button
                className="text-white bg-red-500 font-semibold px-4 py-2 border rounded border-red-500 flex items-center"
                onClick={handleSignOut}
              >
                <FaSignOutAlt className="mr-2" />
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppBar;
