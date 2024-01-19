
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

      if (enteredValue.startsWith("SB") || enteredValue.startsWith("GB") || enteredValue.startsWith("SFU")) {
        const dt = displayContentsfu(enteredValue, userData);
        res.status(200).json(dt);
      }
      else {
        res.status(200).json(userData);
      }
    } else if (selectedDatabaseKey == "RAW_MATERIALS") {
      const ref = db.ref(selectedDatabaseKey);
      const userNodeSnapshot = await ref.child(userProvidedDocumentId).once("value");
      userData = userNodeSnapshot.val();
      res.status(200).json(userData)
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

function displayContentsfu(enteredValue, jsonData) {
  if (enteredValue.startsWith("SB")) {
    const sbID = enteredValue;

    for (const sfuKey in jsonData) {
      if (jsonData.hasOwnProperty(sfuKey) && jsonData[sfuKey]["GB"]) {
        const sfuData = jsonData[sfuKey];
        const gbIDs = Object.keys(sfuData.GB);

        for (const gbID of gbIDs) {
          if (sbID in sfuData.GB[gbID]) {

            const sbData = sfuData.GB[gbID][sbID];

            return sbData;
          }
        }
      }
    }

    console.log(`${sbID} not found under any SFU`);
    return null;
  } else if (enteredValue.startsWith("GB")) {
    const gbID = enteredValue;

    for (const sfuKey in jsonData) {
      if (jsonData.hasOwnProperty(sfuKey) && jsonData[sfuKey]["GB"]) {
        const gbIDs = Object.keys(jsonData[sfuKey]["GB"]);

        if (gbIDs.includes(gbID)) {
          return jsonData[sfuKey]["GB"][gbID];
        }
      }
    }
    return null;
  } else if (enteredValue.startsWith("SFU")) {
    const sfuKey = enteredValue;

    if (jsonData[sfuKey]) {
      const sfuData = jsonData[sfuKey];
      // Add your processing logic for SFU03 data here
      console.log(`Data for ${sfuKey}:`, sfuData);
      return sfuData;
    } else {
      console.log(`${sfuKey} not found in the JSON data.`);
      return null;
    }
  }
  else {
    // Invalid input
    console.log("Invalid input. Please enter a valid SB or GB ID.");
  }
}

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
    console.log("ID:", userProvidedDocumentId);

    let excelData = null;

    if (selectedDatabaseKey == "SFU") {
      const sheetsSnapshot = await db.ref(selectedDatabaseKey).child(userProvidedDocumentId).once("value");
      const sheetData = sheetsSnapshot.val();
      console.log("sheetData:", sheetData);


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

function transformDatasfu(jsonData, selectedDatabaseKey) {
  const result = [];

  const selectedData = jsonData;

  // Iterate over batches
  Object.keys(selectedData).forEach(batchId => {
    if (batchId === 'DATE' || batchId === 'TIME' || batchId === 'operatorId') {
      return; // Skip unnecessary rows
    }

    const batchData = selectedData[batchId];

    // Iterate over sub-batches
    Object.keys(batchData).forEach(subBatchId => {
      if (subBatchId === 'DATE' || subBatchId === 'TIME' || subBatchId === 'operatorId') {
        return; // Skip unnecessary rows
      }

      const subBatchData = batchData[subBatchId];

      Object.keys(subBatchData).forEach(ssubBatchId => {
        console.log('subBatchData:', ssubBatchId);

        if (ssubBatchId === 'DATE' || ssubBatchId === 'TIME' || ssubBatchId === 'operatorId') {
          return; // Skip unnecessary rows
        }
        const ssubBatchData = subBatchData[ssubBatchId];

        Object.keys(ssubBatchData).forEach(sssubBatchId => {
          console.log('subBatchData:', sssubBatchId);

          if (sssubBatchId === 'DATE' || sssubBatchId === 'TIME' || sssubBatchId === 'operatorId' || sssubBatchId === 'SC_ID' || sssubBatchId === 'SCp' || sssubBatchId === 'VIN_ID' || sssubBatchId === 'VTBL_ID') {
            return; // Skip unnecessary rows
          }
          const sssubBatchData = ssubBatchData[sssubBatchId];

          const row = {
            'LOCATION': selectedDatabaseKey || '',
            'SFU': batchId || '',
            GB_ID: ssubBatchId || '',
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
      });
    });
  });

  return result;
}

const colorMapping = {
  "34AB83": "Green",
  "F5692B": "Red",
  "F7A81C": "Orange",
  "3634AB": "Blue",
  "AB34A6": "Purple",
  "D4D400": "Yellow",
  "FF000000": "Black",
  "AB3449": "Pink",
  "FDFFFD": "White",
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
    const headerText = key.replace(/ /g, '\n'); // Remove line break and spaces
    const headerLength = headerText.length;
    const initialWidth = Math.max(headerLength, 15);
    const columnData = { header: headerText, key, width: initialWidth };
    columnWidths[key] = initialWidth;
    return columnData;
  })

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

exports.app = functions.https.onRequest(app)

// exports.fetchData = functions.https.onRequest(app);
// exports.downloadExcel = functions.https.onRequest(app);
