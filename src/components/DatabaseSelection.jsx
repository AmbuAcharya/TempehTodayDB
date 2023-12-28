import React from 'react';

const DatabaseSelection = ({ selectedDatabaseKey, handleDatabaseKeyChange, dataKeys }) => {
  return (
    <div className="max-w-md mx-auto p-4 bg-white border  rounded-md shadow-md mt-8">
      <label className="block mb-4 text-lg">
        <span className="text-blue-500 font-bold">Select Database Key:</span>
        <select
          value={selectedDatabaseKey}
          onChange={handleDatabaseKeyChange}
          className="w-full p-2 border rounded focus:outline-none focus:border-blue-700"
        >
          <option value="" className="text-gray-500">Select a key</option>
          {dataKeys.map((key) => (
            <option key={key} value={key} className="text-black-500">
              {key}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default DatabaseSelection;
