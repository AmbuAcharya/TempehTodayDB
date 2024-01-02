import React from 'react';

const DatabaseSelection = ({ selectedDatabaseKey, handleDatabaseKeyChange, dataKeys }) => {
  // Exclude the "users" key from dataKeys
  const filteredDataKeys = dataKeys.filter(key => key !== "users");

  return (
    <div className="max-w-md mx-auto p-4 bg-white border rounded-md shadow-md mt-8">
      <label className="block mb-4 text-lg" htmlFor="databaseKeySelect">
        <span className="text-blue-500 font-bold">Select Database Key:</span>
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
              {key}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default DatabaseSelection;
