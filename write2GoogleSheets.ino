// khai báo các thư viện
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "FS.h"
#include "SD_MMC.h" 
#include <NTPClient.h>
#include <WiFiUdp.h>
//-----------------------

// thiết lập thông tin mạng wifi
#define SSID "NTP"
#define PASSWORD "qwert123"
//------------------------------

// các dữ liệu cần thiết để ghi vào Google Sheets
#define WEBAPP_URL "https://script.google.com/macros/s/AKfycbypR0qrniDbx1QCHMvI8mrdd62sUaG5uLRF58Ijf1D_GkhEBPpQL8sfctZBSC8g-bXC/exec"
//-----------------------------------------------

// khởi tạp NTP
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
//-------------

// khai báo chân cho esp32 cam
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
//------------------------------

// khai báo webserver:80 và websocket:81
WiFiServer server(80);
WiFiClient client;
//---------------------------------

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

void getCurrentTime(){
  timeClient.update();

  time_t epochTime = timeClient.getEpochTime();
  String formattedTime = timeClient.getFormattedTime();
  struct tm *ptm = gmtime ((time_t *)&epochTime); 
  int monthDay = ptm->tm_mday;
  int currentMonth = ptm->tm_mon+1;
  int currentYear = ptm->tm_year+1900;
  char formattedDate[11];
  sprintf(formattedDate, "%02d/%02d/%04d", monthDay, currentMonth + 1, currentYear);
  expiredSend = String(formattedDate);
}

void writeToSheet(String sheet, String row, String content1, String content2, String content3, String content4) {
  HTTPClient http;
  http.begin(WEBAPP_URL);
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

  if (httpResponseCode == HTTP_CODE_MOVED_PERMANENTLY || httpResponseCode == HTTP_CODE_FOUND) {
    // Lấy URL chuyển hướng
    String redirectedURL = http.getLocation();
    http.end(); // Kết thúc kết nối cũ

    // Kết nối lại với URL chuyển hướng
    http.begin(redirectedURL);
    http.addHeader("Content-Type", "application/json");
    httpResponseCode = http.POST(jsonData);
  }

  if (httpResponseCode > 0) {
    Serial.println("Tải lên thành công");
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.println("Tải lên thất bại");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  }

  http.end();
}


void setup() {
  // thiết lập serial monitor
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  //--------------------------

  // các thiết thập cần thiết cho esp32 cam
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if(psramFound()){
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 1;
    config.fb_count = 2;
  } else {
      config.frame_size = FRAMESIZE_SVGA;
      config.jpeg_quality = 1;
      config.fb_count = 1;
    }

  config.jpeg_quality = 1;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Khởi tạo camera lỗi 0x%x", err);
    delay(1000);
    ESP.restart();
  }

  sensor_t * s = esp_camera_sensor_get();

  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, -2);
    s->set_saturation(s, 2);
  }

  s->set_framesize(s, FRAMESIZE_CIF);
  s->set_brightness(s, -2);
  s->set_contrast(s, 2);
  s->set_saturation(s, 2);
  //---------------------------------------

  // kết nối wifi, khởi tạo webserver
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Đã kết nối WiFi.");
  Serial.println(WiFi.localIP());
  server.begin();
  //-------------------------------------------------------

  // thiết lập NTP
  timeClient.begin();
  timeClient.setTimeOffset(7*3600);
  //--------------

  getCurrentTime();
  writeToSheet("Database","2","2","Nguyễn Thành Phát","62M1-90648",expiredSend);
  writeToSheet("Log","2","2","Nguyễn Thành Phát","62M1-90648",expiredSend);
  delay(100);
  writeToSheet("Database","3","3","Nguyễn Thành Phát","62M1-90648",expiredSend);
  writeToSheet("Log","3","3","Nguyễn Thành Phát","62M1-90648",expiredSend);
  delay(100);
  writeToSheet("Database","6","6","Nguyễn Thành Phát","62M1-90648",expiredSend);
  writeToSheet("Log","5","5","Nguyễn Thành Phát","62M1-90648",expiredSend);
}

void loop() {
  
}