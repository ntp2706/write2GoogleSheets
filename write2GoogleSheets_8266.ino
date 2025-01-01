// khai báo các thư viện
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
//-----------------------

// thiết lập thông tin mạng wifi
#define SSID "NTP"
#define PASSWORD "qwert123"
//------------------------------

// các dữ liệu cần thiết để ghi vào Google Sheets
#define WEBAPP_URL "https://script.google.com/macros/s/*****/exec"
//-----------------------------------------------

// khởi tạo NTP
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
//-------------

// các biến thông tin nhận
String IDReceive;
String numberReceive;
String ownerReceive;
String timestampReceive;
String expiredReceive;
//-------------------------

// các biến thông tin gửi đi
String IDSend;
String numberSend;
String ownerSend;
String timestampSend;
String imageOwnerSend;
String expiredSend;
//--------------------------

// lấy định dạng ngày tháng năm dd/mm/yyyy
void getCurrentTime() {
  timeClient.update();

  time_t epochTime = timeClient.getEpochTime();
  struct tm *ptm = gmtime((time_t *)&epochTime);

  int monthDay = ptm->tm_mday;
  int currentMonth = ptm->tm_mon + 1;
  int currentYear = ptm->tm_year + 1900;

  char dateBuffer[11];
  sprintf(dateBuffer, "%02d/%02d/%04d", monthDay, currentMonth + 1, currentYear);

  expiredSend = String(dateBuffer);
  Serial.println(expiredSend);
}

//-----------------------------------------

// ghi dữ liệu vào bảng tính /tên bảng tính, /hàng, /nội dung theo cột từ trái sang phải
void writeToSheet(String sheet, String row, String content1, String content2, String content3, String content4) {
  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure();

  http.begin(client, WEBAPP_URL);
  http.addHeader("Content-Type", "application/json");

  String jsonData = 
    "{"
      "\"sheet\":\"" + sheet + "\","
      "\"row\":\"" + row + "\","
      "\"content1\":\"" + content1 + "\","
      "\"content2\":\"" + content2 + "\","
      "\"content3\":\"" + content3 + "\","
      "\"content4\":\"" + content4 + "\""
    "}";

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.println("Tải lên thành công");
  } else {
    Serial.println("Tải lên thất bại");
    Serial.println(httpResponseCode);
  }

  http.end();
}

//--------------------------------------------------------------------------------------

void setup() {
  // thiết lập serial monitor
  Serial.begin(115200);
  Serial.println();
  //--------------------------

  // kết nối wifi
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Đã kết nối WiFi.");
  Serial.println(WiFi.localIP());
  //-------------------------------------------------------

  // thiết lập NTP
  timeClient.begin();
  timeClient.setTimeOffset(7 * 3600); // GMT+7
  //--------------
}

void loop() {
}
