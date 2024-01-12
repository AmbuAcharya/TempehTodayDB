import { useCallback } from "react";
import SfuDbData from "./SfuDbData";
import { get, push, ref, set } from "firebase/database";
import { db } from "../firebaseConfig";
import { read, utils } from "xlsx";

const RenderDatabaseData = ({ selectedDatabaseKey, MfuDbData, fileInputVisible, handleGetData, handleMFUKeyChange, mfuIds, setFileInputVisible, selectedMFUKey, setUserInput, userInput, setFile, file, setLoading,
    setErrorMessage, setMessage }) => {

    const ColorMapping = {
        "Green": '34AB83',
        "Red": 'F5692B',
        "Orange": 'F7A81C',
        "White": 'FDFFFD',
        "Light Green": 'AB9F34',
        "Blue": '3634AB',
        "Brown": 'AB3449',
        "Purple": 'AB34A6',
        "Yellow": 'D4D400',
    };
    
    const handleFileUpload = async () => {
        setErrorMessage('');
        setMessage('');
        if (file) {
            setLoading(true);
            try {
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
                                        const { GB_ID, SB_ID, 'GENERAL-BATCH DATE': GB_DATE, 'GENERAL-BATCH TIME': GB_TIME, 'SUB-BATCH DATE': SB_DATE, 'SUB-BATCH TIME': SB_TIME, 'OPERATOR': OPERATOR_ID, STATUS, COLOR, 'SOAKING START': SOAKING_START, 'SOAKING STOP': SOAKING_STOP, 'BOILING START': BOILING_START, 'BOILING Reboil': BOILING_Reboil, 'BOILING STOP': BOILING_STOP, 'MFU START': MFU_START, 'MFU STOP': MFU_STOP, 'COOLING TEMPERATURE': INOCULATION_TEMPERATURE, 'SOAKING PH': SOAKING_PH } = row;
    
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
                                                    REBOIL: {
                                                        ReboilTime: BOILING_Reboil || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: BOILING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        StartTime: BOILING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: SB_DATE || null,
                                                COLOR: ColorMapping[COLOR] || null,
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
                                        else {
                                            // Update existing data if GB_ID and SB_ID already exist
                                            GBNode[GB_ID][SB_ID] = {
                                                BOILING: {
                                                    REBOIL: {
                                                        ReboilTime: BOILING_Reboil || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    STOP: {
                                                        StopTime: BOILING_STOP || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    },
                                                    START: {
                                                        StartTime: BOILING_START || null,
                                                        Operator_ID: OPERATOR_ID || null,
                                                    }
                                                },
                                                DATE: SB_DATE || null,
                                                COLOR: ColorMapping[COLOR] || null,
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
                                if (!result[selectedMFUKey]) {
                                    result[selectedMFUKey] = {
                                        [sfuCellValue]: {
                                            GB: {}
                                        }
                                    };
                                }
    
                                const GBNode = result[selectedMFUKey][sfuCellValue].GB;
    
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
                                                const {GB_ID, 'GENERAL-BATCH DATE': GB_DATE, 'GENERAL-BATCH TIME': GB_TIME, SB_ID, 'SUB-BATCH DATE': SB_DATE, 'SUB-BATCH TIME': SB_TIME, SC_ID, '%SC': SCp, VIN_ID, VTBL_ID, OPERATOR, 'SOAKING PH': SOAKING_PH, 'SOAKING START': SOAKING_START, 'SOAKING STOP': SOAKING_STOP, 'BOILING START': BOILING_START, 'BOILING Reboil': BOILING_Reboil, 'BOILING STOP': BOILING_STOP, 'COOLING TEMPERATURE': INOCULATION_TEMPERATURE, 'SFU START': SFU_START, 'SFU STOP': SFU_STOP } = row;
                                                
                                                if (!GBNode[GB_ID]) {
                                                    GBNode[GB_ID] = {
                                                        DATE: GB_DATE || null,
                                                        TIME: GB_TIME || null,
                                                        operatorId: OPERATOR || null,
                                                    };
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
                }catch (error) {
                    setMessage('');
                    setErrorMessage('Enter Location');
                    console.error('Error uploading file:', error);
                } finally {
                    setLoading(false);
                }
            }
        }catch (error)
        {
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
                />
            );
        default:
            return null;
    }
};

export default RenderDatabaseData;