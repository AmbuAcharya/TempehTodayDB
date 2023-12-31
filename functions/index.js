const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const xlsx = require("xlsx");
const bodyParser = require("body-parser");
const busboy = require("connect-busboy");
const ExcelJS = require('exceljs');

const serviceAccount = require("./tempehtoday-f866c-firebase-adminsdk-t0ceu-890bf43bd6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tempehtoday-f866c-default-rtdb.firebaseio.com/",
  storageBucket: "tempehtoday-f866c.appspot.com"
});


const db = admin.database();
const opimg = admin.storage();
const app = express();
// const port = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(busboy({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  headers: {
    "content-type": "multipart/form-data; boundary=---------------------------123456789012345678901234567890",
  },
}));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/fetchDatabaseKeys", async (req, res) => {
  try {
    const sheetsSnapshot = await db.ref().once("value");
    const sheetNames = Object.keys(sheetsSnapshot.val());
    res.status(200).json(sheetNames);
  } catch (error) {
    console.error("Error fetching database keys:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/fetchIds", async (req, res) => {
  const selectedDatabaseKey = req.query.databaseKey;
  try {
    let mfuDataSnapshot;

    if (selectedDatabaseKey === "MFU_DB") {
      mfuDataSnapshot = await db.ref(selectedDatabaseKey + "/MFU").once("value");
    } else {
      mfuDataSnapshot = await db.ref(selectedDatabaseKey).once("value");
    }

    const mfuNodes = mfuDataSnapshot.val();

    // Extract MFU_IDs from the nodes
    const mfuIds = Object.keys(mfuNodes || {});

    res.status(200).json(mfuIds);
  } catch (error) {
    console.error("Error fetching MFU_IDs:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/createProfile", upload.single("Operator_image"), async (req, res) => {
  try {
    const { selectedDatabaseKey, mfuId, Operator_ID, Operator_name } = req.body;

    // Ensure req.file is present
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const imageBuffer = req.file.buffer;

    // Upload the image to Firebase Storage
    const bucket = opimg.bucket();  // Updated this line
    const imageFile = bucket.file(`Operators_image/${mfuId}/${Operator_ID}.jpg`);
    await imageFile.save(imageBuffer);
    await imageFile.makePublic();

    // Get the download URL of the uploaded image
    const imageURL = `https://storage.googleapis.com/${bucket.name}/${imageFile.name}`;
    // const imageURL = await imageFile.getSignedUrl({ action: "read", expires: "01-01-2100" });

    // Save profile data to the database
    const databaseRef = db.ref(`${selectedDatabaseKey}/${mfuId}/Operator`);
    const newProfileRef = databaseRef.child(Operator_ID);
    await newProfileRef.set({
      Operator_ID,
      Operator_name,
      Operator_image: imageURL,
    });

    res.status(200).json({ success: true, message: "Profile created successfully" });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/fetchData", async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;
    const enteredValue = req.query.enteredValue;

    if (!userProvidedDocumentId || !selectedDatabaseKey) {
      console.error("MFU_ID and databaseKey are required");
      res.status(400).send("Bad Request");
      return;
    }

    const data = {};
    let userData;
    let operatorData;

    if (selectedDatabaseKey == "SFU") {
      const ref = db.ref(selectedDatabaseKey); // Use the selected database key in the reference
      const userNodeSnapshot = await ref.child(userProvidedDocumentId).once("value");
      userData = userNodeSnapshot.val();
      res.status(200).json(userData);
    }
    else {
      if (enteredValue.includes("_OP")) {
        const ref = db.ref(selectedDatabaseKey + "/Operator");
        const userNodeSnapshot = await ref.child(enteredValue).once("value");
        operatorData = userNodeSnapshot.val();

        if (operatorData) {
          const op = displayOperator(operatorData, selectedDatabaseKey);
          res.status(200).json(op);
        } else {
          // If no data found, you can choose to display a message or change the database
          res.status(404).json({ message: "Operator not found" });
        }
      } else {
        const ref = db.ref(selectedDatabaseKey + "/MFU"); // Use the selected database key in the reference
        const userNodeSnapshot = await ref.child(userProvidedDocumentId).once("value");
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
          res.status(404).json({ message: "NO record found" });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

function displayContent(enteredValue, jsonData, selectedDatabaseKey) {
  if (enteredValue.startsWith("SB")) {
    const sbID = enteredValue;
    const gbID = Object.keys(jsonData[selectedDatabaseKey].GB).find(gbID => sbID in jsonData[selectedDatabaseKey].GB[gbID]);

    if (gbID && jsonData[selectedDatabaseKey].GB[gbID][sbID]) {
      const sbData = jsonData[selectedDatabaseKey].GB[gbID][sbID];


      return (sbData)
    } else {
      console.log("SB Data not found for the specified sbID:", sbID);
    }
  } else if (enteredValue.startsWith("GB")) {
    const gbID = enteredValue;
    if (jsonData[selectedDatabaseKey] && jsonData[selectedDatabaseKey].GB && jsonData[selectedDatabaseKey].GB[gbID]) {
      const gbData = jsonData[selectedDatabaseKey].GB[gbID];


      return (gbData)
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
    console.log(`Error: "Operator" data not found in ${selectedDatabaseKey}`);
    return null;
  }
}

app.get("/downloadExcel", async (req, res) => {
  try {
    const userProvidedDocumentId = req.query.MFU_ID;
    const selectedDatabaseKey = req.query.databaseKey;

    let excelData = null;

    if (selectedDatabaseKey == "SFU") {
      const sheetsSnapshot = await db.ref(selectedDatabaseKey).child(userProvidedDocumentId).once("value");
      const sheetData = sheetsSnapshot.val();

      if (!sheetData) {
        console.error("No data found");
        res.status(404).send("Not Found");
        return;
      }

      excelData = transformDatasfu(sheetData, userProvidedDocumentId);
    }
    else {
      const sheetsSnapshot = await db.ref(selectedDatabaseKey).child("MFU").once("value");
      const sheetData = sheetsSnapshot.val();

      if (!sheetData) {
        console.error("No data found");
        res.status(404).send("Not Found");
        return;
      }

      excelData = transformDatamfu(sheetData, userProvidedDocumentId);


    }
    const excelBuffer = await generateExcelBuffer(excelData, userProvidedDocumentId);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${userProvidedDocumentId}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).send("Internal Server Error");
  }
});

const transformDatasfu = (jsonData) => {
  const tableData = [];

  // Iterate through the JSON data
  for (const date in jsonData) {
    const timeData = jsonData[date];

    for (const time in timeData) {
      const rowData = {
        Date: date.replace(/(\d{2})-(\d{2})-(\d{2})/, "$2-$1-$3"), // Change date format
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
  "34AB83": "Green",
  "F5692B": "Red",
  "F7A81C": "Orange",
  "FDFFFD": "White",
  "AB9F34": "Light Green",
  "3634AB": "Blue",
  "AB3449": "Brown",
  "AB34A6": "Purple",
  "D4D400": "Yellow",
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
  });

  return result;
}

async function generateExcelBuffer(data, userProvidedDocumentId) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(userProvidedDocumentId);

  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1; // Number of pages to fit to (1 means fit to 1 page wide)
  worksheet.pageSetup.fitToHeight = 0; // Number of pages to fit to (0 means auto-adjust height)
  worksheet.pageSetup.printTitlesRow = '1'; // Repeat the first row on each printed page

  const keys = Object.keys(data[0]);
  const columnWidths = {};
  worksheet.columns = keys.map((key) => {
    const headerText = key.replace(/ /g, '\n'); // Use line break instead of space for multi-line header
    const headerLength = headerText.length;
    const initialWidth = Math.max(headerLength, 15); 
    const columnData = { header: headerText, key, width: initialWidth };
    columnWidths[key] = initialWidth;
    return columnData;
  });

  worksheet.addRows(data);

  // Style headers to be bold and center-aligned
  worksheet.getRow(1).font = { bold: true, horizontal: 'center' };

  // Set alignment for all cells to center and adjust spacing based on max word length
  worksheet.eachRow((row) => {
    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center' };
      const columnKey = keys[colNumber - 1];
      const cellLength = cell.value ? cell.value.toString().length : 0;
      const columnWidth = Math.max(columnWidths[columnKey], cellLength);
      worksheet.getColumn(colNumber).width = columnWidth + 2; // Add spacing
    });
  });

  // Add table borders to all cells
  worksheet.eachRow((row, rowNum) => {
    row.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Generate buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  return excelBuffer;
}

// exports.app = functions.https.onRequest(app);
exports.fetchDatabaseKeys = functions.https.onRequest(app);
exports.fetchIds = functions.https.onRequest(app);
exports.SFUupload = functions.https.onRequest(app);
exports.uploadMFU = functions.https.onRequest(app);
exports.fetchData = functions.https.onRequest(app);
exports.downloadExcel = functions.https.onRequest(app);
