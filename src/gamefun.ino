#include <WiFi.h>
#include <WebSocketsServer.h>

const int TRIG_PIN = 12;
const int ECHO_PIN = 14;
const int BUZZER_PIN = 18;

WebSocketsServer webSocket = WebSocketsServer(81);
unsigned long lastDistTime = 0;

void onMessage(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String message = String((char*)(payload));
    if (message == "SUCCESS_CHIRP") {
      // Happy sound!
      for(int i=0; i<3; i++) {
        digitalWrite(BUZZER_PIN, HIGH); delay(50);
        digitalWrite(BUZZER_PIN, LOW); delay(50);
      }
    }
  }
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  WiFi.softAP("TreasureHunt_Master", "password123");
  webSocket.begin();
  webSocket.onEvent(onMessage);
}

void loop() {
  webSocket.loop();
  
  if (millis() - lastDistTime > 200) {
    digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    int distance = duration * 0.034 / 2;

    if (distance > 0 && distance < 400) {
      String json = "{\"type\": \"distance\", \"value\": " + String(distance) + "}";
      webSocket.broadcastTXT(json);
    }
    lastDistTime = millis();
  }
}