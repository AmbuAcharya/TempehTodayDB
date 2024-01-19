import React from 'react';

const RawMaterialsDbData = ({
  selectedMFUKey,
  handleMFUKeyChange,
  handleFileChange,
  mfuIds,
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
            <span className="font-bold text-blue-500">Select Raw Material:</span>
            <select
              id="mfuSelect"
              value={selectedMFUKey}
              onChange={handleMFUKeyChange}
              className="w-full p-2 border rounded"
            >
              <option disabled className="bg-yellow-100" value="">Select Raw Material</option>
              {mfuIds.map((key) => (
                <option className="bg-yellow-100" key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      <div className="flex justify-between">
        {fileInputVisible ? (
          <>
          <div>
            <label htmlFor="mfuSelect" className="block mb-4">
              <span className="font-bold text-blue-500">Select Raw Material:</span>
              <select
                id="mfuSelect"
                value={selectedMFUKey}
                onChange={handleMFUKeyChange}
                className="w-full p-2 border rounded"
              >
                <option disabled className="bg-yellow-100" value="">Select Raw Material</option>
                {mfuIds.map((key) => (
                  <option className="bg-yellow-100" key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
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
            </div>
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

export default RawMaterialsDbData;
