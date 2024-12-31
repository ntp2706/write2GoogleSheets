function initial() {
  getIPv4FromFile()
  writeToFirstRow("Database", ["ID","Chủ sở hữu","Biển số xe"]);
  writeToFirstRow("Log", ["Ngày","Giờ","Chủ sở hữu","Biển số xe","Hình ảnh"]);
}

// lấy địa chỉ IP của esp8266 từ file ipv4.txt trên Google Drive
function getIPv4FromFile() {
  var fileName = "ipv4.txt";
  var files = DriveApp.getFilesByName(fileName);

  if (!files.hasNext()) {
    Logger.log("Không tìm thấy file: " + fileName);
    return;
  }

  var file = files.next();
  var content = file.getBlob().getDataAsString();

  Logger.log(content);
  return content
}
//----------------------------------------------------------------

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

