import React from 'react';

const SfuDbData = ({
  selectedMFUKey,
  handleMFUKeyChange,
  handleFileChange,
  mfuIds,
  userInput,
  setUserInput,
  fileInputVisible,
  handleFileUpload,
  setFileInputVisible,
  handleGetData,
}) => {
  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow bg-white mt-8">
      {!fileInputVisible ? (
        <>
          <label htmlFor="mfuSelect" className="block mb-4">
            <span className="font-bold text-blue-500">Select SFU Location:</span>
            <select
              id="mfuSelect"
              value={selectedMFUKey}
              onChange={handleMFUKeyChange}
              className="w-full p-2 border rounded"
            >
              <option disabled className="bg-yellow-100" value="">Select SFU Location</option>
              {mfuIds.map((key) => (
                <option className="bg-yellow-100" key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="searchInput" className="block mb-4">
            <span className="font-bold text-blue-500">Find Batch or SFU:</span>
            <input
              type="text"
              id="searchInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
        </>
      ) : (
        <label htmlFor="mfuInput" className="block mb-4">
          <b>Select SFU_ID:</b>
          <input
            type="text"
            id="mfuInput"
            value={selectedMFUKey}
            onChange={(e) => handleMFUKeyChange(e)}
            className="w-full p-2 border rounded"
          />
        </label>
      )}
      <div className="flex justify-between">
        {fileInputVisible ? (
          <>
            <input type="file" onChange={handleFileChange} className="mr-2" />
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
            >
              Upload
            </button>
            <button onClick={() => {
              setFileInputVisible(false)
              handleMFUKeyChange(null)
            }} className="px-4 py-2 hover:text-blue-500">
              Close
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setFileInputVisible(true)
                handleMFUKeyChange(null)
              }} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 mr-2"
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
