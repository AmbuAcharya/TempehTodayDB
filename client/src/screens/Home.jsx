import axios from 'axios';
import { get, ref, set, push } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import DatabaseSelection from '../components/DatabaseSelection';
import DatabaseTable from '../components/DatabaseTable';
import MfuDbData from '../components/MfuDbData';
import SfuDbData from '../components/SfuDbData';
import { db } from '../firebaseConfig';
import { read, utils } from 'xlsx';


const Home = () => {

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
    // const url = 'http://localhost:5000/tempehtoday-f866c/us-central1/app';

    useEffect(() => {

        let isMounted = true;


        const fetchDatabaseKeys = async () => {
            try {
                const keysResponse = await axios.get(`${url}/fetchDatabaseKeys`);


                if (isMounted) {
                    const databaseKeys = keysResponse.data;
                    setDataKeys(databaseKeys);
                }
            } catch (error) {
                console.error('Error fetching database keys:', error);
            }
        };

        fetchDatabaseKeys();
       
        return () => {
            isMounted = false;
        };
    }, []);


    useEffect(() => {
        
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
            try {
                if (selectedDatabaseKey === "MFU_DB") {
                    try {
                        console.log('Starting file upload process');
                        console.log('File Buffer:', file.buffer);
                        console.log('File:', file);
                        const workbook = read(file.buffer, { type: 'buffer' });
                        const sheetNames = workbook.SheetNames;

                        if (sheetNames.length > 0) {
                            console.log('Workbook contains sheets');

                            const refPath = `${selectedDatabaseKey}/MFU`;
                            const refNode = ref(db, refPath);

                            const existingDataSnapshot = await get(refNode);
                            const existingData = existingDataSnapshot.val();

                            const result = { ...existingData };
                            console.log('Existing data:', result);

                            if (!result[selectedMFUKey]) {
                                result[selectedMFUKey] = {
                                    GB: {}
                                };
                            }

                            const GBNode = result[selectedMFUKey].GB;

                            for (const sheetName of sheetNames) {
                                const sheet = workbook.Sheets[sheetName];

                                try {
                                    const excelData = utils.sheet_to_json(sheet, { raw: false });
                                    console.log(`Processing sheet "${sheetName}" with ${excelData.length} rows`);
                                    
                                    excelData.forEach(row => {
                                        const { GB_ID , SB_ID, 'GENERAL-BATCH DATE': GB_DATE , 'GENERAL-BATCH TIME':GB_TIME, 'SUB-BATCH DATE': SB_DATE, 'SUB-BATCH TIME': SB_TIME, 'OPERATOR': OPERATOR_ID, STATUS, COLOR, 'SOAKING START':SOAKING_START, 'SOAKING STOP':SOAKING_STOP,'BOILING START': BOILING_START, 'BOILING Reboil':BOILING_Reboil, 'BOILING STOP ': BOILING_STOP, 'MFU START': MFU_START, 'MFU STOP': MFU_STOP,'COOLING TEMPERATURE': INOCULATION_TEMPERATURE, 'SOAKING PH':SOAKING_PH } = row;
                                        
                                        if (!GBNode[GB_ID]) {
                                            GBNode[GB_ID] = {
                                                DATE: GB_DATE || null,
                                                TIME: GB_TIME || null,
                                                operatorId: OPERATOR_ID || null
                                            };
                                        }

                                        if (!GBNode[GB_ID][SB_ID]) {
                                            GBNode[GB_ID][SB_ID] = {
                                                BOILING: {
                                                    Reboil: {
                                                        Time: BOILING_Reboil || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        Time: BOILING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        Time: BOILING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: SB_DATE || null,
                                                COLOR: COLOR || null,
                                                INOCULATION: {
                                                    Operator_ID: OPERATOR_ID || null,
                                                    temperature: INOCULATION_TEMPERATURE || null,
                                                },
                                                MFU: {
                                                    START: {
                                                        StartTime: MFU_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: MFU_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                SOAKING: {
                                                    START: {
                                                        StartTime: SOAKING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: SOAKING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    ph: SOAKING_PH || null,
                                                },
                                                status: STATUS || null,
                                                TIME: SB_TIME || null,
                                                operatorId: OPERATOR_ID || null,
                                            };
                                        } else {
                                            // Update existing data if GB_ID and SB_ID already exist
                                            GBNode[GB_ID][SB_ID] = {
                                                BOILING: {
                                                    Reboil: {
                                                        Time: BOILING_Reboil || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        Time: BOILING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        Time: BOILING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: SB_DATE || null,
                                                COLOR: COLOR || null,
                                                INOCULATION: {
                                                    Operator_ID: OPERATOR_ID || null,
                                                    temperature: INOCULATION_TEMPERATURE || null,
                                                },
                                                MFU: {
                                                    START: {
                                                        StartTime: MFU_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: MFU_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                SOAKING: {
                                                    START: {
                                                        StartTime: SOAKING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: SOAKING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    ph: SOAKING_PH || null,
                                                },
                                                status: STATUS || null,
                                                TIME: SB_TIME || null,
                                                operatorId: OPERATOR_ID || null,
                                            };
                                        }
                                    });

                                } catch (sheetError) {
                                    console.error(`Error processing sheet "${sheetName}":`, sheetError);
                                    // Handle the error, set an appropriate error message, or skip the sheet
                                }
                            }

                            console.log('Data processing complete. Uploading to the database.');
                            // Set the value in the database
                            await set(refNode, result);
                            setMessage('File uploaded successfully');
                            console.log('File uploaded successfully');
                        } else {
                            console.error('Workbook does not contain any sheets.');
                            // Handle the case where the workbook is empty
                            setErrorMessage('Workbook does not contain any sheets.');
                        }
                    } catch (error) {
                        setErrorMessage('Failed to upload file');
                        console.error('Failed to upload file', error);
                    }
                }
                else if (selectedDatabaseKey === "SFU") {
                    const workbook = read(file.buffer, { type: 'buffer' });
                    const sheetNames = workbook.SheetNames;

                    // Assuming selectedMFUKey and selectedDatabaseKey are already defined

                    for (const sheetName of sheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const excelData = utils.sheet_to_json(sheet, { raw: false });

                    const refPath = `${selectedDatabaseKey}/${selectedMFUKey}`;
                    console.log(refPath);

                    for (const item of excelData) {
                        const date = item['Date'];
                        const time = item['Time'];

                        if (!date || !time) {
                        // If Date or Time is missing, push directly to the reference
                        await push(ref(db, refPath), item);
                        } else {
                        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
                        const dateMatch = date.match(dateRegex);
                        const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/;
                        const timeMatch = time.match(timeRegex);

                        if (dateMatch && timeMatch) {
                            const [, month, day, year] = dateMatch;
                            const [, hours, minutes, seconds, ampm] = timeMatch;

                            const formattedDate = new Date(
                            year.length === 2 ? `20${year}` : year,
                            month - 1,
                            day
                            );
                            const formattedTime = `${hours.padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

                            if (!isNaN(formattedDate.getTime())) {
                            const datePath = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
                            const timePath = formattedTime;

                            delete item['Date'];
                            delete item['Time'];

                            const fullPath = `${refPath}/${datePath}/${timePath}`;

                            // Use set method on the final reference
                            await set(ref(db, fullPath), item);
                            } else {
                            console.error(`Skipping data with invalid date: ${date}`);
                            }
                        } else {
                            console.error(`Skipping data with invalid date or time format - Date: ${date}, Time: ${time}`);
                        }
                        }
                    }
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
        const selectedFile = e.target.files[0];
        const reader = new FileReader();
    
        reader.onloadend = () => {
            const buffer = new Uint8Array(reader.result);
            // Now, you can use `buffer` in your file processing logic
            setFile(buffer);
        };
    
        reader.readAsArrayBuffer(selectedFile);
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

    const renderDatabaseData = () => {
        switch (selectedDatabaseKey) {
            case 'MFU_DB':
                return (
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
                );
            case 'SFU':
                return (
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
                );
            default:
                return null;
        }
    };
    return (
        <>
            <div className="container mx-auto my-8 flex flex-col items-center lg:flex-row lg:justify-between flex-grow">
                <DatabaseSelection
                    dataKeys={dataKeys}
                    handleDatabaseKeyChange={handleDatabaseKeyChange}
                    selectedDatabaseKey={selectedDatabaseKey}
                />
                {renderDatabaseData()}
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
        </>
    );
};

export default Home