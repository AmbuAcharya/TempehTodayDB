import React from 'react';

const DatabaseTable = ({ data, userInput, handleOperatorOrBatchIdClick, selectedMFUKey, serverUrl, selectedDatabaseKey, setMessage }) => {
  const handleDownloadExcel = async () => {
    if (selectedMFUKey) {
      try {
        const response = await fetch(`${serverUrl}/downloadExcel?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}`);
        const blob = await response.blob();

        // Create a link element and trigger a download
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(new Blob([blob]));
        link.download = `${selectedMFUKey}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage('Downloaded Successfully');
      } catch (error) {
        console.error('Error downloading Excel file:', error);
      }
    } else {
      console.error('MFU_ID is required');
    }
  };
  return (
    <>
      {data && (
        <div className="container mx-auto mb-20 bg-yellow-200">
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-md rounded-md table-auto">
              <thead className="bg-blue-500 text-white">
                <tr>
                  {Object.keys(data[0]).map((columnName, index) => (
                    <th
                      key={index}
                      className="py-3 px-4 text-sm md:text-base lg:text-lg whitespace-nowrap text-center"
                    >
                      {columnName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((rowData, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-100 transition duration-300">
                    {Object.keys(data[0]).map((columnName, colIndex) => {
                      const isClickableColumn =
                        (selectedDatabaseKey === "MFU_DB" && columnName === 'OPERATOR') ||
                        columnName === 'SB_ID' ||
                        columnName === 'GB_ID' ||
                        columnName === 'SFU';

                      const cellContent =
                        columnName === 'Operator_image' && rowData[columnName] ? (
                          <td
                            key={colIndex}
                            className={`${isClickableColumn ? 'cursor-pointer' : ''
                              } py-2 px-4 whitespace-nowrap text-center`}
                          >
                            <img
                              src={rowData[columnName]}
                              alt={rowData['Operator_name']}
                              className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-cover rounded-full mx-auto"
                            />
                          </td>
                        ) : (
                          <td
                            key={colIndex}
                            onClick={() => {
                              if (isClickableColumn) {
                                const clickedValue = rowData[columnName];
                                handleOperatorOrBatchIdClick(clickedValue);
                              }
                            }}
                            className={`${isClickableColumn ? 'cursor-pointer' : ''
                              } py-2 px-4 whitespace-nowrap text-center`}
                          >
                            {rowData[columnName]}
                          </td>
                        );

                      return cellContent;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!userInput && (
            <div className="flex justify-center mt-4">
              <button
                className="download-button py-2 px-4 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 focus:outline-none transition duration-300 mb-4"
                onClick={handleDownloadExcel}
              >
                Download Excel
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DatabaseTable;
