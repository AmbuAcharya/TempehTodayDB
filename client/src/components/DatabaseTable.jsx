import React from 'react';

const DatabaseTable = ({ data, handleDownloadExcel, userInput, handleOperatorOrBatchIdClick }) => {
  return (
    <>
      {data && (
        <div className="container mx-auto mb-20 bg-gray-100">
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
                        columnName === 'OPERATOR' ||
                        columnName === 'SB_ID' ||
                        columnName === 'GB_ID';

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
