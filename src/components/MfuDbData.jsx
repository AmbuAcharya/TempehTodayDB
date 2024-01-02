import React from 'react';

const MfuDbData = ({
  selectedMFUKey,
  handleMFUKeyChange,
  handleFileChange,
  mfuIds,
  txt,
  settxt,
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
            <span className="font-bold text-blue-500">Select MFU_ID:</span>
            <select
              id="mfuSelect"
              value={selectedMFUKey}
              onChange={handleMFUKeyChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select MFU_ID</option>
              {mfuIds.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="searchInput" className="block mb-4">
            <span className="font-bold text-blue-500">Find Batch or Operator:</span>
            <input
              type="text"
              id="searchInput"
              value={txt}
              onChange={(e) => settxt(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
        </>
      ) : (
        <label htmlFor="mfuInput" className="block mb-4">
          <b>Enter MFU_ID:</b>
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
            <button onClick={() => setFileInputVisible(false)} className="px-4 py-2 hover:text-blue-500">
              Close
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setFileInputVisible(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 mr-2"
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

export default MfuDbData;
