import { useCallback } from "react";
import SfuDbData from "./SfuDbData";
import { get, push, ref, set } from "firebase/database";
import { db } from "../firebaseConfig";
import { read, utils } from "xlsx";
import RawMaterialsDbData from "./RawMaterialsDbData";

const RenderDatabaseData = ({ selectedDatabaseKey, MfuDbData, fileInputVisible, handleGetData, handleMFUKeyChange, mfuIds, setFileInputVisible, selectedMFUKey, setUserInput, userInput, setFile, file, setLoading,
    setErrorMessage, setMessage }) => {

    const ColorMapping = {
        "Green": '49743A',
        "Red": 'F5692B',
        "Orange": 'F7A81C',
        "Blue": '3634AB',
        "Purple": 'AB34A6',
        "Yellow": 'FFFF44',
        "Black": '000000',
        "Light Blue": '93D3FC',
        "White": 'FDFFFD',
    };

    const handleFileUpload = async () => {
        setErrorMessage('');
        setMessage('');
        if (file) {
            setLoading(true);
            try {
                function extractValueForKeywordRAW(row, keyword) {
                    let keyWithKeyword = null;
                    
                    // Iterate over keys and find the first key containing the current keyword
                    for (const key in row) {
                        if (Object.prototype.hasOwnProperty.call(row, key) && key.includes(keyword)) {
                        keyWithKeyword = key;
                        break; // Stop iterating after finding the first key containing the keyword
                        }
                    }
                    
                    // Return the value associated with the keyword
                    return keyWithKeyword ? row[keyWithKeyword] : null;
                }
                
                function extractValueForKeyword(row, mainKey, subKey) {
                    let mainKeyFound = false;
                
                    // Iterate over keys and find the first key containing the main key
                    for (const key in row) {
                        if (Object.prototype.hasOwnProperty.call(row, key) && key.includes(mainKey)) {
                            mainKeyFound = true;
                
                            // Check if the key contains the subkey
                            if (key.includes(subKey)) {
                                return row[key];
                            }
                        } else if (mainKeyFound) {
                            // If main key is found and the current key does not contain the subkey,
                            // check if the next key in the same line contains the subkey
                            if (key.includes(subKey)) {
                                return row[key];
                            }
                        }
                    }
                
                    return null;
                }
                
                if (selectedDatabaseKey === "MFU_DB") {
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

                                if (excelData.length === 0) {
                                    setErrorMessage('No data in Excel');
                                    console.log('No data in Excel');
                                }
                                else {
                                    excelData.forEach(row => {
                                        const { GB_ID, SB_ID, OPERATOR_ID, STATUS, COLOR } = row;

                                        if (!GBNode[GB_ID]) {
                                            GBNode[GB_ID] = {
                                                DATE: extractValueForKeyword(row,'GENERAL-BATCH', 'DATE') || null,
                                                TIME: extractValueForKeyword(row,'GENERAL-BATCH','TIME') || null,
                                                operatorId: OPERATOR_ID || null
                                            };
                                        }
                                        else {
                                            // Update existing data if GB_ID already exists
                                            GBNode[GB_ID].DATE = extractValueForKeyword(row, 'GENERAL-BATCH','DATE') || GBNode[GB_ID].DATE;
                                            GBNode[GB_ID].TIME = extractValueForKeyword(row, 'GENERAL-BATCH','TIME') || GBNode[GB_ID].TIME;
                                            GBNode[GB_ID].operatorId = OPERATOR_ID || GBNode[GB_ID].operatorId;
                                        }

                                        if (!GBNode[GB_ID][SB_ID]) {
                                            GBNode[GB_ID][SB_ID] = {
                                                BOILING: {
                                                    REBOIL: {
                                                        ReboilTime: extractValueForKeyword(row,'BOILING','Reboil') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'BOILING','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'BOILING','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: extractValueForKeyword(row,'SUB-BATCH','DATE') || null,
                                                COLOR: ColorMapping[COLOR] || null,
                                                INOCULATION: {
                                                    Operator_ID: OPERATOR_ID || null,
                                                    temperature: extractValueForKeyword(row,'COOLING','TEMPERATURE') || null,
                                                },
                                                MFU: {
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'MFU','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'MFU','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                SOAKING: {
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'SOAKING','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'SOAKING','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    ph: extractValueForKeyword(row,'SOAKING','PH') || null,
                                                },
                                                status: STATUS || null,
                                                TIME: extractValueForKeyword(row,'SUB-BATCH','TIME') || null,
                                                operatorId: OPERATOR_ID || null,
                                            };
                                        }
                                        else {
                                            // Update existing data if GB_ID and SB_ID already exist
                                            GBNode[GB_ID][SB_ID] = {
                                                BOILING: {
                                                    REBOIL: {
                                                        ReboilTime: extractValueForKeyword(row,'BOILING','Reboil') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'BOILING','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'BOILING','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: extractValueForKeyword(row,'SUB-BATCH','DATE') || null,
                                                COLOR: ColorMapping[COLOR] || null,
                                                INOCULATION: {
                                                    Operator_ID: OPERATOR_ID || null,
                                                    temperature: extractValueForKeyword(row,'COOLING','TEMPERATURE') || null,
                                                },
                                                MFU: {
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'MFU','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'MFU','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                SOAKING: {
                                                    START: {
                                                        StartTime: extractValueForKeyword(row,'SOAKING','START') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: extractValueForKeyword(row,'SOAKING','STOP') || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    ph: extractValueForKeyword(row,'SOAKING','PH') || null,
                                                },
                                                status: STATUS || null,
                                                TIME: extractValueForKeyword(row,'SUB-BATCH','TIME') || null,
                                                operatorId: OPERATOR_ID || null,
                                            };
                                        }
                                    });

                                    setMessage('File uploaded successfully');
                                    console.log('File uploaded successfully');
                                }
                            } catch (sheetError) {
                                console.error(`Error processing sheet "${sheetName}":`, sheetError);
                                // Handle the error, set an appropriate error message, or skip the sheet
                            }
                            finally{
                                setLoading(false);
                            }
                        }

                        console.log('Data processing complete. Uploading to the database.');
                        // Set the value in the database
                        await set(refNode, result);

                    } else {
                        console.error('Workbook does not contain any sheets.');
                        // Handle the case where the workbook is empty
                        setErrorMessage('Workbook does not contain any sheets.');
                    }

                } else if (selectedDatabaseKey === "SFU") {
                    try {
                        const workbook = read(file.buffer, { type: 'buffer' });
                        const sheetNames = workbook.SheetNames;

                        if (sheetNames.length > 0) {
                            console.log('Workbook contains sheets');

                            const refPath = `${selectedDatabaseKey}`;
                            const refNode = ref(db, refPath);

                            const existingDataSnapshot = await get(refNode);
                            const existingData = existingDataSnapshot.val();

                            const result = { ...existingData };
                            console.log('Existing data:', result);

                            if (sheetNames.length > 0) {
                                const firstSheetName = sheetNames[0];
                                const firstSheet = workbook.Sheets[firstSheetName];

                                let sfuCellValue;
                                for (const col in firstSheet) {
                                    if (col.startsWith('!')) continue;
                                    const header = firstSheet[col].v;
                                    if (header === 'SFU') {
                                        const rowIndex = parseInt(col.substring(1));
                                        const nextRow = rowIndex + 1;
                                        const sfuCell = firstSheet[col.replace(rowIndex, nextRow.toString())];
                                        sfuCellValue = sfuCell ? sfuCell.v : undefined;
                                        break;
                                    }
                                }

                                if (sfuCellValue) {
                                    if (!result[selectedMFUKey] || !result[selectedMFUKey][sfuCellValue]) {
                                        result[selectedMFUKey] = {
                                            ...result[selectedMFUKey],
                                            [sfuCellValue]: {
                                                GB: {}
                                            }
                                        };
                                    }

                                    let GBNode = result[selectedMFUKey][sfuCellValue].GB;

                                    for (const sheetName of sheetNames) {
                                        const sheet = workbook.Sheets[sheetName];

                                        try {
                                            const excelData = utils.sheet_to_json(sheet, { raw: false });
                                            console.log(`Processing sheet "${sheetName}" with ${excelData.length} rows`);
                                            if (excelData.length === 0) {
                                                setErrorMessage('No data in Excel');
                                                console.log('No data in Excel');
                                            } else {

                                                excelData.forEach(row => {
                                                    const { SFU, GB_ID, 'GENERAL-BATCH\nDATE': GB_DATE, 'GENERAL-BATCH\nTIME': GB_TIME, SB_ID, 'SUB-BATCH\nDATE': SB_DATE, 'SUB-BATCH\nTIME': SB_TIME, SC_ID, '%SC': SCp, VIN_ID, VTBL_ID, OPERATOR, 'SOAKING\nPH': SOAKING_PH, 'SOAKING\nSTART': SOAKING_START, 'SOAKING\nSTOP': SOAKING_STOP, 'BOILING\nSTART': BOILING_START, 'BOILING\nReboil': BOILING_Reboil, 'BOILING\nSTOP': BOILING_STOP, 'COOLING\nTEMPERATURE': INOCULATION_TEMPERATURE, 'SFU\nSTART': SFU_START, 'SFU\nSTOP': SFU_STOP } = row;
                                                    
                                                    if (SFU !== sfuCellValue) {
                                                        // If SFU value changes, update sfuCellValue and create a new node
                                                        sfuCellValue = SFU;

                                                        if (!result[selectedMFUKey][sfuCellValue]) {
                                                            result[selectedMFUKey][sfuCellValue] = {
                                                                GB: {}
                                                            };
                                                        }

                                                        GBNode = result[selectedMFUKey][sfuCellValue].GB;
                                                    }

                                                    if (!GBNode[GB_ID]) {
                                                        GBNode[GB_ID] = {
                                                            DATE: GB_DATE || null,
                                                            TIME: GB_TIME || null,
                                                            operatorId: OPERATOR || null,
                                                        };
                                                    }
                                                    else {
                                                        // Update existing data if GB_ID already exists
                                                        GBNode[GB_ID].DATE = GB_DATE || GBNode[GB_ID].DATE;
                                                        GBNode[GB_ID].TIME = GB_TIME || GBNode[GB_ID].TIME;
                                                        GBNode[GB_ID].operatorId = OPERATOR || GBNode[GB_ID].operatorId;
                                                    }

                                                    if (!GBNode[GB_ID][SB_ID]) {
                                                        GBNode[GB_ID][SB_ID] = {
                                                            BOILING: {
                                                                REBOIL: {
                                                                    ReboilTime: BOILING_Reboil || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: BOILING_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                START: {
                                                                    StartTime: BOILING_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                }
                                                            },
                                                            DATE: SB_DATE || null,
                                                            INOCULATION: {
                                                                Operator_ID: OPERATOR || null,
                                                                temperature: INOCULATION_TEMPERATURE || null,
                                                            },
                                                            SFU: {
                                                                START: {
                                                                    StartTime: SFU_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: SFU_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                }
                                                            },
                                                            SOAKING: {
                                                                START: {
                                                                    StartTime: SOAKING_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: SOAKING_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                ph: SOAKING_PH || null,
                                                            },
                                                            SC_ID: SC_ID || null,
                                                            SCp: SCp || null,
                                                            VIN_ID: VIN_ID || null,
                                                            VTBL_ID: VTBL_ID || null,
                                                            TIME: SB_TIME || null,
                                                            operatorId: OPERATOR || null,
                                                        };
                                                    } else {
                                                        // Update existing data if GB_ID and SB_ID already exist
                                                        GBNode[GB_ID][SB_ID] = {
                                                            BOILING: {
                                                                REBOIL: {
                                                                    ReboilTime: BOILING_Reboil || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: BOILING_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                START: {
                                                                    StartTime: BOILING_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                }
                                                            },
                                                            DATE: SB_DATE || null,
                                                            INOCULATION: {
                                                                Operator_ID: OPERATOR || null,
                                                                temperature: INOCULATION_TEMPERATURE || null,
                                                            },
                                                            SFU: {
                                                                START: {
                                                                    StartTime: SFU_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: SFU_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                }
                                                            },
                                                            SOAKING: {
                                                                START: {
                                                                    StartTime: SOAKING_START || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                STOP: {
                                                                    StopTime: SOAKING_STOP || null,
                                                                    Operator_ID: OPERATOR || null,
                                                                },
                                                                ph: SOAKING_PH || null,
                                                            },
                                                            SC_ID: SC_ID || null,
                                                            SCp: SCp || null,
                                                            VIN_ID: VIN_ID || null,
                                                            VTBL_ID: VTBL_ID || null,
                                                            TIME: SB_TIME || null,
                                                            operatorId: OPERATOR || null,
                                                        };
                                                    }
                                                });

                                                setMessage('File uploaded successfully');
                                                console.log('File uploaded successfully');
                                            }
                                        } catch (sheetError) {
                                            console.error(`Error processing sheet "${sheetName}":`, sheetError);
                                            // Handle the error, set an appropriate error message, or skip the sheet
                                        }
                                    }

                                    console.log('Data processing complete. Uploading to the database.');
                                    // Set the value in the database
                                    await set(refNode, result);
                                } else {
                                    console.error('Workbook does not contain any sheets.');
                                    // Handle the case where the workbook is empty
                                    setErrorMessage('Workbook does not contain any sheets.');
                                }
                            }
                        }
                    } catch (error) {
                        setMessage('');
                        setErrorMessage('Enter Location');
                        console.error('Error uploading file:', error);
                    } finally {
                        setLoading(false);
                    }

                } else if (selectedDatabaseKey === "RAW_MATERIALS") {
                    try {
                        const workbook = read(file.buffer, { type: 'buffer' });
                        const sheetNames = workbook.SheetNames;

                        if (sheetNames.length > 0) {
                            console.log('Workbook contains sheets');

                            for (const sheetName of sheetNames) {
                                const sheet = workbook.Sheets[sheetName];

                                try {
                                    const excelData = utils.sheet_to_json(sheet, { raw: false });
                                    console.log(`Processing sheet "${sheetName}" with ${excelData.length} rows`);

                                    if (excelData.length === 0) {
                                        setErrorMessage('No data in Excel');
                                        console.log('No data in Excel');
                                    } else {
                                        if(selectedMFUKey==="Soybean"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const SoyBID = row['SoyBID'];
                                            if (!SoyBID) {
                                                console.error('SoyBID is missing in the row. Skipping row.');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${SoyBID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                              
                                              const result = {
                                                RESIDUALSTK: extractValueForKeywordRAW(row, 'RESIDUAL') || null,
                                                SUPPLIER: row.SUPPLIER || null,
                                                HARVESTDATE: extractValueForKeywordRAW(row, 'HARVEST') || null,
                                                STRAIN: row.STRAIN || null,
                                                LOT_NR: extractValueForKeywordRAW(row, 'LOT')|| null ,
                                                EXPIRYDATE: extractValueForKeywordRAW(row, 'EXPIRY')|| null,
                                                RECEIPTDATE: extractValueForKeywordRAW(row, 'RECEIPT')|| null,
                                                INVOICENO: extractValueForKeywordRAW(row, 'INVOICE')|| null,
                                                SOYBID: row.SoyBID || null,
                                              };
                                              
                                              
  
                                              
                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);

                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                            }
                                        }
                                    }else if(selectedMFUKey==="Starter Culture"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const ScID = extractValueForKeywordRAW(row,'STARTER');
                                            if (!ScID) {
                                                console.error('Starter Culture ID is missing in the row. Skipping row.');
                                                setErrorMessage('No Valid Excel File');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${ScID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                            const result = {
                                                SUPPLIER: row['SUPPLIER'] || null,
                                                STRAIN: row['STRAIN'] || null,
                                                LOT_NR: extractValueForKeywordRAW(row,'LOT') || null,
                                                EXPIRYDATE: extractValueForKeywordRAW(row,'EXPIRY') || null,
                                                RECEIPTDATE: extractValueForKeywordRAW(row,'RECEIPT') || null,
                                                INVOICENO: extractValueForKeywordRAW(row, 'INVOICE') || null,
                                                ScID: ScID || null,
                                            };

                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);
                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                            }
                                            
                                        }
                                    }else if(selectedMFUKey==="Vitblend"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const VITBLID = row['VITBL_ID'];
                                            if (!VITBLID) {
                                                console.error('VITBL_ID is missing in the row. Skipping row.');
                                                setErrorMessage('No Valid Excel File');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${VITBLID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                            const result = {
                                                RESIDUALSTK:extractValueForKeywordRAW(row,'RESIDUAL') || null,
                                                SUPPLIER: row['SUPPLIER'] || null,
                                                PRODDATE: extractValueForKeywordRAW(row,'PRODUCTION') || null,
                                                LOT_NR: extractValueForKeywordRAW(row,'LOT') || null,
                                                EXPIRYDATE: extractValueForKeywordRAW(row,'EXPIRY') || null,
                                                RECEIPTDATE: extractValueForKeywordRAW(row,'RECEIPT') || null,
                                                INVOICENO: extractValueForKeywordRAW(row,'INVOICE') || null,
                                                VITBLID: VITBLID || null,
                                            };

                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);

                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                        }
                                        }
                                    }else if(selectedMFUKey==="Vinegar"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const VID = row['VID'];
                                            if (!VID) {
                                                console.error('VID is missing in the row. Skipping row.');
                                                setErrorMessage('No Valid Excel File');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${VID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                            const result = {
                                                RESIDUALSTK: extractValueForKeywordRAW(row,'RESIDUAL') || null,
                                                SUPPLIER: row['SUPPLIER'] || null,
                                                BATCHID: extractValueForKeywordRAW(row,'BATCH') || null,
                                                LOT_NR: extractValueForKeywordRAW(row,'LOT') || null,
                                                EXPIRYDATE: extractValueForKeywordRAW(row,'EXPIRY') || null,
                                                RECEIPTDATE: extractValueForKeywordRAW(row,'RECEIPT') || null,
                                                INVOICENO: extractValueForKeywordRAW(row,'INVOICE') || null,
                                                VID: VID || null,
                                            };

                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);

                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                        }
                                        }
                                    }else if(selectedMFUKey==="Rice flower"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const BID = extractValueForKeywordRAW(row,'BATCH');
                                            if (!BID) {
                                                console.error('Batch ID is missing in the row. Skipping row.');
                                                setErrorMessage('No Valid Excel File');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${BID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                            const result = {
                                                RESIDUALSTK: extractValueForKeywordRAW(row,'RESIDUAL') || null,
                                                SUPPLIER: row['SUPPLIER'] || null,
                                                LOT_NR: extractValueForKeywordRAW(row,'LOT') || null,
                                                EXPIRYDATE: extractValueForKeywordRAW(row,'EXPIRY') || null,
                                                RECEIPTDATE: extractValueForKeywordRAW(row,'RECEIPT') || null,
                                                INVOICENO: extractValueForKeywordRAW(row,'INVOICE') || null,
                                                BID: BID || null,
                                            };

                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);
                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                        }
                                        }
                                    }else if(selectedMFUKey==="Product intake"){
                                        for (const row of excelData) {
                                            // Extract SoyBID from the Excel column 'SoyBID'
                                            const MFUSBID = extractValueForKeywordRAW(row,'MFU');
                                            if (!MFUSBID) {
                                                console.error('MFU SBID is missing in the row. Skipping row.');
                                                setErrorMessage('No Valid Excel File');
                                                continue;
                                            }
                                            else{
                                            // Replace 'RAW_MATERIALS' with the actual value of selectedDatabaseKey
                                            const refPath = `${selectedDatabaseKey}/${selectedMFUKey}/${MFUSBID}`;
                                            const refNode = ref(db, refPath);

                                            const existingDataSnapshot = await get(refNode);
                                            const existingData = existingDataSnapshot.val();
                                            
                                            
                                            const result = {
                                                OPERATOR: row['OPERATOR'] || null,
                                                TOTALWEIGHT: extractValueForKeywordRAW(row,'TOTAL') || null,
                                                DATEINTAKE: extractValueForKeywordRAW(row,'DATE') || null,
                                                QUALITYAPP: extractValueForKeywordRAW(row,'QUALITY') || null,
                                                INFREEZER: extractValueForKeywordRAW(row,'IN') || null,
                                                USEDBATCH: extractValueForKeywordRAW(row,'USED') || null,
                                                MFUSBID: MFUSBID || null,
                                            };

                                            console.log('Existing data:', existingData);
                                            console.log('New data:', result);

                                            // Set the value in the database
                                            await set(refNode, result);
                                            setMessage('File uploaded successfully');
                                            console.log('File uploaded successfully');
                                        }
                                        }
                                    }
                                    }
                                    
                                } catch (sheetError) {
                                    console.error(`Error processing sheet "${sheetName}":`, sheetError);
                                    // Handle the error, set an appropriate error message, or skip the sheet
                                }
                            }
                            console.log('Data processing complete.');
                        } else {
                            console.error('Workbook does not contain any sheets.');
                            // Handle the case where the workbook is empty
                            setErrorMessage('Workbook does not contain any sheets.');
                        }
                    } catch (error) {
                        setMessage('');
                        setErrorMessage('Enter Location');
                        console.error('Error uploading file:', error);
                    }
                    finally {
                        setLoading(false);
                    }
                }

            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFileChange = useCallback((e) => {
        const selectedFile = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const buffer = new Uint8Array(reader.result);
            setFile(buffer);
        };

        reader.readAsArrayBuffer(selectedFile);
    }, []);

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
                    setUserInput={setUserInput}
                    userInput={userInput}
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
                    setUserInput={setUserInput}
                    userInput={userInput}
                />
            );
        case 'RAW_MATERIALS':
            return (<RawMaterialsDbData
                fileInputVisible={fileInputVisible}
                handleFileChange={handleFileChange}
                handleFileUpload={handleFileUpload}
                handleGetData={handleGetData}
                handleMFUKeyChange={handleMFUKeyChange}
                mfuIds={mfuIds}
                selectedMFUKey={selectedMFUKey}
                setFileInputVisible={setFileInputVisible}
            />)
        default:
            return null;
    }
};

export default RenderDatabaseData;