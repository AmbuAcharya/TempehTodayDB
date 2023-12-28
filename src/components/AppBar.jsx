import React from 'react';

const AppBar = () => {
  return (
    <header className="bg-gradient-to-r from-yellow-700 via-orange-400 to-yellow-700 py-2 shadow-md text-center">
      <div className="container mx-auto">
        <img
          src={process.env.PUBLIC_URL + '/tempeh_logo.png'}
          alt="App Logo"
          className="mx-auto h-20 md:h-24 lg:h-28 object-contain"
        />
      </div>
    </header>
  );
};

export default AppBar;
