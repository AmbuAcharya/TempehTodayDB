import React, { useState, useEffect } from 'react';
import axios from 'axios';


function App() {
  const [file, setFile] = useState(null);
  const [mfuId, setMfuId] = useState('');
  const [data, setData] = useState(null);
  const [selectedDatabaseKey, setSelectedDatabaseKey] = useState('');
  const [dataKeys, setDataKeys] = useState([]);
  const [txt, settxt] = useState('');
  const [isCreateProfileClicked, setIsCreateProfileClicked] = useState(false);
  const [newOperator, setNewOperator] = useState({
    Operator_ID: '',
    Operator_name: '',
    Operator_image: null,
  });

  const handleCreateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('selectedDatabaseKey', selectedDatabaseKey);
      formData.append('mfuId', mfuId);
      formData.append('Operator_ID', newOperator.Operator_ID);
      formData.append('Operator_name', newOperator.Operator_name);
      
      // Ensure newOperator.Operator_image is not null or undefined
      if (newOperator.Operator_image) {
        formData.append('Operator_image', newOperator.Operator_image);
      }
  
      const response = await fetch('http://localhost:5001/admob-app-id-1676370691/us-central1/app/createProfile', {
        method: 'POST',
        body: formData,
      });
  
      const responseData = await response.json();
  
      if (responseData.success) {
        console.log('Profile created successfully');
        setNewOperator({ Operator_ID: '', Operator_name: '', Operator_image: ''});
      } else {
        console.error('Failed to create profile:', responseData.message);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };
  
  const handleOperatorImageUpload = (e) => {
    const file = e.target.files[0];
    setNewOperator((prevOperator) => ({
      ...prevOperator,
      Operator_image: file,
    }));
  };
 
  const handleOperatorInputChange = (key, value) => {
    setNewOperator((prevOperator) => ({
      ...prevOperator,
      [key]: value,
    }));
  };

  const handleDatabaseKeyChange = (e) => {
    setSelectedDatabaseKey(e.target.value);
  };
  useEffect(() => {
    // Fetch database keys when the component mounts
    const fetchDatabaseKeys = async () => {
      try {
        const keysResponse = await axios.get(`http://localhost:5001/admob-app-id-1676370691/us-central1/app/fetchDatabaseKeys`);
        const databaseKeys = keysResponse.data;
        setDataKeys(databaseKeys);
      } catch (error) {
        console.error('Error fetching database keys:', error);
      }
    };

    fetchDatabaseKeys();
  }, []);

  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        if(selectedDatabaseKey=="MFU")
        {
        const response = await fetch(`http://localhost:5001/admob-app-id-1676370691/us-central1/app/uploadMFU?MFU_ID=${mfuId}&databaseKey=${selectedDatabaseKey}`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          console.log('File uploaded successfully');
        } else {
          console.error('Failed to upload file');
        }
      }
      else{
        const response = await fetch(`http://localhost:5001/admob-app-id-1676370691/us-central1/app//SFUupload?MFU_ID=${mfuId}&databaseKey=${selectedDatabaseKey}`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          console.log('File uploaded successfully');
        } else {
          console.error('Failed to upload file');
        }
      }
        
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };
  
  

  const hasDateOrTimeFormat = (data) => {
    const isDateFormat = (value) => /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{2}$/.test(value);
    const isTimeFormat = (value) => /^(0[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] (AM|PM)$/i.test(value);
  
    for (const dateKey in data) {
      if (isDateFormat(dateKey)) {
        console.log('Date format found:', dateKey);
        return true;
      }
  
      const dateValue = data[dateKey];
  
      for (const timeKey in dateValue) {
        if (isTimeFormat(timeKey)) {
          console.log('Time format found:', timeKey);
          return true;
        }
  
        const timeValue = dateValue[timeKey];
  
        for (const propertyKey in timeValue) {
          if (isDateFormat(propertyKey) || isTimeFormat(propertyKey)) {
            console.log('Date or time format found:', propertyKey);
            return true;
          }
  
          const propertyValue = timeValue[propertyKey];
  
          if (isDateFormat(propertyValue) || isTimeFormat(propertyValue)) {
            console.log('Date or time format found in property value:', propertyValue);
            return true;
          }
        }
      }
    }
  
    console.log('No date or time format found');
    return false;
  };

  const handleGetData = async () => {
    if (mfuId) {
      try {
        const response = await axios.get(`http://localhost:5001/admob-app-id-1676370691/us-central1/app/fetchData?MFU_ID=${mfuId}&databaseKey=${selectedDatabaseKey}&enteredValue=${txt}`);
        const rawData = response.data;
        console.log("Data", rawData);
        
        if(txt.startsWith("SB_"))
        {
          const transformedData = transformDatasb(rawData,txt);
          setData(transformedData);
        }
        else if(txt.startsWith("GB_"))
        {
          const transformedData = transformDatagb(rawData,txt);
          setData(transformedData);
        }
        else if(txt=="Operator")
        {
          const transformedData = transformDataop(rawData,txt);
          setData(transformedData);
        }
        else
        {
          const transformedData = transformData(rawData, selectedDatabaseKey,txt);
          setData(transformedData);
        }
  
        // const transformedData = transformDatay(rawData, selectedDatabaseKey, txt);
        
      } catch (error) {
        console.error('Error getting data:', error);
      }
    } else {
      console.error('MFU_ID is required');
    }
  };
  
 
  function transformDatadnt(jsonData) {
    const result = [];
  
    // Iterate over each sheet
    Object.keys(jsonData).forEach(sheetName => {
      const sheetData = jsonData[sheetName];
  
      // Iterate over each date
      Object.keys(sheetData).forEach(date => {
        const dateData = sheetData[date];
  
        // Iterate over each time
        Object.keys(dateData).forEach(time => {
          const rowData = dateData[time];
  
          // Create a new row object
          const row = {
            Date: date || '', // Provide a default value if date is ''
            Time: time || '', // Provide a default value if time is ''
            ...(rowData || {}), // Spread the rest of the rowData, provide an empty object if rowData is ''
          };
  
          result.push(row);
        });
      });
    });
  
    return result;
  }
  
  function transformData(jsonData) {
    const result = [];
  
    Object.keys(jsonData).forEach(sheetName => {
      const sheetData = jsonData[sheetName];
  
      Object.keys(sheetData).forEach(dataId => {
        const rowData = sheetData[dataId];
  
        const row = {};
  
        Object.keys(rowData).forEach(key => {
          row[key] = rowData[key] || ''; 
        });
  
        result.push(row);
      });
    });
  
    return result;
  }

  function transformdData(jsonData) {
    const result = [];
  
    if (!jsonData || typeof jsonData !== 'object') {
      console.error('Invalid jsonData:', jsonData);
      return result;
    }
  
    const flattenObject = (obj, parentKey = '') => {
      let result = {};
      for (const key in obj) {
        const newKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          result = { ...result, ...flattenObject(obj[key], newKey) };
        } else {
          result[newKey] = obj[key];
        }
      }
      return result;
    };
  
    const transformRow = (row, gbId, sbId) => {
      const flatRow = flattenObject(row);
      const transformedRow = {
        Device_ID: jsonData.Device_ID || '',
        GB_ID: gbId || '',
        SB_ID: sbId || '',
      };
  
      for (const key in flatRow) {
        transformedRow[key] = flatRow[key];
      }
      return transformedRow;
    };
  
    for (const mfuId in jsonData) {
      if (mfuId !== 'Device_ID') {
        const mfuData = jsonData[mfuId];
        for (const sheet in mfuData) {
          const gbId = sheet;
          const gbData = mfuData[sheet];
          for (const sbId in gbData) {
            const sbData = gbData[sbId];
            const row = transformRow(sbData, gbId, sbId);
            result.push(row);
          }
        }
      }
    }
  
    return result;
  }

  // function transformDatay(jsonData) {
  //   const result = [];
  
  //   Object.keys(jsonData).forEach(deviceID => {
  //     const deviceData = jsonData[deviceID];
  
  //     Object.keys(deviceData).forEach(gbID => {
  //       const gbData = deviceData[gbID];
  
  //       Object.keys(gbData).forEach(sbID => {
  //         const sbData = gbData[sbID];
  
  //         const row = {
  //           Device_ID: deviceID || '',
  //           GB_ID: gbID || '',
  //           SB_ID: sbID || '',
  //           DATE: sbData.DATE || '',
  //           TIME: sbData.TIME || '',
  //           BOILING_Reboil: sbData.BOILING?.Reboil || '',
  //           BOILING_STOP: sbData.BOILING?.STOP || '',
  //           BOILING_STRT: sbData.BOILING?.START || '',
  //           INOCULATION_START: sbData.INOCULATION?.START || '',
  //           INOCULATION_STOP: sbData.INOCULATION?.STOP || '',
  //           SOAKING_START: sbData.SOAKING?.START || '',
  //           SOAKING_STOP: sbData.SOAKING?.STOP || '',
  //         };
  
  //         result.push(row);
  //       });
  //     });
  //   });
  
  //   return result;
  // }
  
//   function transformDatay(jsonData, selectedDatabaseKey) {
//     const result = [];

//     // Check if jsonData is an object and has the selectedDatabaseKey
//     if (jsonData && typeof jsonData === 'object' && selectedDatabaseKey in jsonData) {
//         const sbData = jsonData[selectedDatabaseKey];

//         // Check if sbData is an object
//         if (sbData && typeof sbData === 'object') {
//             const row = {
//                 DATE: sbData.DATE || '',
//                 SOAKING_START: sbData.SOAKING?.START || '',
//                 SOAKING_STOP: sbData.SOAKING?.STOP || '',
//                 BOILING_START_Operator: sbData.BOILING?.START?.Operator_ID || '',
//                 BOILING_START: sbData.BOILING?.START?.Time || '',
//                 BOILING_Reboil_Operator: sbData.BOILING?.Reboil?.Operator_ID || '',
//                 BOILING_Reboil: sbData.BOILING?.Reboil?.Time || '',
//                 BOILING_STOP_Operator: sbData.BOILING?.STOP?.Operator_ID || '',
//                 BOILING_STOP: sbData.BOILING?.STOP?.Time || '',
//                 INOCULATION_START: sbData.INOCULATION?.START || '',
//                 INOCULATION_STOP: sbData.INOCULATION?.STOP || '',
//             };

//             result.push(row);
//         } else {
//             console.error(`Invalid sbData structure`);
//         }
//     } else {
//         console.error(`Invalid jsonData structure or missing selectedDatabaseKey: ${selectedDatabaseKey}`);
//     }

//     return result;
// }

function transformDatasb(jsonData,txt) {
  const result = [];

  // Check if jsonData is an object
  if (jsonData && typeof jsonData === 'object') {
      const row = {
          GB_ID:txt||'',
          SB_ID: txt || '',
          DATE: jsonData.DATE || '',
          SOAKING_START: jsonData.SOAKING?.START || '',
          SOAKING_STOP: jsonData.SOAKING?.STOP || '',
          BOILING_START_Operator: jsonData.BOILING?.START?.Operator_ID || '',
          BOILING_START: jsonData.BOILING?.START?.Time || '',
          BOILING_Reboil_Operator: jsonData.BOILING?.Reboil?.Operator_ID || '',
          BOILING_Reboil: jsonData.BOILING?.Reboil?.Time || '',
          BOILING_STOP_Operator: jsonData.BOILING?.STOP?.Operator_ID || '',
          BOILING_STOP: jsonData.BOILING?.STOP?.Time || '',
          INOCULATION_START: jsonData.INOCULATION?.START || '',
          INOCULATION_STOP: jsonData.INOCULATION?.STOP || '',
      };

      result.push(row);
  } else {
      console.error('Invalid jsonData structure');
  }

  return result;
}

function transformDatagb(jsonData,txt) {
  const result = [];

  if (jsonData && typeof jsonData === 'object') {
      Object.keys(jsonData).forEach(sbID => {
          const sbData = jsonData[sbID];

          if (sbData && typeof sbData === 'object') {
              const row = {
                  GB_ID:txt||'',
                  SB_ID: sbID || '',
                  DATE: sbData.DATE || '',
                  SOAKING_START: sbData.SOAKING?.START || '',
                  SOAKING_STOP: sbData.SOAKING?.STOP || '',
                  BOILING_START_Operator: sbData.BOILING?.START?.Operator_ID || '',
                  BOILING_START: sbData.BOILING?.START?.Time || '',
                  BOILING_Reboil_Operator: sbData.BOILING?.Reboil?.Operator_ID || '',
                  BOILING_Reboil: sbData.BOILING?.Reboil?.Time || '',
                  BOILING_STOP_Operator: sbData.BOILING?.STOP?.Operator_ID || '',
                  BOILING_STOP: sbData.BOILING?.STOP?.Time || '',
                  INOCULATION_START: sbData.INOCULATION?.START || '',
                  INOCULATION_STOP: sbData.INOCULATION?.STOP || '',
              };

              result.push(row);
          } else {
              console.error(`Invalid sbData structure for SB_ID: ${sbID}`);
          }
      });
  } else {
      console.error('Invalid jsonData structure');
  }

  return result;
}

function transformDataop(data) {
  return Object.values(data).map(operator => ({
    Operator_ID: operator.Operator_ID,
    Operator_image: operator.Operator_image,
    Operator_name: operator.Operator_name
  }));
}

  function transformData(jsonData, selectedDatabaseKey, enteredValue) {
    const result = [];
    
    const selectedData = jsonData[selectedDatabaseKey].GB;
  
    if (!enteredValue) {
      // Transform all available data
      Object.keys(selectedData).forEach(gbID => {
        const gbData = selectedData[gbID];
  
        Object.keys(gbData).forEach(sbID => {
          const sbData = gbData[sbID];
  
          const row = {
            GB_ID: gbID || '',
            SB_ID: sbID || '',
            DATE: sbData.DATE || '',
            SOAKING_START: sbData.SOAKING?.START || '',
            SOAKING_STOP: sbData.SOAKING?.STOP || '',
            BOILING_START_Operator: sbData.BOILING?.START?.Operator_ID || '',
            BOILING_START: sbData.BOILING?.START?.Time || '',
            BOILING_Reboil_Operator: sbData.BOILING?.Reboil?.Operator_ID || '',
            BOILING_Reboil: sbData.BOILING?.Reboil?.Time || '',
            BOILING_STOP_Operator: sbData.BOILING?.STOP?.Operator_ID || '',
            BOILING_STOP: sbData.BOILING?.STOP?.Time || '',
            INOCULATION_START: sbData.INOCULATION?.START || '',
            INOCULATION_STOP: sbData.INOCULATION?.STOP || '',
          };
  
          result.push(row);
        });
      });
    }   
    return result;
  }
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    setData(null);
  }, [file]);

const handleDownloadExcel = async () => {
  if (mfuId) {
    try {
      const response = await fetch(`http://localhost:5001/admob-app-id-1676370691/us-central1/app/downloadExcel?MFU_ID=${mfuId}`);
      const blob = await response.blob();

      // Create a link element and trigger a download
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([blob]));
      link.download = `${mfuId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
    }
  } else {
    console.error('MFU_ID is required');
  }
};
  
return (
  <div>
    <label>
      Select Database Key:
      <select value={selectedDatabaseKey} onChange={handleDatabaseKeyChange}>
        <option value="">Select a key</option>
        {dataKeys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </label>
    {selectedDatabaseKey === 'MFU' && (
      <>
        <label>
          Enter MFU_ID:
          <input type="text" value={mfuId} onChange={(e) => setMfuId(e.target.value)} />
        </label>
        <label>
          Find Batch or Operator:
          <input type="text" value={txt} onChange={(e) => settxt(e.target.value)} />
        </label>
        <br />
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Upload File</button>
        <br />
        <button onClick={handleGetData}>Get Data</button>

        <button onClick={() => setIsCreateProfileClicked(true)}>Create Profile</button>

        {isCreateProfileClicked && (
          <>
            <label>
              Operator_ID:
              <input
                type="text"
                value={newOperator.Operator_ID}
                onChange={(e) => handleOperatorInputChange('Operator_ID', e.target.value)}
              />
            </label>
            <label>
              Operator_name:
              <input
                type="text"
                value={newOperator.Operator_name}
                onChange={(e) => handleOperatorInputChange('Operator_name', e.target.value)}
              />
            </label>
            <label>
              Upload Image:
              <input type="file" onChange={handleOperatorImageUpload} />
            </label>
            <button onClick={handleCreateProfile}>Create</button>
            <button onClick={() => setIsCreateProfileClicked(false)}>Close</button>
          </>
        )}
      </>
    )}
    {data && (
      <div>
        <br />
        <h2>Data:</h2>
        <table border="1">
          <thead>
            <tr>
              {Object.keys(data[0]).map((columnName) => (
                <th key={columnName}>{columnName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((rowData, rowIndex) => (
              <tr key={rowIndex}>
                {Object.keys(data[0]).map((columnName, colIndex) => (
                  <td key={colIndex}>
                    {columnName === 'Operator_image' && rowData[columnName] ? (
                      <img src={rowData[columnName]} alt={rowData['Operator_name']} style={{ width: '100px', height: '100px' }} />
                    ) : (
                      rowData[columnName]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <br />
        <button onClick={handleDownloadExcel}>Download Excel</button>
      </div>
    )}
  </div>
);


}

export default App;