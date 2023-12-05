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
    const currentFileName = req.file.originalname;
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const ref = db.ref(selectedDatabaseKey);
    const existingData = (await ref.once('value')).val() || {};

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      await addDataToRealtimeDatabase(sheetName, excelData, userProvidedDocumentId);
    }

    lastUploadedFileName = currentFileName;

    res.status(200).send('Data uploaded and added to Realtime Database successfully.');
  } catch (error) {
    console.error('Error uploading and processing Excel file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/uploadMFU', upload.single('file'), async (req, res) => {
  try {
    const currentFileName = req.file.originalname;
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const ref = db.ref(selectedDatabaseKey);
    const existingData = (await ref.once('value')).val() || {};
    const result = { ...existingData };

    if (!result[userProvidedDocumentId]) {
      result[userProvidedDocumentId] = {
        GB: {},
        Operator: {}
      };
    }

    const GBNode = result[userProvidedDocumentId].GB;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      excelData.forEach(row => {
        const { GB_ID, SB_ID, DATE, SOAKING_START, SOAKING_STOP, BOILING_START_Operator, BOILING_START, BOILING_Reboil_Operator, BOILING_Reboil, BOILING_STOP_Operator, BOILING_STOP, INOCULATION_START, INOCULATION_STOP } = row;

        if (!GBNode[GB_ID]) {
          GBNode[GB_ID] = {};
        }

        if (!GBNode[GB_ID][SB_ID]) {
          GBNode[GB_ID][SB_ID] = {
            BOILING: {
              Reboil: {
                Time: BOILING_Reboil || null,
                Operator_ID: BOILING_Reboil_Operator
              },
              STOP: {
                Time: BOILING_STOP || null,
                Operator_ID: BOILING_STOP_Operator
              },
              START: {
                Time: BOILING_START || null,
                Operator_ID: BOILING_START_Operator
              }
            },
            DATE: DATE || null,
            INOCULATION: {
              START: INOCULATION_START || null,
              STOP: INOCULATION_STOP || null,
            },
            SOAKING: {
              START: SOAKING_START || null,
              STOP: SOAKING_STOP || null,
            },
          };
        } else {
          // Update existing data if GB_ID and SB_ID already exist
          GBNode[GB_ID][SB_ID] = {
            BOILING: {
              Reboil: {
                Time: BOILING_Reboil || null,
                Operator_ID: BOILING_Reboil_Operator
              },
              STOP: {
                Time: BOILING_STOP || null,
                Operator_ID: BOILING_STOP_Operator
              },
              START: {
                Time: BOILING_START || null,
                Operator_ID: BOILING_START_Operator
              }
            },
            DATE: DATE || null,
            INOCULATION: {
              START: INOCULATION_START || null,
              STOP: INOCULATION_STOP || null,
            },
            SOAKING: {
              START: SOAKING_START || null,
              STOP: SOAKING_STOP || null,
            },
          };
        }
      });
    }

    await ref.set(result);
    lastUploadedFileName = currentFileName;

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

    const ref = db.ref(selectedDatabaseKey); // Use the selected database key in the reference
    const userNodeSnapshot = await ref.child(userProvidedDocumentId).once('value');
    const userData = userNodeSnapshot.val();

    if (userData && userData.GB) {
      data[selectedDatabaseKey] = {
        GB: userData.GB,
        Operator: userData.Operator || {} // Assuming 'Operator' node is present in the structure
      };

      // Call displayContent or any other processing function with enteredValue
      if (enteredValue.startsWith("SB_")||enteredValue.startsWith("GB_")){
      const dt=displayContent(enteredValue,data, selectedDatabaseKey);

      res.status(200).json(dt);
      }
      else if(enteredValue=="Operator"){
        const op=displayOperator(data, selectedDatabaseKey);
        // const op=data[selectedDatabaseKey].Operator;

      res.status(200).json(op);
      }
      else{
        res.status(200).json(data);
      }

      
    } else {
      // If no data found, you can choose to display a message or change the database
      res.status(404).json({ message: 'NO record found' });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

function displayContent(enteredValue, jsonData, selectedDatabaseKey) {
  // Check if the entered value corresponds to an SB or GB ID
  if (enteredValue.startsWith("SB_")) {
    const sbID = enteredValue;
    const gbID = Object.keys(jsonData[selectedDatabaseKey].GB).find(gbID => sbID in jsonData[selectedDatabaseKey].GB[gbID]);

    if (gbID && jsonData[selectedDatabaseKey].GB[gbID][sbID]) {
      const sbData = jsonData[selectedDatabaseKey].GB[gbID][sbID];
      console.log("Displaying SB Data:", sbData);

      return(sbData)
    } else {
      console.log("SB Data not found for the specified sbID:", sbID);
    }
  } else if (enteredValue.startsWith("GB_")) {
    const gbID = enteredValue;
    if (jsonData[selectedDatabaseKey] && jsonData[selectedDatabaseKey].GB && jsonData[selectedDatabaseKey].GB[gbID]) {
      const gbData = jsonData[selectedDatabaseKey].GB[gbID];
      console.log("Displaying GB Data:", gbData);

      return(gbData)
    } else {
      console.log("GB Data not found for the specified gbID:", gbID);
    }
  } else {
    // Invalid input
    console.log("Invalid input. Please enter a valid SB or GB ID.");
  }
}

function displayOperator(jsonData, selectedDatabaseKey) {
  // Check if the selectedDatabaseKey exists in jsonData
  if (jsonData[selectedDatabaseKey]) {
    const operatorData = jsonData[selectedDatabaseKey].Operator;

    // Check if Operator exists in the selectedDatabaseKey
    if (operatorData) {
      // Displaying Operator data
      Object.values(operatorData).forEach(operator => {
        console.log("Operator ID: ", operator.Operator_ID);
        console.log("Operator Name: ", operator.Operator_name);
        console.log("Operator Image: ", operator.Operator_image);
        console.log("\n");
      });

    } else {
      console.log(`Error: 'Operator' property not found in ${selectedDatabaseKey}`);
    }
    return operatorData
  } else {
    console.error(`Error: ${selectedDatabaseKey} not found in jsonData`);
  }
  
}
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

app.get('/downloadExcel', async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    
    const sheetsSnapshot = await db.ref().once('value');
    const sheetNames = Object.keys(sheetsSnapshot.val());

    const data = {};

    for (const sheetName of sheetNames) {
      const sheetSnapshot = await db.ref(sheetName).child(userProvidedDocumentId).once('value');
      const sheetData = sheetSnapshot.val();

      if (sheetData) {
        data[sheetName] = sheetData;
      }
    }
    let excelData;
    
    excelData = transformDatay(data);
    const excelBuffer = generateExcelBuffer(excelData,userProvidedDocumentId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${userProvidedDocumentId}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Internal Server Error');
  }
});

function transformDatadntForExcel(jsonData) {
  const result = [];

  Object.keys(jsonData).forEach(sheetName => {
    const sheetData = jsonData[sheetName];

    Object.keys(sheetData).forEach(date => {
      const dateData = sheetData[date];

      Object.keys(dateData).forEach(time => {
        const rowData = dateData[time];

        const row = {
          Date: date || '',
          Time: time || '',
          ...(rowData || {}),
        };

        result.push(row);
      });
    });
  });

  return result;
}

function transformDataForExcel(jsonData) {
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
function transformDatay(jsonData) {
  const result = [];

  Object.keys(jsonData).forEach(deviceKey => {
    const deviceData = jsonData[deviceKey];

    // Check if the current key is "MFU" and get the Device_ID and MOBILE values
    const deviceID = deviceData.Device_ID || '';
    const mobile = deviceData.MOBILE || '';

    Object.keys(deviceData).forEach(gbID => {
      // Skip Device_ID and MOBILE keys
      if (gbID === "Device_ID" || gbID === "MOBILE") {
        return;
      }

      const gbData = deviceData[gbID];

      Object.keys(gbData).forEach(sbID => {
        const sbData = gbData[sbID];

        const row = {
          // Device_ID: deviceID,
          GB_ID: gbID || '',
          SB_ID: sbID || '',
          DATE: sbData.DATE || '',
          // TIME: sbData.TIME || '',
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
  });

  return result;
}
function generateExcelBuffer(data,userProvidedDocumentId) {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet,userProvidedDocumentId);

  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', bookSST: true, type: 'buffer' });

  return excelBuffer;
}


app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});