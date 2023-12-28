const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const xlsx = require('xlsx');
const fs = require('fs');
const bodyParser = require('body-parser');

const serviceAccount = require('./tempehtoday-f866c-firebase-adminsdk-t0ceu-890bf43bd6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://tempehtoday-f866c-default-rtdb.firebaseio.com/',
  storageBucket: 'tempehtoday-f866c.appspot.com'
});

const db = admin.database();
const opimg = admin.storage();
const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/fetchDatabaseKeys', async (req, res) => {
  try {
    const sheetsSnapshot = await db.ref().once('value');
    const sheetNames = Object.keys(sheetsSnapshot.val());
    res.status(200).json(sheetNames);
  } catch (error) {
    console.error('Error fetching database keys:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/fetchIds', async (req, res) => {
  const selectedDatabaseKey = req.query.databaseKey;
  try {
    let mfuDataSnapshot;

    if (selectedDatabaseKey === "MFU_DB") {
      mfuDataSnapshot = await db.ref(selectedDatabaseKey + '/MFU').once('value');
    } else {
      mfuDataSnapshot = await db.ref(selectedDatabaseKey).once('value');
    }

    const mfuNodes = mfuDataSnapshot.val();
    
    // Extract MFU_IDs from the nodes
    const mfuIds = Object.keys(mfuNodes || {});

    res.status(200).json(mfuIds);
  } catch (error) {
    console.error('Error fetching MFU_IDs:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/createProfile', upload.single('Operator_image'), async (req, res) => {
  try {
    const { selectedDatabaseKey, mfuId, Operator_ID, Operator_name } = req.body;

    // Ensure req.file is present
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const imageBuffer = req.file.buffer;

    // Upload the image to Firebase Storage
    const bucket = opimg.bucket();  // Updated this line
    const imageFile = bucket.file(`Operators_image/${mfuId}/${Operator_ID}.jpg`);
    await imageFile.save(imageBuffer);
    await imageFile.makePublic();

    // Get the download URL of the uploaded image
    const imageURL = `https://storage.googleapis.com/${bucket.name}/${imageFile.name}`;
    // const imageURL = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2100' });

    // Save profile data to the database
    const databaseRef = db.ref(`${selectedDatabaseKey}/${mfuId}/Operator`);
    const newProfileRef = databaseRef.child(Operator_ID);
    await newProfileRef.set({
      Operator_ID,
      Operator_name,
      Operator_image: imageURL,
    });

    res.status(200).json({ success: true, message: 'Profile created successfully' });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

let lastUploadedFileName = null;

app.post('/SFUupload', upload.single('file'), async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const ref = db.ref(selectedDatabaseKey).child('SFU');
    const existingData = (await ref.once('value')).val() || {};

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      await addDataToRealtimeDatabase(selectedDatabaseKey, excelData, userProvidedDocumentId);
    }

    res.status(200).send('Data uploaded and added to Realtime Database successfully.');
  } catch (error) {
    console.error('Error uploading and processing Excel file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/uploadMFU', upload.single('file'), async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const ref = db.ref(selectedDatabaseKey).child('MFU');
    const existingData = (await ref.once('value')).val() || {};
    const result = { ...existingData };

    if (!result[userProvidedDocumentId]) {
      result[userProvidedDocumentId] = {
        GB: {}
      };
    }

    const GBNode = result[userProvidedDocumentId].GB;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      excelData.forEach(row => {
        const { GB_ID,	SB_ID, GB_DATE,	GB_TIME,	SB_DATE, SB_TIME,	OPERATOR_ID,	STATUS,	COLOR,	SOAKING_START,	SOAKING_STOP,	BOILING_START,	BOILING_Reboil,	BOILING_STOP,	MFU_START,	MFU_STOP,	INOCULATION_TEMPERATURE,	SOAKING_PH } = row;

        if (!GBNode[GB_ID]) {
          GBNode[GB_ID] = {
            DATE:GB_DATE || null,
            TIME:GB_TIME || null,
            operatorId:OPERATOR_ID || null};
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
            MFU:{
              START: {
                StartTime:MFU_START || null,
                Operator_ID: OPERATOR_ID || null,
              },
              STOP: {
                StopTime:MFU_STOP || null,
                Operator_ID: OPERATOR_ID || null,
              }
            },
            SOAKING: {
              START: {
                StartTime:SOAKING_START || null,
                Operator_ID: OPERATOR_ID || null,
              },
              STOP: {
                StopTime:SOAKING_STOP || null,
                Operator_ID: OPERATOR_ID || null,
              },
              ph:SOAKING_PH|| null,
            },
            status:STATUS|| null,
            TIME:SB_TIME|| null,
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
            MFU:{
              START: {
                StartTime:MFU_START || null,
                Operator_ID: OPERATOR_ID || null,
              },
              STOP: {
                StopTime:MFU_STOP || null,
                Operator_ID: OPERATOR_ID || null,
              }
            },
            SOAKING: {
              START: {
                StartTime:SOAKING_START || null,
                Operator_ID: OPERATOR_ID || null,
              },
              STOP: {
                StopTime:SOAKING_STOP || null,
                Operator_ID: OPERATOR_ID || null,
              },
              ph:SOAKING_PH|| null,
            },
            status:STATUS|| null,
            TIME:SB_TIME|| null,
            operatorId: OPERATOR_ID || null,
          };
        }
      });
    }

    await ref.set(result);
    

    res.status(200).send('Data uploaded and added to Realtime Database successfully.');
  } catch (error) {
    console.error('Error uploading and processing Excel file:', error);
    res.status(500).send('Internal Server Error');
  }
});


async function addDataToRealtimeDatabase(sheetName, data, userProvidedDocumentId) {
  try {
    const ref = db.ref(sheetName);

    for (const item of data) {
      const date = item['Date'];
      const time = item['Time'];

      if (!date || !time) {
        await ref.child(userProvidedDocumentId).push(item);
      } else {
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
        const dateMatch = date.match(dateRegex);
        const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/;
        const timeMatch = time.match(timeRegex);

        if (dateMatch && timeMatch) {
          const [, month, day, year] = dateMatch;
          const [, hours, minutes, seconds, ampm] = timeMatch;

          const formattedDate = new Date(year.length === 2 ? `20${year}` : year, month - 1, day);
          const formattedTime = `${hours.padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

          if (!isNaN(formattedDate.getTime())) {
            const datePath = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
            const timePath = formattedTime;

            delete item['Date'];
            delete item['Time'];

            await ref.child(userProvidedDocumentId).child(datePath).child(timePath).set(item);
          } else {
            console.error(`Skipping data with invalid date: ${date}`);
          }
        } else {
          console.error(`Skipping data with invalid date or time format - Date: ${date}, Time: ${time}`);
        }
      }
    }

    console.log(`Data added to Realtime Database under node "${sheetName}" successfully.`);
  } catch (error) {
    console.error(`Error adding data to Realtime Database under node "${sheetName}":`, error);
  }
}

app.get('/fetchData', async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;
    const enteredValue = req.query.enteredValue;
    if (!userProvidedDocumentId || !selectedDatabaseKey) {
      console.error('MFU_ID and databaseKey are required');
      res.status(400).send('Bad Request');
      return;
    }

    const data = {};
    let userData;
    let operatorData;

    if (selectedDatabaseKey=='SFU')
    {
      const ref = db.ref(selectedDatabaseKey); // Use the selected database key in the reference
      const userNodeSnapshot = await ref.child(userProvidedDocumentId).once('value');
      userData = userNodeSnapshot.val();
      res.status(200).json(userData);
    }
    else{
    if (enteredValue.includes("_OP")) {
      const ref = db.ref(selectedDatabaseKey + '/Operator');
      const userNodeSnapshot = await ref.child(enteredValue).once('value');
      operatorData = userNodeSnapshot.val();

      if (operatorData) {
        const op = displayOperator(operatorData, selectedDatabaseKey);
        res.status(200).json(op);
      } else {
        // If no data found, you can choose to display a message or change the database
        res.status(404).json({ message: 'Operator not found' });
      }
    } else {
      const ref = db.ref(selectedDatabaseKey + '/MFU'); // Use the selected database key in the reference
      const userNodeSnapshot = await ref.child(userProvidedDocumentId).once('value');
      userData = userNodeSnapshot.val();

      if (userData && userData.GB) {
        data[selectedDatabaseKey] = {
          GB: userData.GB,
        };

        // Call displayContent or any other processing function with enteredValue
        if (enteredValue.startsWith("SB") || enteredValue.startsWith("GB")) {
          const dt = displayContent(enteredValue, data, selectedDatabaseKey);
          res.status(200).json(dt);
        } else {
          res.status(200).json(data);
        }
      } else {
        // If no data found, you can choose to display a message or change the database
        res.status(404).json({ message: 'NO record found' });
      }
    }
  }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

function displayContent(enteredValue, jsonData, selectedDatabaseKey) {
  if (enteredValue.startsWith("SB")) {
    const sbID = enteredValue;
    const gbID = Object.keys(jsonData[selectedDatabaseKey].GB).find(gbID => sbID in jsonData[selectedDatabaseKey].GB[gbID]);

    if (gbID && jsonData[selectedDatabaseKey].GB[gbID][sbID]) {
      const sbData = jsonData[selectedDatabaseKey].GB[gbID][sbID];
      

      return(sbData)
    } else {
      console.log("SB Data not found for the specified sbID:", sbID);
    }
  } else if (enteredValue.startsWith("GB")) {
    const gbID = enteredValue;
    if (jsonData[selectedDatabaseKey] && jsonData[selectedDatabaseKey].GB && jsonData[selectedDatabaseKey].GB[gbID]) {
      const gbData = jsonData[selectedDatabaseKey].GB[gbID];
      

      return(gbData)
    } else {
      console.log("GB Data not found for the specified gbID:", gbID);
    }
  } else {
    // Invalid input
    console.log("Invalid input. Please enter a valid SB or GB ID.");
  }
}

function displayOperator(operatorData, selectedDatabaseKey) {
  if (operatorData) {
    // Displaying Operator data
    const operator = {
      Operator_ID: operatorData.Operator_ID,
      Operator_name: operatorData.Operator_name,
      Operator_image: operatorData.Operator_image,
    };
    return operator;
  } else {
    console.log(`Error: 'Operator' data not found in ${selectedDatabaseKey}`);
    return null;
  }
}

app.get('/downloadExcel', async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;
    
    let excelData=null;

    if(selectedDatabaseKey=='SFU')
    {
      const sheetsSnapshot = await db.ref(selectedDatabaseKey).child(userProvidedDocumentId).once('value');
      const sheetData = sheetsSnapshot.val();

      if (!sheetData) {
        console.error('No data found');
        res.status(404).send('Not Found');
        return;
      }

      excelData = transformDatasfu(sheetData, userProvidedDocumentId);
    }
    else
    {
    const sheetsSnapshot = await db.ref(selectedDatabaseKey).child('MFU').once('value');
    const sheetData = sheetsSnapshot.val();

    if (!sheetData) {
      console.error('No data found');
      res.status(404).send('Not Found');
      return;
    }

    excelData = transformDatamfu(sheetData, userProvidedDocumentId);
  }
    const excelBuffer = generateExcelBuffer(excelData, userProvidedDocumentId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${userProvidedDocumentId}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Internal Server Error');
  }
});

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

function transformDatamfu(sheetData, userProvidedDocumentId) {
  const result = [];
  const selectedData = sheetData[userProvidedDocumentId].GB;

  if (!selectedData) {
    console.error('No data found for the provided document ID');
    return result;
  }

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
  return result;
}

function generateExcelBuffer(data, userProvidedDocumentId) {
  const worksheet = xlsx.utils.json_to_sheet(data);

  // Set style for bold font and center alignment
  const style = {
    font: { bold: true },
    alignment: { horizontal: 'center' }
  };

  // Apply style to header row
  xlsx.utils.sheet_add_aoa(worksheet, [Object.keys(data[0])], { origin: -1, style });

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, userProvidedDocumentId);

  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', bookSST: true, type: 'buffer' });

  return excelBuffer;
}


app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});