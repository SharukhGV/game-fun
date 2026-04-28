#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "ESP32_Treasure_Hunt";
const char* password = "password123";

const int PIR_PIN = 27;
const int TRIG_PIN = 12;
const int ECHO_PIN = 14;
const int BUTTON_PIN = 13;

WebSocketsServer webSocket = WebSocketsServer(81);

unsigned long lastDistanceTime = 0;
int lastPIRState = LOW;

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP); 

  WiFi.softAP(ssid, password);
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  // 1. Button Logic (Victory)
  if (digitalRead(BUTTON_PIN) == LOW) {
    webSocket.broadcastTXT("{\"type\": \"victory\", \"value\": true}");
    delay(500); // Simple debounce
  }

  // 2. PIR Logic (Motion)
  int currentPIRState = digitalRead(PIR_PIN);
  if (currentPIRState != lastPIRState) {
    String json = "{\"type\": \"motion\", \"value\": " + String(currentPIRState == HIGH ? "true" : "false") + "}";
    webSocket.broadcastTXT(json);
    lastPIRState = currentPIRState;
  }

  // 3. Distance Logic (Every 200ms)
  if (millis() - lastDistanceTime > 200) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
    int distance = duration * 0.034 / 2;

    if (distance > 0 && distance < 400) {
      String json = "{\"type\": \"distance\", \"value\": " + String(distance) + "}";
      webSocket.broadcastTXT(json);
    }
    lastDistanceTime = millis();
  }
}