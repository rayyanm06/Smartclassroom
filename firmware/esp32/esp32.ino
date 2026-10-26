#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include "config.h"

// ==============================================================================
// Hardware Pinout Configuration (Verified Working)
// ==============================================================================
#define DHTPIN        4
#define DHTTYPE       DHT11
#define PIR_PIN       27
#define LED_PIN       26

#define OLED_SDA      21
#define OLED_SCL      22
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define OLED_ADDR     0x3C

// ==============================================================================
// Global Peripherals
// ==============================================================================
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// State tracking
unsigned long lastHeartbeatMs = 0;
unsigned long lastMotionPostMs = 0;
unsigned long lastDisplayMs = 0;
unsigned long lastTxSuccessMs = 0;
unsigned long lastWiFiAttemptMs = 0;

int lastMotionState = LOW;
int lastHttpResponseCode = 0;
String lastHttpServerStatus = "WAITING";
bool oledReady = false;

// ==============================================================================
// LED Signaling System
// Patterns:
// - Motion: Steady ON while PIR reads HIGH
// - API Ingestion Success: Double-flash pulse (distinguishable even when motion is active)
// - Boot / Connecting: Periodic short blip
// ==============================================================================
void signalLedSuccess() {
  bool motionActive = (digitalRead(PIR_PIN) == HIGH);
  if (motionActive) {
    // If motion is holding LED ON, briefly pulse OFF twice
    digitalWrite(LED_PIN, LOW);
    delay(50);
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    delay(50);
    digitalWrite(LED_PIN, HIGH);
  } else {
    // If motion is clear (LED OFF), flash ON twice
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    delay(50);
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
  }
}

void updateLedState(int motion) {
  // Base state reflects active PIR motion
  digitalWrite(LED_PIN, motion == HIGH ? HIGH : LOW);
}

// ==============================================================================
// Display Helper
// ==============================================================================
void updateDisplay(float temp, float hum, int motion) {
  if (!oledReady) return;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  // Header line
  display.print("ROOM ");
  display.print(CLASSROOM_ID);
  display.print(" | ");
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WIFI OK");
  } else {
    display.print("WIFI...");
  }
  display.println();
  display.println("---------------------");

  // Temperature & Humidity
  if (isnan(temp) || isnan(hum)) {
    display.println("Climate: DHT11 READ ERR");
  } else {
    display.print("Temp: ");
    display.print(temp, 1);
    display.print(" C  ");
    display.print("Hum: ");
    display.print((int)hum);
    display.println("%");
  }

  // Motion Status
  display.print("Motion : ");
  display.println(motion == HIGH ? "DETECTED" : "CLEAR");

  // Wi-Fi Details
  display.print("Wi-Fi  : ");
  if (WiFi.status() == WL_CONNECTED) {
    display.print(WiFi.RSSI());
    display.println(" dBm");
  } else {
    display.println("CONNECTING");
  }

  // API Ingest Status
  display.print("API TX : ");
  if (lastHttpResponseCode == 202) {
    unsigned long secAgo = (millis() - lastTxSuccessMs) / 1000;
    display.print("202 OK (");
    display.print(secAgo);
    display.println("s)");
  } else if (lastHttpResponseCode > 0) {
    display.print("ERR ");
    display.println(lastHttpResponseCode);
  } else {
    display.println(lastHttpServerStatus);
  }

  display.display();
}

// ==============================================================================
// Telemetry Ingestion Client
// ==============================================================================
bool postSensorData(float temp, float hum, bool pirMotion, const char* eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    lastHttpServerStatus = "NO WIFI";
    return false;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + SENSOR_ENDPOINT;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(4000);

  // Construct JSON strictly conforming to backend SensorEventSchema
  String json = "{";
  json += "\"classroom_id\":\"" + String(CLASSROOM_ID) + "\",";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"pir_motion\":" + String(pirMotion ? "true" : "false") + ",";

  if (eventType != nullptr) {
    json += "\"event\":\"" + String(eventType) + "\",";
  } else {
    json += "\"event\":null,";
  }

  if (isnan(temp)) {
    json += "\"temperature\":null,";
  } else {
    json += "\"temperature\":" + String(temp, 1) + ",";
  }

  if (isnan(hum)) {
    json += "\"humidity\":null,";
  } else {
    json += "\"humidity\":" + String(hum, 1) + ",";
  }

  json += "\"ac_status\":false,";
  json += "\"light_status\":false,";
  json += "\"wifi_rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"source\":\"esp32\"";
  json += "}";

  int httpCode = http.POST(json);
  lastHttpResponseCode = httpCode;

  bool success = false;
  if (httpCode == 202 || httpCode == 200) {
    success = true;
    lastTxSuccessMs = millis();
    lastHttpServerStatus = "202 ACCEPTED";
    Serial.println("[HTTP] Ingest accepted (202)");
    signalLedSuccess();
  } else {
    lastHttpServerStatus = "ERR " + String(httpCode);
    Serial.print("[HTTP] Failed, code: ");
    Serial.println(httpCode);
  }

  http.end();
  return success;
}

// ==============================================================================
// Wi-Fi Connection Manager & Event Diagnostics
// ==============================================================================
const char* getWiFiStatusLabel(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:     return "WL_IDLE_STATUS (0 - Changing/Idle)";
    case WL_NO_SSID_AVAIL:   return "WL_NO_SSID_AVAIL (1 - SSID not found)";
    case WL_SCAN_COMPLETED:  return "WL_SCAN_COMPLETED (2 - Scan done)";
    case WL_CONNECTED:       return "WL_CONNECTED (3 - Connected)";
    case WL_CONNECT_FAILED:  return "WL_CONNECT_FAILED (4 - Auth/Password failed)";
    case WL_CONNECTION_LOST: return "WL_CONNECTION_LOST (5 - Link lost)";
    case WL_DISCONNECTED:    return "WL_DISCONNECTED (6 - Handshake in progress or dropped)";
    default:                 return "UNKNOWN_STATUS";
  }
}

const char* getWiFiDisconnectReasonLabel(uint8_t reason) {
  switch (reason) {
    case 1:   return "WIFI_REASON_UNSPECIFIED (1)";
    case 2:   return "WIFI_REASON_AUTH_EXPIRE (2)";
    case 3:   return "WIFI_REASON_AUTH_LEAVE (3)";
    case 4:   return "WIFI_REASON_ASSOC_EXPIRE / DISASSOC_INACTIVITY (4)";
    case 5:   return "WIFI_REASON_ASSOC_TOOMANY (5)";
    case 6:   return "WIFI_REASON_NOT_AUTHED (6)";
    case 7:   return "WIFI_REASON_NOT_ASSOCED (7)";
    case 8:   return "WIFI_REASON_ASSOC_LEAVE (8)";
    case 9:   return "WIFI_REASON_ASSOC_NOT_AUTHED (9)";
    case 13:  return "WIFI_REASON_IE_INVALID (13)";
    case 14:  return "WIFI_REASON_MIC_FAILURE (14)";
    case 15:  return "WIFI_REASON_4WAY_HANDSHAKE_TIMEOUT (15 - Key negotiation timed out)";
    case 16:  return "WIFI_REASON_GROUP_KEY_UPDATE_TIMEOUT (16)";
    case 17:  return "WIFI_REASON_IE_IN_4WAY_DIFFERS (17)";
    case 18:  return "WIFI_REASON_GROUP_CIPHER_INVALID (18)";
    case 19:  return "WIFI_REASON_PAIRWISE_CIPHER_INVALID (19)";
    case 20:  return "WIFI_REASON_AKMP_INVALID (20)";
    case 21:  return "WIFI_REASON_UNSUPP_RSN_IE_VERSION (21)";
    case 22:  return "WIFI_REASON_INVALID_RSN_IE_CAP (22)";
    case 23:  return "WIFI_REASON_802_1X_AUTH_FAILED (23)";
    case 24:  return "WIFI_REASON_CIPHER_SUITE_REJECTED (24)";
    case 200: return "WIFI_REASON_BEACON_TIMEOUT (200 - Hotspot signal lost or asleep)";
    case 201: return "WIFI_REASON_NO_AP_FOUND (201 - SSID not broadcasting on 2.4GHz)";
    case 202: return "WIFI_REASON_AUTH_FAIL (202 - Incorrect password or security mode mismatch)";
    case 203: return "WIFI_REASON_ASSOC_FAIL (203 - Association rejected by AP)";
    case 204: return "WIFI_REASON_HANDSHAKE_TIMEOUT (204 - Handshake timed out)";
    case 205: return "WIFI_REASON_CONNECTION_FAIL (205 - Connection fail)";
    case 210: return "WIFI_REASON_NO_AP_FOUND_W_COMPATIBLE_SECURITY (210 - Incompatible WPA security)";
    default:  return "OTHER_DISCONNECT_REASON";
  }
}

void onWiFiDisconnect(WiFiEvent_t event, WiFiEventInfo_t info) {
  uint8_t reason = info.wifi_sta_disconnected.reason;
  Serial.print("[Wi-Fi Event] STA Disconnected. Reason: ");
  Serial.print(reason);
  Serial.print(" -> ");
  Serial.println(getWiFiDisconnectReasonLabel(reason));
}

void checkWiFiConnection() {
  wl_status_t currentStatus = WiFi.status();
  if (currentStatus == WL_CONNECTED) return;

  static unsigned long lastDiagLogMs = 0;
  static wl_status_t lastReportedStatus = WL_IDLE_STATUS;
  unsigned long now = millis();

  // Log status on every state change or every 2s during connection attempts
  if (currentStatus != lastReportedStatus || (now - lastDiagLogMs >= 2000)) {
    lastReportedStatus = currentStatus;
    lastDiagLogMs = now;
    Serial.print("[Wi-Fi Diagnostic] status=");
    Serial.print((int)currentStatus);
    Serial.print(" (");
    Serial.print(getWiFiStatusLabel(currentStatus));
    Serial.println(")");
  }

  // Allow 20s for handshake and DHCP; retry without tearing down in-progress connection
  if (now - lastWiFiAttemptMs >= 20000) {
    lastWiFiAttemptMs = now;
    Serial.println("[Wi-Fi] Retrying WiFi.begin() after 20s timeout...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

// ==============================================================================
// Arduino Setup
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[Setup] Smart Classroom ESP32 Sensor Node starting...");

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  dht.begin();
  Wire.begin(OLED_SDA, OLED_SCL);

  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("SMART CLASSROOM 508");
    display.println("-------------------");
    display.println("Connecting Wi-Fi...");
    display.display();
  } else {
    Serial.println("[OLED] Display init failed on 0x3C");
  }

  // Register station disconnect listener once
  WiFi.onEvent(onWiFiDisconnect, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_DISCONNECTED);

  Serial.print("[Setup] Starting initial Wi-Fi connection to SSID: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWiFiAttemptMs = millis();
}

// ==============================================================================
// Main Loop
// ==============================================================================
void loop() {
  checkWiFiConnection();

  int motion = digitalRead(PIR_PIN);
  updateLedState(motion);

  unsigned long now = millis();

  // Read environmental sensors
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  // 1. Instant Motion Event on Rising Edge (debounced)
  if (motion == HIGH && lastMotionState == LOW) {
    if (now - lastMotionPostMs >= MOTION_COOLDOWN_MS) {
      lastMotionPostMs = now;
      Serial.println("[PIR] Rising edge motion detected -> Posting event immediately");
      postSensorData(temp, hum, true, "motion");
    }
  }
  lastMotionState = motion;

  // 2. Periodic Heartbeat Telemetry (every 10s)
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    Serial.println("[Heartbeat] Posting 10s sensor telemetry heartbeat");
    postSensorData(temp, hum, (motion == HIGH), nullptr);
  }

  // 3. Refresh OLED Display (~500ms cadence)
  if (now - lastDisplayMs >= 500) {
    lastDisplayMs = now;
    updateDisplay(temp, hum, motion);
  }

  delay(50);
}
