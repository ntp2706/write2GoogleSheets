function initial() {
  findFirstEmptyRow()
  writeToFirstRow("Database", ["ID","Chủ sở hữu","Biển số xe","Ngày hết hạn"])
  adjustColumnWidth("Database",1,50)
  adjustColumnWidth("Database",2,250)
  adjustColumnWidth("Database",3,100)
  adjustColumnWidth("Database",4,100)
  writeToFirstRow("Log", ["Ngày","Giờ","Chủ sở hữu","Biển số xe"])
  adjustColumnWidth("Log",1,150)
  adjustColumnWidth("Log",2,100)
  adjustColumnWidth("Log",3,250)
  adjustColumnWidth("Log",4,100)
}

// ghi dữ liệu vào bảng tính thông qua POST
// dạng json {
    //"sheet": "Database",
    //"row": 2, hoặc "row": "?", nếu tìm số hàng
    //"content1": "1",
    //"content2": "Nguyễn Thành Phát",
    //"content3": "62M1-90648",
    //"content4": "01/01/2025"
//}

function doPost(e) {
  try {
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);

      if (data.row === "?") {
        const analysisSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Analysis");
        if (!analysisSheet) {
          return ContentService.createTextOutput("Error: Analysis sheet not found.");
        }

        if (data.sheet === "Database") {
          const valueB1 = analysisSheet.getRange("B1").getValue();
          return ContentService.createTextOutput(valueB1);
        } else if (data.sheet === "Log") {
          const valueB2 = analysisSheet.getRange("B2").getValue();
          return ContentService.createTextOutput(valueB2);
        } else {
          return ContentService.createTextOutput("Error: Invalid sheet name for 'row = ?'.");
        }
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheet);
      if (!sheet) {
        return ContentService.createTextOutput("Error: Sheet not found.");
      }

      const row = parseInt(data.row, 10);
      sheet.getRange(row, 1).setValue(data.content1);
      sheet.getRange(row, 2).setValue(data.content2);
      sheet.getRange(row, 3).setValue(data.content3);
      sheet.getRange(row, 4).setValue(data.content4);

      findFirstEmptyRow();
      return ContentService.createTextOutput("Success: Data written to sheet.");
    } else {
      return ContentService.createTextOutput("Error: No POST data received.");
    }
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message);
  }
}
//-------------------------------------------

// tìm hàng trống đầu tiên trong bảng tính
function findFirstEmptyRow() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  let results = [];
  
  sheets.forEach(sheet => {
    if (sheet.getName() === "Analysis") {
      return;
    }

    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(1, 1, lastRow || 1, sheet.getLastColumn()).getValues();
    let emptyRow = data.findIndex(row => row.every(cell => cell === "")) + 1;
    if (emptyRow === 0) {
      emptyRow = lastRow + 1;
    }
    results.push([sheet.getName(), emptyRow]);
  });
  
  let resultSheet = spreadsheet.getSheetByName("Analysis");
  if (!resultSheet) {
    resultSheet = spreadsheet.insertSheet("Analysis");
  } else {
    resultSheet.clear();
  }
  
  resultSheet.getRange(1, 1, results.length, results[0].length).setValues(results);
}
//-------------------------------------------

// cập nhật hàng trống khi có thay đổi
function onEdit(e) {
  const editedSheet = e.source.getActiveSheet();
  const sheetName = editedSheet.getName();
  
  if (sheetName !== "Analysis") {
    findFirstEmptyRow();
  }
}
//--------------------------------------

// ghi tên các trường vào hàng đầu tiên
function writeToFirstRow(sheetName, data) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Bảng tính không tồn tại.");
    return;
  }

  var range = sheet.getRange(1, 1, 1, data.length);

  // xóa data validation, ghi dữ liệu, định dạng căn giữa và in đậm
  range.clearDataValidations();
  range.setValues([data]);
  range.setHorizontalAlignment("center");
  range.setFontWeight("bold");
  //----------------------------------------------------------------

  Logger.log("Ghi dữ liệu thành công.");
}
//--------------------------------------

// điều chỉnh độ rộng cột
function adjustColumnWidth(sheetName, columnIndex, width) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Bảng tính không tồn tại.");
    return;
  }
  
  sheet.setColumnWidth(columnIndex, width);
  
  Logger.log("Kích thước cột đã được thay đổi.");
}
//-----------------------

// ghi dữ liệu vào ô trống theo ID
function writeToSheet(sheetName, data, ID) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Bảng tính không tồn tại.");
    return;
  }
  
  sheet.getRange(ID, 1, 1, data.length).setValues([data]);
  
  Logger.log("Ghi dữ liệu thành công.");
}
//----------------------------------

