import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-100 text-black py-4 text-center sm:flex justify-between p-6">
      <p className="mb-4 sm:mb-0">
        &copy; {currentYear}{' '}
        <a
          href="https://www.tempeh.today"
          className="text-yellow-400 hover:text-blue-100"
          rel="noopener noreferrer"
          target="_blank"
        >
          Tempeh today
        </a>
        . All rights reserved.
      </p>
      <p>
        Designed and Developed by{' '}
        <a
          href="https://www.sparklingapps.com"
          className="text-yellow-400 hover:text-blue-100"
          rel="noopener noreferrer"
          target="_blank"
        >
          Sparkling Apps
        </a>
      </p>
    </footer>
  );
};

export default Footer;
