import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [mfuId, setMfuId] = useState('');
  const [data, setData] = useState(null);

  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`http://localhost:5001/upload?MFU_ID=${mfuId}`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          console.log('File uploaded successfully');
        } else {
          console.error('Failed to upload file');
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
        const response = await axios.get(`http://localhost:5001/fetchData?MFU_ID=${mfuId}`);
        const rawData = response.data;
        console.log("Data", rawData);

        const transformedData = transformDatay(rawData);
        setData(transformedData);

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
            Date: date || '', // Provide a default value if date is undefined
            Time: time || '', // Provide a default value if time is undefined
            ...(rowData || {}), // Spread the rest of the rowData, provide an empty object if rowData is undefined
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

  function transformDatay(jsonData) {
    const result = [];
  
    Object.keys(jsonData).forEach(deviceKey => {
      const deviceData = jsonData[deviceKey];
  

      const deviceID = deviceData.Device_ID || '';
      const mobile = deviceData.MOBILE || '';
  
      Object.keys(deviceData).forEach(gbID => {
  
        const gbData = deviceData[gbID];
  
        Object.keys(gbData).forEach(sbID => {
          const sbData = gbData[sbID];
  
          const row = {
            Device_ID: deviceID,
            Mobile: mobile,
            GB_ID: gbID || '',
            SB_ID: sbID || '',
            DATE: sbData.DATE || '',
            TIME: sbData.TIME || '',
            BOILING_START: sbData.BOILING?.STRT || '',
            BOILING_STOP: sbData.BOILING?.STOP || '',
            BOILING_Reboil: sbData.BOILING?.Reboil || '',
            INOCULATION_START: sbData.INOCULATION?.START || '',
            INOCULATION_STOP: sbData.INOCULATION?.STOP || '',
            SOAKING_START: sbData.SOAKING?.START || '',
            SOAKING_STOP: sbData.SOAKING?.STOP || '',
          };
  
          result.push(row);
        });
      });
    });
  
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
      const response = await fetch(`http://localhost:5001/downloadExcel?MFU_ID=${mfuId}`);
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
        Enter MFU_ID:
        <input type="text" value={mfuId} onChange={(e) => setMfuId(e.target.value)} />
      </label>
      <br />
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>
      <br />
      <button onClick={handleGetData}>Get Data</button>
      <br />
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
                    <td key={colIndex}>{rowData[columnName]}</td>
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