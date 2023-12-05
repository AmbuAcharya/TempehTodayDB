const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const xlsx = require('xlsx');
const fs = require('fs');

const serviceAccount = require('./testtempehdatabase-firebase-adminsdk-y5zde-0c0a27f7fa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://testtempehdatabase-default-rtdb.firebaseio.com',
});

const db = admin.database();
const app = express();
const port = 5001;

app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let lastUploadedFileName = null;

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const currentFileName = req.file.originalname;
    const userProvidedDocumentId = req.query.MFU_ID;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

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

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

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

    if (hasDateOrTimeFormat(data)) {
      excelData = transformDatadntForExcel(data);
    } else {
      excelData = transformDataForExcel(data);

    }
    
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