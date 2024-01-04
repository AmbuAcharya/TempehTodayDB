import React from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AppBar = ({ isUserLoggedIn, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const showButtons = isAdmin || isUserLoggedIn;
  const isCreateRoute = location.pathname === '/create';

  return (
    <header className="bg-gradient-to-r from-yellow-700 via-orange-400 to-yellow-700 py-2 shadow-md text-center">
      <div className={`container mx-auto flex items-center ${showButtons ? 'justify-between' : 'justify-center'}`}>
        <Link to="/">
          <img
            src={process.env.PUBLIC_URL + '/tempeh_logo.png'}
            alt="App Logo"
            className={`h-20 md:h-24 lg:h-28 object-contain cursor-pointer ${showButtons ? 'ml-4' : ''}`}
          />
        </Link>
        {showButtons && (
          <div className="flex items-center space-x-4 ml-auto">
            {(!isCreateRoute && isAdmin && isUserLoggedIn) && (
              <button
                className="text-white font-semibold px-4 py-2 border rounded border-white"
                onClick={handleCreateUser}
              >
                Create User
              </button>
            )}
            {isUserLoggedIn && (
              <button
                className="text-white font-semibold px-4 py-2 border rounded border-white"
                onClick={handleSignOut}
              >
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
