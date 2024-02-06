import axios from 'axios';
import { get, off, onValue, ref } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import DatabaseSelection from '../components/DatabaseSelection';
import DatabaseTable from '../components/DatabaseTable';
import MfuDbData from '../components/MfuDbData';
import RenderDatabaseData from '../components/RenderDatabaseData';
import { db } from '../firebaseConfig';


const Home = ({ setErrorMessage, setMessage, setLoading }) => {

    const [file, setFile] = useState(null);
    const [mfuId, setMfuId] = useState('');
    const [mfuIds, setMfuIds] = useState([])
    const [data, setData] = useState(null);
    const [selectedDatabaseKey, setSelectedDatabaseKey] = useState('');
    const [selectedMFUKey, setSelectedMFUKey] = useState('');
    const [fileInputVisible, setFileInputVisible] = useState(false);
    const [dataKeys, setDataKeys] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [explicitGetDataTriggered, setExplicitGetDataTriggered] = useState(false);


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
        handleMFUKeyChange(null);
        setFileInputVisible(false)
        setSelectedDatabaseKey(e.target.value);
    }, []);

    const handleMFUKeyChange = useCallback((e) => {
        setSelectedMFUKey(e ? e.target.value : '');
    }, []);


    const handleOperatorOrBatchIdClick = useCallback((operatorOrBatchId) => {
        if (operatorOrBatchId !== '') {
            setUserInput(operatorOrBatchId);
            setExplicitGetDataTriggered(false);
        }
    }, []);

    useEffect(() => {
        if (userInput !== '' && (userInput.includes('SB') || userInput.includes('GB') || userInput.includes('OP') || userInput.includes('SFU'))) {
            handleGetData();
        }
    }, [userInput, selectedMFUKey, selectedDatabaseKey]);

    var serverUrl = ""
    // const serverUrl='http://localhost:5001';
    // serverUrl = 'https://tempehtoday-f866c.web.app';
    serverUrl = window.location.origin;
    // serverUrl = 'http://localhost:5000/tempehtoday-f866c/us-central1/app';

    useEffect(() => {
        const databaseRef = ref(db);
        const onDataChange = (snapshot) => {
            const existingData = snapshot.val();
            if (existingData != null) {
                const databaseKeys = Object.keys(existingData);
                setDataKeys(databaseKeys);
            }
        };
        const unsubscribe = onValue(databaseRef, onDataChange);
        const getData = async () => {
            try {
                const existingDataSnapshot = await get(databaseRef);
                onDataChange(existingDataSnapshot);
            } catch (error) {
                console.error('Error fetching initial data:', error.message);
            }
        };
        getData();
        return () => {
            off(databaseRef, onDataChange);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const databasePath = selectedDatabaseKey === 'SFU' || selectedDatabaseKey === 'RAW_MATERIALS'
            ? selectedDatabaseKey
            : `${selectedDatabaseKey}/MFU`;
        const databaseRef = ref(db, databasePath);
        const onDataChange = (snapshot) => {
            const existingData = snapshot.val();
            if (existingData != null) {
                const mfuIds = Object.keys(existingData);
                setMfuIds(mfuIds);
            }
        };
        const unsubscribe = onValue(databaseRef, onDataChange);
        const getData = async () => {
            try {
                const existingDataSnapshot = await get(databaseRef);
                onDataChange(existingDataSnapshot);
            } catch (error) {
                console.error('Error fetching initial data:', error.message);
            }
        };
        getData();
        return () => {
            off(databaseRef, onDataChange);
            unsubscribe();
        };
    }, [selectedDatabaseKey]);



    useEffect(() => {
        setData(null);
    }, [file]);

    const handleGetData = async () => {
        setLoading(true);
        try {
            if (!selectedMFUKey || (selectedMFUKey && explicitGetDataTriggered)) {
                setData('');
                setMessage('');
                setErrorMessage(selectedDatabaseKey === 'MFU_DB'
                    ? 'MFU ID is required'
                    : selectedDatabaseKey === 'SFU'
                        ? 'SFU ID is required'
                        : 'Raw Materials is required');
                console.error('Enter the ID');
                return;
            }

            const response = await axios.get(`${serverUrl}/fetchData?MFU_ID=${selectedMFUKey}&databaseKey=${selectedDatabaseKey}&enteredValue=${userInput}`);
            const rawData = response.data;

            setErrorMessage('');
            setData('');
            setMessage('');

            if (selectedDatabaseKey === 'SFU') {
                if (!rawData) {
                    setErrorMessage(`No Data found for ${selectedMFUKey}`);
                } else {
                    if (userInput.includes("SB")) {
                        if (!rawData) {

                            setErrorMessage(`No Data found for ${userInput}`);
                        } else {
                            const transformedData = transformDatasfusb(rawData, userInput);
                            setData(transformedData);
                        }
                    } else if (userInput.includes('GB')) {
                        if (!rawData) {
                            setErrorMessage(`No Data found for ${userInput}`);
                        } else {
                            const transformedData = transformDatasfugb(rawData, userInput);
                            setData(transformedData);
                        }
                    } else if (userInput.includes('SFU')) {
                        if (!rawData) {
                            setErrorMessage(`No Data found for ${userInput}`);
                        } else {
                            const transformedData = transformDatasfus(rawData, userInput);
                            setData(transformedData);
                        }
                    }
                    else {
                        const transformedData = transformDatasfu(rawData, selectedMFUKey);
                        setData(transformedData);
                    }
                }
            } else if (selectedDatabaseKey === "RAW_MATERIALS") {
                if (!rawData) {
                    setErrorMessage(`No Data found for ${selectedMFUKey}`);
                } else {
                    const transformedData = transformDataRawMaterials(rawData, selectedMFUKey);
                    setData(transformedData);
                }
            }
            else {
                if (userInput.includes('SB')) {
                    if (!rawData) {
                        setErrorMessage(`No Data found for ${userInput}`);
                    } else {
                        const transformedData = transformDatasb(rawData, userInput);
                        setData(transformedData);
                    }
                } else if (userInput.includes('GB')) {
                    if (!rawData) {
                        setErrorMessage(`No Data found for ${userInput}`);
                    } else {
                        const transformedData = transformDatagb(rawData, userInput);
                        setData(transformedData);
                    }
                } else if (userInput.includes('_OP')) {
                    const transformedData = transformDataop(rawData);
                    setData(transformedData);
                } else {
                    const transformedData = transformDatamfu(rawData, selectedDatabaseKey, userInput);
                    setData(transformedData);
                }
            }
        } catch (error) {
            if (userInput) {
                setErrorMessage(`No Record found of ${userInput}`);
            } else {
                setErrorMessage(`No Record of ${selectedMFUKey}`);
            }
            console.error('Error getting data:', error);
        } finally {
            setLoading(false);
        }
    };


    const colorMapping = {
        "49743A": "Green",
        "F5692B": "Red",
        "F7A81C": "Orange",
        "3634AB": "Blue",
        "AB34A6": "Purple",
        "FFFF44": "Yellow",
        "000000": "Black",
        "93D3FC": "Light Blue",
        "FDFFFD": "White",
    };
    const transformDatasb = (sbData, userInput) => {
        if (!sbData || typeof sbData !== 'object') {
            console.error('Invalid sbData structure');
            return [];
        }

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

        return [row];
    }

    const transformDatagb = (jsonData, userInput) => {
        if (!jsonData || typeof jsonData !== 'object') {
            console.error('Invalid jsonData structure');
            return [];
        }

        const result = [];

        Object.keys(jsonData).forEach(sbID => {
            if (['DATE', 'TIME', 'operatorId'].includes(sbID)) {
                return; // Skip unnecessary rows
            }

            const sbData = jsonData[sbID];

            if (!sbData || typeof sbData !== 'object') {
                console.error(`Invalid sbData structure for SB_ID: ${sbID}`);
                return;
            }

            const row = {
                GB_ID: userInput || '',
                'GENERAL-BATCH DATE': jsonData.DATE || '',
                'GENERAL-BATCH TIME': jsonData.TIME || '',
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
        });

        return result;
    }

    const transformDataop = (operatorData) => {
        return [{
            Operator_ID: operatorData.Operator_ID || '',
            Operator_image: operatorData.Operator_image || '',
            Operator_name: operatorData.Operator_name || '',
        }];
    }

    const transformDatamfu = (jsonData, selectedDatabaseKey, enteredValue) => {
        const result = [];

        if (!jsonData[selectedDatabaseKey]) {
            console.error(`Error: ${selectedDatabaseKey} not found in jsonData`);
            return result;
        }

        const selectedData = jsonData[selectedDatabaseKey].GB;

        if (!enteredValue) {
            Object.keys(selectedData).forEach(gbID => {
                if (['DATE', 'TIME', 'operatorId'].includes(gbID)) {
                    return; // Skip unnecessary rows
                }

                const gbData = selectedData[gbID];

                Object.keys(gbData).forEach(sbID => {
                    if (['DATE', 'TIME', 'operatorId'].includes(sbID)) {
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

    const transformDatasfusb = (sbData, userInput) => {
        if (!sbData || typeof sbData !== 'object') {
            console.error('Invalid sbData structure');
            return [];
        }

        const row = {
            SB_ID: userInput || '',
            'SUB-BATCH DATE': sbData.DATE || '',
            'SUB-BATCH TIME': sbData.TIME || '',
            'SC_ID': sbData.SC_ID || '',
            '%SC': sbData.SCp || '',
            'VIN_ID': sbData.VIN_ID || '',
            'VTBL_ID': sbData.VTBL_ID || '',
            OPERATOR: sbData.operatorId || '',
            'SOAKING PH': sbData.SOAKING?.ph || '',
            'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
            'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
            'BOILING START': sbData.BOILING?.START?.StartTime || '',
            'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
            'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
            'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
            'SFU START': sbData.SFU?.START?.StartTime || '',
            'SFU STOP': sbData.SFU?.STOP?.StopTime || '',
        };

        return [row];
    }

    const transformDatasfugb = (jsonData, userInput) => {
        if (!jsonData || typeof jsonData !== 'object') {
            console.error('Invalid jsonData structure');
            return [];
        }

        const result = [];

        Object.keys(jsonData).forEach(sbID => {
            if (['DATE', 'TIME', 'operatorId'].includes(sbID)) {
                return; // Skip unnecessary rows
            }

            const sbData = jsonData[sbID];

            if (!sbData || typeof sbData !== 'object') {
                console.error(`Invalid sbData structure for SB_ID: ${sbID}`);
                return;
            }

            const row = {
                GB_ID: userInput || '',
                'GENERAL-BATCH DATE': jsonData.DATE || '',
                'GENERAL-BATCH TIME': jsonData.TIME || '',
                SB_ID: sbID || '',
                'SUB-BATCH DATE': sbData.DATE || '',
                'SUB-BATCH TIME': sbData.TIME || '',
                'SC_ID': sbData.SC_ID || '',
                '%SC': sbData.SCp || '',
                'VIN_ID': sbData.VIN_ID || '',
                'VTBL_ID': sbData.VTBL_ID || '',
                OPERATOR: sbData.operatorId || '',
                'SOAKING PH': sbData.SOAKING?.ph || '',
                'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
                'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
                'BOILING START': sbData.BOILING?.START?.StartTime || '',
                'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
                'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
                'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
                'SFU START': sbData.SFU?.START?.StartTime || '',
                'SFU STOP': sbData.SFU?.STOP?.StopTime || '',
            };

            result.push(row);
        });

        return result;
    }

    const transformDatasfus = (jsonDatas, userInput) => {
        if (!jsonDatas || typeof jsonDatas !== 'object') {
            console.error('Invalid jsonData structure');
            return [];
        }

        const result = [];

        const jsonData = jsonDatas.GB;

        Object.keys(jsonData).forEach(gbID => {
            const gbData = jsonData[gbID];
            console.log("GBdta:", gbID);

            Object.keys(gbData).forEach(sbID => {
                if (['DATE', 'TIME', 'operatorId'].includes(sbID)) {
                    return; // Skip unnecessary rows
                }

                const sbData = gbData[sbID];

                if (!sbData || typeof sbData !== 'object') {
                    console.error(`Invalid sbData structure for SB_ID: ${sbID}`);
                    return;
                }

                const row = {
                    GB_ID: gbID || '',
                    'GENERAL-BATCH DATE': gbData.DATE || '',
                    'GENERAL-BATCH TIME': gbData.TIME || '',
                    SB_ID: sbID || '',
                    'SUB-BATCH DATE': sbData.DATE || '',
                    'SUB-BATCH TIME': sbData.TIME || '',
                    'SC_ID': sbData.SC_ID || '',
                    '%SC': sbData.SCp || '',
                    'VIN_ID': sbData.VIN_ID || '',
                    'VTBL_ID': sbData.VTBL_ID || '',
                    OPERATOR: sbData.operatorId || '',
                    'SOAKING PH': sbData.SOAKING?.ph || '',
                    'SOAKING START': sbData.SOAKING?.START?.StartTime || '',
                    'SOAKING STOP': sbData.SOAKING?.STOP?.StopTime || '',
                    'BOILING START': sbData.BOILING?.START?.StartTime || '',
                    'BOILING Reboil': sbData.BOILING?.REBOIL?.ReboilTime || '',
                    'BOILING STOP': sbData.BOILING?.STOP?.StopTime || '',
                    'COOLING TEMPERATURE': sbData.INOCULATION?.temperature || '',
                    'SFU START': sbData.SFU?.START?.StartTime || '',
                    'SFU STOP': sbData.SFU?.STOP?.StopTime || '',
                };

                result.push(row);
            });
        });

        return result;
    }

    const transformDatasfu = (jsonData, selectedDatabaseKey) => {
        const result = [];

        const processSubBatch = (subBatchData, batchId) => {
            Object.keys(subBatchData).forEach(ssubBatchId => {
                if (['DATE', 'TIME', 'operatorId', 'SC_ID', 'SCp', 'VIN_ID', 'VTBL_ID'].includes(ssubBatchId)) {
                    return; // Skip unnecessary rows
                }
                const ssubBatchData = subBatchData[ssubBatchId];

                processNestedData(ssubBatchData, batchId, ssubBatchId);
            });
        };

        const processNestedData = (ssubBatchData, batchId, subBatchId) => {
            Object.keys(ssubBatchData).forEach(sssubBatchId => {
                if (
                    ['DATE', 'TIME', 'operatorId', 'SC_ID', 'SCp', 'VIN_ID', 'VTBL_ID'].includes(sssubBatchId)
                ) {
                    return; // Skip unnecessary rows
                }
                const sssubBatchData = ssubBatchData[sssubBatchId];

                const row = {
                    'LOCATION': selectedDatabaseKey || '',
                    'SFU': batchId || '',
                    GB_ID: subBatchId || '',
                    'GENERAL-BATCH DATE': ssubBatchData.DATE || '',
                    'GENERAL-BATCH TIME': ssubBatchData.TIME || '',
                    SB_ID: sssubBatchId || '',
                    'SUB-BATCH DATE': sssubBatchData.DATE || '',
                    'SUB-BATCH TIME': sssubBatchData.TIME || '',
                    'SC_ID': sssubBatchData.SC_ID || '',
                    '%SC': sssubBatchData.SCp || '',
                    'VIN_ID': sssubBatchData.VIN_ID || '',
                    'VTBL_ID': sssubBatchData.VTBL_ID || '',
                    OPERATOR: ssubBatchData.operatorId || '',
                    'SOAKING PH': sssubBatchData.SOAKING?.ph || '',
                    'SOAKING START': sssubBatchData.SOAKING?.START?.StartTime || '',
                    'SOAKING STOP': sssubBatchData.SOAKING?.STOP?.StopTime || '',
                    'BOILING START': sssubBatchData.BOILING?.START?.StartTime || '',
                    'BOILING Reboil': sssubBatchData.BOILING?.REBOIL?.ReboilTime || '',
                    'BOILING STOP': sssubBatchData.BOILING?.STOP?.StopTime || '',
                    'COOLING TEMPERATURE': sssubBatchData.INOCULATION?.temperature || '',
                    'SFU START': sssubBatchData.SFU?.START?.StartTime || '',
                    'SFU STOP': sssubBatchData.SFU?.STOP?.StopTime || '',
                };

                result.push(row);
            });
        };

        Object.keys(jsonData).forEach(batchId => {
            if (['DATE', 'TIME', 'operatorId'].includes(batchId)) {
                return; // Skip unnecessary rows
            }

            const batchData = jsonData[batchId];

            Object.keys(batchData).forEach(subBatchId => {
                if (['DATE', 'TIME', 'operatorId'].includes(subBatchId)) {
                    return; // Skip unnecessary rows
                }

                const subBatchData = batchData[subBatchId];

                processSubBatch(subBatchData, batchId);
            });
        });

        return result;
    }

    const transformDataRawMaterials = (jsonData, selectedKey) => {
        const result = [];

        const fieldMappings = {
            "Product intake": {
                "OPERATOR": "OPERATOR",
                "DATE OF INTAKE": "DATEINTAKE",
                "IN FREEZER": "INFREEZER",
                "QUALITY APPROVED": "QUALITYAPP",
                "TOTAL WEIGHT": "TOTALWEIGHT",
                "USED IN BATCH": "USEDBATCH"
            },
            "Rice flower": {
                "LOT NR":"LOT_NR",
                "SUPPLIER": "SUPPLIER",
                "INVOICE NO": "INVOICENO",
                "RECEIPT DATE": "RECEIPTDATE",
                "RESIDUAL STOCK":"RESIDUALSTK",
                "EXPIRY DATE": "EXPIRYDATE",
            },
            "Soybean": {
                "LOT NR":"LOT_NR",
                "SUPPLIER": "SUPPLIER",
                "HARVEST DATE": "HARVESTDATE",
                "INVOICE NO": "INVOICENO",
                "RECEIPT DATE": "RECEIPTDATE",
                "RESIDUAL STOCK":"RESIDUALSTK",
                "STRAIN": "STRAIN",
                "EXPIRY DATE": "EXPIRYDATE",
            },
            "Starter Culture": {
                "LOT NR":"LOT_NR",
                "SUPPLIER": "SUPPLIER",
                "INVOICE NO": "INVOICENO",
                "RECEIPT DATE": "RECEIPTDATE",
                "STRAIN": "STRAIN",
                "EXPIRY DATE": "EXPIRYDATE",
            },
            "Vinegar": {
                "BATCH ID":"BATCHID",
                "LOT NR":"LOT_NR",
                "SUPPLIER": "SUPPLIER",
                "INVOICE NO": "INVOICENO",
                "RECEIPT DATE": "RECEIPTDATE",
                "RESIDUAL STOCK":"RESIDUALSTK",
                "EXPIRY DATE": "EXPIRYDATE",
            },
            "Vitblend": {
                "LOT NR":"LOT_NR",
                "SUPPLIER": "SUPPLIER",
                "INVOICE NO": "INVOICENO",
                "RECEIPT DATE": "RECEIPTDATE",
                "PRODUCTION DATE":"PRODDATE",
                "RESIDUAL STOCK":"RESIDUALSTK",
                "EXPIRY DATE": "EXPIRYDATE",
            }
        };

        if (!jsonData || typeof jsonData !== 'object') {
            console.error('Invalid jsonData structure');
            return [];
        }

        if (!fieldMappings[selectedKey]) {
            console.error(`Invalid selectedKey: ${selectedKey}`);
            return [];
        }

        Object.keys(jsonData).forEach(sbID => {
            if (['DATE', 'TIME', 'operatorId'].includes(sbID)) {
                return; // Skip unnecessary rows
            }

            const sbData = jsonData[sbID];
            const mapping = fieldMappings[selectedKey];

            if (!sbData || typeof sbData !== 'object') {
                console.error(`Invalid sbData structure for SB_ID: ${sbID}`);
                return;
            }
            var row = {};
            row = selectedKey === "Product intake" ?
            {
                "MFU SBID": sbID || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : selectedKey === "Rice flower" ? {
                "BATCH ID": sbID.replace(/_/g, '.') || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : selectedKey === "Soybean" ? {
                SoyBID: sbID || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : selectedKey === "Starter Culture" ? {
                "STARTER CULTURE ID": sbID || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : selectedKey === "Vinegar" ? {
                "VID": sbID || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : selectedKey === "Vitblend" ? {
                "VITBL_ID": sbID || '',
                ...Object.keys(mapping).reduce((acc, key) => {
                acc[key] = sbData[mapping[key]] || '';
                return acc;
                }, {})
            } : {};

                  result.push(row);
        });

        return result;
    };


    return (
        <main className="flex-grow flex flex-col items-center justify-center overflow-y-auto">

            <div className={`container mx-auto my-8 p-4 lg:p-0 flex flex-col items-center lg:flex-row lg:justify-between flex-grow ${data && "mt-32"}`}>
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
        </main>
    );
};

export default Home;