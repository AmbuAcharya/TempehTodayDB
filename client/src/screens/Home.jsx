import axios from 'axios';
import { get, off, onValue, ref } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import AppIcon from "../app_icon.png";
import DatabaseSelection from '../components/DatabaseSelection';
import DatabaseTable from '../components/DatabaseTable';
import MfuDbData from '../components/MfuDbData';
import RenderDatabaseData from '../components/RenderDatabaseData';
import { db } from '../firebaseConfig';


const Home = () => {

    const [file, setFile] = useState(null);
    const [mfuId, setMfuId] = useState('');
    const [mfuIds, setMfuIds] = useState([])
    const [data, setData] = useState(null);
    const [selectedDatabaseKey, setSelectedDatabaseKey] = useState('');
    const [selectedMFUKey, setSelectedMFUKey] = useState('');
    const [fileInputVisible, setFileInputVisible] = useState(false);
    const [dataKeys, setDataKeys] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [Message, setMessage] = useState('');
    const [explicitGetDataTriggered, setExplicitGetDataTriggered] = useState(false);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        setMfuId('');
    }, [selectedDatabaseKey]);

    useEffect(() => {
        setUserInput('');
    }, [selectedDatabaseKey, mfuId]);

    useEffect(() => {
        setData('');
        setErrorMessage('');
        setMessage('');
        setExplicitGetDataTriggered(false); // Reset the flag when userInput changes
    }, [mfuId, selectedDatabaseKey, userInput]);

    const handleDatabaseKeyChange = useCallback((e) => {
        setSelectedDatabaseKey(e.target.value);
    }, []);

    const handleMFUKeyChange = useCallback((e) => {
        if (e != null) {
            setSelectedMFUKey(e.target.value);
        } else {
            setSelectedMFUKey("")
        }
    }, []);


    const handleOperatorOrBatchIdClick = useCallback((operatorOrBatchId) => {
        if (operatorOrBatchId !== '') {
            setUserInput(operatorOrBatchId);
            setExplicitGetDataTriggered(false);
        }
    }, []);

    useEffect(() => {
        if (userInput !== '') {
            if (userInput.includes('SB') || userInput.includes('GB') || userInput.includes('OP')) {
                handleGetData();
            }
        }
    }, [userInput, selectedMFUKey, selectedDatabaseKey]);

    // const serverUrl='http://localhost:5001';
    const serverUrl = 'https://tempehtoday-f866c.web.app';
    // const serverUrl = 'http://localhost:5000/tempehtoday-f866c/us-central1/app';

    useEffect(() => {
        // Create a variable to track if the component is mounted
        const databaseRef = ref(db);
        const onDataChange = (snapshot) => {
            const existingData = snapshot.val();
            if (existingData != null) {
                const databaseKeys = Object.keys(existingData);
                console.log(databaseKeys);
                setDataKeys(databaseKeys);
            }
        };
        // Listen for changes in the data
        const unsubscribe = onValue(databaseRef, onDataChange);
        // Fetch initial data
        const getData = async () => {
            const existingDataSnapshot = await get(databaseRef);
            onDataChange(existingDataSnapshot);
        };

        // Call getData to fetch initial data
        getData();

        // Clean up the listener when the component unmounts or when the selectedDatabaseKey changes
        return () => {
            off(databaseRef, onDataChange);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        // Specify the path in the Realtime Database
        console.log(selectedDatabaseKey);
        var databasePath = `${selectedDatabaseKey}/MFU`;
        if (selectedDatabaseKey === "SFU") {
            databasePath = selectedDatabaseKey;
        }

        // Create a reference to the specified path
        const databaseRef = ref(db, databasePath);

        // Attach an asynchronous callback to read the data
        const onDataChange = (snapshot) => {
            const existingData = snapshot.val();
            if (existingData != null) {
                const mfuIds = Object.keys(existingData);
                console.log(mfuIds);
                setMfuIds(mfuIds);
            }
        };

        // Listen for changes in the data
        const unsubscribe = onValue(databaseRef, onDataChange);

        // Fetch initial data
        const getData = async () => {
            const existingDataSnapshot = await get(databaseRef);
            onDataChange(existingDataSnapshot);
        };

        // Call getData to fetch initial data
        getData();

        // Clean up the listener when the component unmounts or when the selectedDatabaseKey changes
        return () => {
            off(databaseRef, onDataChange);
            unsubscribe();
        };
    }, [selectedDatabaseKey]);



    const handleGetData = async () => {
        setLoading(true)
        console.log("selected Text" + userInput);
        try {
            if (selectedMFUKey && !explicitGetDataTriggered) {
                const response = await axios.get(`${serverUrl}/fetchData?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}&enteredValue=${userInput}`);
                const rawData = response.data;

                setErrorMessage('');
                setData('');

                if (selectedDatabaseKey === "SFU") {
                    if (!rawData) {
                        setErrorMessage(`No Data found for ${selectedMFUKey}`);
                    }
                    else {
                        const transformedData = transformDatasfu(rawData);
                        setData(transformedData);
                    }
                }
                else {
                    if (userInput.includes("SB")) {
                        if (!rawData) {

                            setErrorMessage(`No Data found for ${userInput}`);
                        } else {
                            const transformedData = transformDatasb(rawData, userInput);
                            setData(transformedData);
                        }
                    }
                    else if (userInput.includes("GB")) {
                        if (!rawData) {

                            setErrorMessage(`No Data found for ${userInput}`);
                        } else {
                            const transformedData = transformDatagb(rawData, userInput);
                            setData(transformedData);
                        }
                    }
                    else if (userInput.includes("_OP")) {
                        const transformedData = transformDataop(rawData, userInput);
                        setData(transformedData);
                    }
                    else {
                        const transformedData = transformDatamfu(rawData, selectedDatabaseKey, userInput);
                        setData(transformedData);
                    }
                }

            } else {
                setData('');
                if (selectedDatabaseKey === "MFU_DB") {
                    setErrorMessage('MFU_ID is required');

                } else {
                    setErrorMessage('SFU_ID is required');

                }
                console.error('Enter the ID');
            }
        } catch (error) {
            if (userInput) {
                setErrorMessage(`No Record found of ${userInput}`);
            }
            else {
                setErrorMessage(`No Record of ${selectedMFUKey}`);
            }
            console.error('Error getting data:', error);
        } finally {
            setLoading(false)
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

    function transformDatasb(sbData, userInput) {
        const result = [];

        if (sbData && typeof sbData === 'object') {
            const row = {
                SB_ID: userInput || '',
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

    function transformDatagb(jsonData, userInput) {
        const result = [];

        if (jsonData && typeof jsonData === 'object') {
            Object.keys(jsonData).forEach(sbID => {
                if (sbID === 'DATE' || sbID === 'TIME' || sbID === 'operatorId') {
                    return; // Skip unnecessary rows
                }
                const sbData = jsonData[sbID];

                if (sbData && typeof sbData === 'object') {
                    const row = {
                        GB_ID: userInput || '',
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

    useEffect(() => {
        setData(null);
    }, [file]);


    return (
        <main className="flex-grow flex flex-col items-center justify-center overflow-y-auto">
            {loading && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50">
                    <div className="bg-white p-4 rounded-md flex items-center justify-center">
                        <img
                            src={AppIcon}
                            alt="App Logo"
                            className="animate-spin h-12 w-12"
                        />
                    </div>
                </div>
            )}
            <div className="container mx-auto my-8 p-4 lg:p-0 flex flex-col items-center lg:flex-row lg:justify-between flex-grow">
                <DatabaseSelection
                    dataKeys={dataKeys}
                    handleDatabaseKeyChange={handleDatabaseKeyChange}
                    selectedDatabaseKey={selectedDatabaseKey}
                    className="mb-4 lg:mb-0" // Add margin-bottom for small screens
                />
                {<RenderDatabaseData MfuDbData={MfuDbData} fileInputVisible={fileInputVisible} handleGetData={handleGetData} handleMFUKeyChange={handleMFUKeyChange} mfuIds={mfuIds} selectedDatabaseKey={selectedDatabaseKey}
                    selectedMFUKey={selectedMFUKey} setFileInputVisible={setFileInputVisible} setUserInput={setUserInput} userInput={userInput} setFile={setFile} file={file} setErrorMessage={setErrorMessage} setLoading={setLoading} setMessage={setMessage} />}
            </div>
            {data && (
                <DatabaseTable
                    selectedDatabaseKey={selectedDatabaseKey}
                    selectedMFUKey={selectedMFUKey}
                    serverUrl={serverUrl}
                    setMessage={setMessage}
                    data={data[0] != null ? data : null}
                    userInput={userInput}
                    handleOperatorOrBatchIdClick={handleOperatorOrBatchIdClick}
                    handleGetData={handleGetData}
                />
            )}
            <div className="container mx-auto mt-4 lg:mt-8">
                {errorMessage && (
                    <p className="text-center font-bold text-red-600 text-2xl my-4">{errorMessage}</p>
                )}
                {Message && (
                    <p className="text-center font-bold text-black text-2xl my-4">{Message}</p>
                )}
            </div>
        </main>
    );
};

export default Home;