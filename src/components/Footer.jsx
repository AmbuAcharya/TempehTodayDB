import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-yellow-800 via-orange-500 to-yellow-800 text-white py-4 text-center flex justify-between p-6">
      <p>&copy; 2023 <a href="https://www.tempeh.today" className="text-blue-300 hover:text-blue-100">Tempeh today</a>. All rights reserved.</p>
      <p>Design and Developed by <a href="https://www.sparklingapps.com" className="text-blue-300 hover:text-blue-100">Sparkling Apps</a></p>
    </footer>
  );
};

export default Footer;
