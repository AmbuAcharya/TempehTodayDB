import React from 'react';
import { FaDatabase } from 'react-icons/fa';

const DatabaseSelection = ({ selectedDatabaseKey, handleDatabaseKeyChange, dataKeys }) => {
  const filteredDataKeys = Array.isArray(dataKeys) ? dataKeys.filter(key => key !== 'users') : [];

  return (
    <div className="max-w-md mx-auto p-4 bg-white border rounded-md shadow-md mt-8">
      <label className="block mb-4 text-lg" htmlFor="databaseKeySelect">
        <span className="text-blue-500 font-bold">Select Database:</span>
        <div className="relative">
          <select
            id="databaseKeySelect"
            value={selectedDatabaseKey}
            onChange={handleDatabaseKeyChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-700"
          >
            <option value="" className="text-gray-500">
              Select a key
            </option>
            {filteredDataKeys.map((key) => (
              <option key={key} value={key} className="text-black">
                {key.replace('_',' ')}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 mx-2">
            <FaDatabase />
          </div>
        </div>
      </label>
    </div>
  );
};

export default DatabaseSelection;
