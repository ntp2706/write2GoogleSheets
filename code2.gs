function initial() {
  findFirstEmptyRow()
  writeToFirstRow("Database", ["No.","Chủ sở hữu","Biển số xe","Ngày hết hạn"])
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

// xử lý các yêu cầu POST từ esp32 cam và esp8266
// dạng json {
    //"sheet": "/tên bảng tính/",
    //"content1": "/nội dung cột A/",
    //"content2": "/nội dung cột B/",
    //"content3": "/nội dung cột C/",
    //"content4": "/nội dung cột D/"
//}

function doPost(e) {
  try {
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheet);

      const lastRow = sheet.getLastRow();
      const nextRow = lastRow + 1; // hàng để ghi dữ liệu

      sheet.getRange(nextRow, 1).setValue(data.content1 || ""); // Ghi nội dung cột A
      sheet.getRange(nextRow, 2).setValue(data.content2 || ""); // Ghi nội dung cột B
      sheet.getRange(nextRow, 3).setValue(data.content3 || ""); // Ghi nội dung cột C
      sheet.getRange(nextRow, 4).setValue(data.content4 || ""); // Ghi nội dung cột D

      generateOrdinalNumber(); // cập nhật lại số thứ tự

      return ContentService.createTextOutput("Write Successfully.");
    } else {
      return ContentService.createTextOutput("Write Failed.");
    }
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message);
  }
}

//--------------------------------------------------

// đánh số thứ tự tự động
  function generateOrdinalNumber() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Database");
    
    const lastRow = sheet.getLastRow(); // tìm hàng cuối cùng có dữ liệu

    const ordinalNumbers = [];
    for (let i = 1; i <= lastRow - 1; i++) {
      ordinalNumbers.push([i]);
    }
    
    sheet.getRange(2, 1, ordinalNumbers.length, 1).setValues(ordinalNumbers); // ghi số thứ tự vào cột A bắt đầu từ hàng 2
  }
//-------------------------

// cập nhật số thứ tự
  function onEdit(e) {
    const editedSheet = e.source.getActiveSheet();
    const sheetName = editedSheet.getName();
    
    if (sheetName == "Database") {
      generateOrdinalNumber();
    }
  }
//--------------------------------------

// ghi tên các trường vào hàng đầu tiên
  function writeToFirstRow(sheetName, data) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
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
    
    sheet.setColumnWidth(columnIndex, width);
    
    Logger.log("Kích thước cột đã được thay đổi.");
  }
//-----------------------

