import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppBar from './components/AppBar';
import DatabaseSelection from './components/DatabaseSelection';
import DatabaseTable from './components/DatabaseTable';
import MfuDbData from './components/MfuDbData';
import SfuDbData from './components/SfuDbData';
import Footer from './components/Footer';

const App = () => {
  const [file, setFile] = useState(null);
  const [mfuId, setMfuId] = useState('');
  const [mfuIds, setMfuIds] = useState([])
  const [data, setData] = useState(null);
  const [selectedDatabaseKey, setSelectedDatabaseKey] = useState('');
  const [selectedMFUKey, setSelectedMFUKey] = useState('');
  const [fileInputVisible, setFileInputVisible] = useState(false);
  const [dataKeys, setDataKeys] = useState([]);
  const [txt, settxt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [Message, setMessage] = useState('');
  const [explicitGetDataTriggered, setExplicitGetDataTriggered] = useState(false);

  // const [isCreateProfileClicked, setIsCreateProfileClicked] = useState(false);
  // const [newOperator, setNewOperator] = useState({
  //   Operator_ID: '',
  //   Operator_name: '',
  //   Operator_image: null,
  // });

  // const handleCreateProfile = async () => {
  //   try {
  //     const formData = new FormData();
  //     formData.append('selectedDatabaseKey', selectedDatabaseKey);
  //     formData.append('mfuId', mfuId);
  //     formData.append('Operator_ID', newOperator.Operator_ID);
  //     formData.append('Operator_name', newOperator.Operator_name);

  //     // Ensure newOperator.Operator_image is not null or undefined
  //     if (newOperator.Operator_image) {
  //       formData.append('Operator_image', newOperator.Operator_image);
  //     }

  //     const response = await fetch('${url}/createProfile', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const responseData = await response.json();

  //     if (responseData.success) {
  //       console.log('Profile created successfully');
  //       setNewOperator({ Operator_ID: '', Operator_name: '', Operator_image: ''});
  //     } else {
  //       console.error('Failed to create profile:', responseData.message);
  //     }
  //   } catch (error) {
  //     console.error('Error creating profile:', error);
  //   }
  // };

  // const handleOperatorImageUpload = (e) => {
  //   const file = e.target.files[0];
  //   setNewOperator((prevOperator) => ({
  //     ...prevOperator,
  //     Operator_image: file,
  //   }));
  // };

  // const handleOperatorInputChange = (key, value) => {
  //   setNewOperator((prevOperator) => ({
  //     ...prevOperator,
  //     [key]: value,
  //   }));
  // };

  useEffect(() => {
    setMfuId('');
  }, [selectedDatabaseKey]);

  useEffect(() => {
    settxt('');
  }, [selectedDatabaseKey, mfuId]);

  useEffect(() => {
    setData('');
    setErrorMessage('');
    setMessage('');
    setExplicitGetDataTriggered(false); // Reset the flag when txt changes
  }, [mfuId, selectedDatabaseKey, txt]);

  const handleDatabaseKeyChange = (e) => {
    setSelectedDatabaseKey(e.target.value);
  };

  const handleMFUKeyChange = (e) => {
    setSelectedMFUKey(e.target.value);
  };

  const handleOperatorOrBatchIdClick = (operatorOrBatchId) => {
    if (operatorOrBatchId !== '') {
      settxt(operatorOrBatchId);
      setExplicitGetDataTriggered(false); // Reset the flag when txt is set by clicking the column
    }
  };

  useEffect(() => {
    if (txt !== '') {
      if (txt.includes('SB') || txt.includes('GB') || txt.includes('OP')) {
        handleGetData();
      }
    }
  }, [txt, selectedMFUKey, selectedDatabaseKey]);

  // const url='http://localhost:5001';
  const url = 'https://tempehtoday-f866c.web.app';

  useEffect(() => {
    // Fetch database keys when the component mounts
    const fetchDatabaseKeys = async () => {
      try {
        const keysResponse = await axios.get(`${url}/fetchDatabaseKeys`);
        const databaseKeys = keysResponse.data;
        setDataKeys(databaseKeys);
      } catch (error) {
        console.error('Error fetching database keys:', error);
      }
    };

    fetchDatabaseKeys();
  }, []);

  useEffect(() => {
    // Fetch MFU_IDs from Firebase based on the selectedDatabaseKey
    const fetchMfuIdsFromFirebase = async () => {
      try {
        const response = await axios.get(`${url}/fetchIds?databaseKey=${selectedDatabaseKey}`);
        const mfuIds = response.data;
        setMfuIds(mfuIds);
      } catch (error) {
        console.error('Error fetching MFU_IDs from Firebase:', error);
      }
    };

    if (selectedDatabaseKey) {
      fetchMfuIdsFromFirebase();
    }
  }, [selectedDatabaseKey]);


  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        if (selectedDatabaseKey == "MFU_DB") {
          const response = await fetch(`${url}/uploadMFU?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}`, {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            setMessage('File uploaded successfully');
            console.log('File uploaded successfully');
          } else {
            setErrorMessage('Failed to upload file');
            console.error('Failed to upload file');
          }
        }
        else if (selectedDatabaseKey == "SFU") {
          const response = await fetch(`${url}/SFUupload?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}`, {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            setMessage('File uploaded successfully');
            setFileInputVisible(false);
            console.log('File uploaded successfully');
          } else {
            console.error('Failed to upload file');
            setErrorMessage('Failed to upload file');
          }
        }

      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleGetData = async () => {
    console.log("selected Text" + txt);
    if (selectedMFUKey && !explicitGetDataTriggered) {
      try {
        const response = await axios.get(`${url}/fetchData?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}&enteredValue=${txt}`);
        const rawData = response.data;
        console.log("Data", rawData);
        setErrorMessage('');
        setData('');

        if (selectedDatabaseKey == "SFU") {
          if (!rawData) {
            setErrorMessage(`No Data found for ${selectedMFUKey}`);
          }
          else {
            const transformedData = transformDatasfu(rawData);
            setData(transformedData);
          }
        }
        else {
          if (txt.includes("SB")) {
            if (!rawData) {

              setErrorMessage(`No Data found for ${txt}`);
            } else {
              const transformedData = transformDatasb(rawData, txt);
              setData(transformedData);
            }
          }
          else if (txt.includes("GB")) {
            if (!rawData) {

              setErrorMessage(`No Data found for ${txt}`);
            } else {
              const transformedData = transformDatagb(rawData, txt);
              setData(transformedData);
            }
          }
          else if (txt.includes("_OP")) {
            const transformedData = transformDataop(rawData, txt);
            setData(transformedData);
          }
          else {
            const transformedData = transformDatamfu(rawData, selectedDatabaseKey, txt);
            setData(transformedData);
          }
        }

      } catch (error) {
        if (txt) {
          setErrorMessage(`No Record found of ${txt}`);
        }
        else {
          setErrorMessage(`No Record of ${selectedMFUKey}`);
        }
        console.error('Error getting data:', error);
      }
    } else {
      setData('');
      setErrorMessage('MFU_ID is required');
      console.error('Enter the ID');
    }
  };

  const colorMapping = {
    "34AB83": 'Green',
    "F5692B": 'Red',
    "F7A81C": 'Orange',
    "FDFFFD": 'White',
    "AB9F34": 'Light Green',
    "3634AB": 'Blue',
    "AB3449": 'Brown',
    "AB34A6": 'Purple',
    "D4D400": 'Yellow',
  };

  function transformDatasb(sbData, txt) {
    const result = [];

    if (sbData && typeof sbData === 'object') {
      const row = {
        SB_ID: txt || '',
        'SUB-BATCH DATE': sbData.DATE || '',
        'SUB-BATCH TIME': sbData.TIME || '',
        OPERATOR: sbData.operatorId || '',
        STATUS: sbData.status || '',
        COLOR: colorMapping[sbData.COLOR] || '',
        'SOAKING PH': sbData.SOAKING?.ph || '',
        'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
        'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
        'BOILING START': sbData.BOILING?.START?.StartTime || '',
        'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
        'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
        'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
        'MFU START': sbData.MFU?.START?.StartTime || '',
        'MFU STOP': sbData.MFU?.STOP?.StopTime || '',
      };

      result.push(row);
    } else {
      console.error('Invalid jsonData structure');
    }

    return result;
  }

  function transformDatagb(jsonData, txt) {
    const result = [];

    if (jsonData && typeof jsonData === 'object') {
      Object.keys(jsonData).forEach(sbID => {
        if (sbID === 'DATE' || sbID === 'TIME' || sbID === 'operatorId') {
          return; // Skip unnecessary rows
        }
        const sbData = jsonData[sbID];

        if (sbData && typeof sbData === 'object') {
          const row = {
            GB_ID: txt || '',
            SB_ID: sbID || '',
            'SUB-BATCH DATE': sbData.DATE || '',
            'SUB-BATCH TIME': sbData.TIME || '',
            OPERATOR: sbData.operatorId || '',
            STATUS: sbData.status || '',
            COLOR: colorMapping[sbData.COLOR] || '',
            'SOAKING PH': sbData.SOAKING?.ph || '',
            'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
            'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
            'BOILING START': sbData.BOILING?.START?.StartTime || '',
            'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
            'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
            'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
            'MFU START': sbData.MFU?.START?.StartTime || '',
            'MFU STOP': sbData.MFU?.STOP?.StopTime || '',
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

  function transformDataop(operatorData) {
    return [{
      Operator_ID: operatorData.Operator_ID || '',
      Operator_image: operatorData.Operator_image || '',
      Operator_name: operatorData.Operator_name || ''
    }];
  }

  function transformDatamfu(jsonData, selectedDatabaseKey, enteredValue) {
    const result = [];

    if (!jsonData[selectedDatabaseKey]) {
      console.error(`Error: ${selectedDatabaseKey} not found in jsonData`);
      return result;
    }

    const selectedData = jsonData[selectedDatabaseKey].GB;

    if (!enteredValue) {
      // Transform all available data
      Object.keys(selectedData).forEach(gbID => {
        if (gbID === 'DATE' || gbID === 'TIME' || gbID === 'operatorId') {
          return; // Skip unnecessary rows
        }

        const gbData = selectedData[gbID];

        Object.keys(gbData).forEach(sbID => {
          if (sbID === 'DATE' || sbID === 'TIME' || sbID === 'operatorId') {
            return; // Skip unnecessary rows
          }
          const sbData = gbData[sbID];

          const row = {
            GB_ID: gbID || '',
            'GENERAL-BATCH DATE': gbData.DATE || '',
            'GENERAL-BATCH TIME': gbData.TIME || '',
            SB_ID: sbID || '',
            'SUB-BATCH DATE': sbData.DATE || '',
            'SUB-BATCH TIME': sbData.TIME || '',
            OPERATOR: gbData.operatorId || '',
            STATUS: sbData.status || '',
            COLOR: colorMapping[sbData.COLOR] || '',
            'SOAKING PH': sbData.SOAKING?.ph || '',
            'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
            'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
            'BOILING START': sbData.BOILING?.START?.StartTime || '',
            'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
            'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
            'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
            'MFU START': sbData.MFU?.START?.StartTime || '',
            'MFU STOP': sbData.MFU?.STOP?.StopTime || '',
          };

          result.push(row);
        });
      });
    }
    return result;

  }

  const transformDatasfu = (jsonData) => {
    const tableData = [];

    // Iterate through the JSON data
    for (const date in jsonData) {
      const timeData = jsonData[date];

      for (const time in timeData) {
        const rowData = {
          Date: date.replace(/(\d{2})-(\d{2})-(\d{2})/, '$2-$1-$3'), // Change date format
          Time: time,
        };

        // Add the key-value pairs from the nested object
        for (const key in timeData[time]) {
          rowData[key] = timeData[time][key];
        }

        tableData.push(rowData);
      }
    }

    return tableData;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    setData(null);
  }, [file]);

  const handleDownloadExcel = async () => {
    if (selectedMFUKey) {
      try {
        const response = await fetch(`${url}/downloadExcel?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}`);
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
    <div className="App bg-gray-100 min-h-screen flex flex-col">
      <AppBar />
      <div className="container mx-auto my-8 flex flex-col items-center lg:flex-row lg:justify-between flex-grow">
        <DatabaseSelection
          dataKeys={dataKeys}
          handleDatabaseKeyChange={handleDatabaseKeyChange}
          selectedDatabaseKey={selectedDatabaseKey}
        />
        {selectedDatabaseKey === 'MFU_DB' && (
          <MfuDbData
            fileInputVisible={fileInputVisible}
            handleFileChange={handleFileChange}
            handleFileUpload={handleFileUpload}
            handleGetData={handleGetData}
            handleMFUKeyChange={handleMFUKeyChange}
            mfuIds={mfuIds}
            selectedMFUKey={selectedMFUKey}
            setFileInputVisible={setFileInputVisible}
            settxt={settxt}
            txt={txt}
          />
        )}
        {selectedDatabaseKey === 'SFU' && (
          <SfuDbData
            fileInputVisible={fileInputVisible}
            handleFileChange={handleFileChange}
            handleFileUpload={handleFileUpload}
            handleGetData={handleGetData}
            handleMFUKeyChange={handleMFUKeyChange}
            mfuIds={mfuIds}
            selectedMFUKey={selectedMFUKey}
            setFileInputVisible={setFileInputVisible}
          />
        )}
      </div>
      {data && (
        <DatabaseTable
          data={data[0] != null ? data : null}
          handleDownloadExcel={handleDownloadExcel}
          txt={txt}
          handleOperatorOrBatchIdClick={handleOperatorOrBatchIdClick}
          handleGetData={handleGetData}
        />
      )}
      {errorMessage && (
        <p className="text-center font-bold text-red-600 text-2xl my-4">{errorMessage}</p>
      )}
      {Message && (
        <p className="text-center font-bold text-black text-2xl my-4">{Message}</p>
      )}
      <Footer />
    </div>
  );
}

export default App;
{/* <button onClick={() => setIsCreateProfileClicked(true)}>Create Profile</button> */ }

{/* {isCreateProfileClicked && (
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
        )} */}
