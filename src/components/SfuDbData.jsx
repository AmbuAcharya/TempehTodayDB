import React from 'react';

const SfuDbData = ({
  selectedMFUKey,
  handleMFUKeyChange,
  mfuIds,
  fileInputVisible,
  handleFileChange,
  handleFileUpload,
  setFileInputVisible,
  handleGetData,
}) => {
  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow bg-white mt-8">
      <label htmlFor="sfuSelect" className="block mb-4">
        <span className="font-bold text-blue-500">Select SFU_ID:</span>
        <select
          id="sfuSelect"
          value={selectedMFUKey}
          onChange={handleMFUKeyChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Select SFU_ID</option>
          {mfuIds.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      <div className="flex justify-between">
        {fileInputVisible ? (
          <>
            <input type="file" onChange={handleFileChange} className="mr-2" />
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mr-2 hover:bg-blue-600"
            >
              Upload
            </button>
            <button
              onClick={() => setFileInputVisible(false)}
              className="px-4 py-2 hover:text-blue-500"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setFileInputVisible(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mr-2 hover:bg-blue-600"
            >
              Upload File
            </button>
            <button
              onClick={handleGetData}
              className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600"
            >
              Get Data
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SfuDbData;
