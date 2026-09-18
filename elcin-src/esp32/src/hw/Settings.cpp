#include "Settings.h"

#include "ElcinConfig.h"

namespace elcin {
namespace {
constexpr const char* kNamespace = "elcin";
}

void Settings::begin() {
  // Salt okunur açılış başarısız olursa alan henüz yok demektir; yazılabilir
  // açıp bir kez oluşturuyoruz.
  if (!prefs_.begin(kNamespace, true)) {
    prefs_.end();
    prefs_.begin(kNamespace, false);
  }
  prefs_.end();
}

bool Settings::hasWifi() const { return wifiSsid().length() > 0; }

String Settings::wifiSsid() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("ssid", "");
  prefs_.end();
  return value;
}

String Settings::wifiPassword() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("pass", "");
  prefs_.end();
  return value;
}

void Settings::setWifi(const String& ssid, const String& password) {
  prefs_.begin(kNamespace, false);
  prefs_.putString("ssid", ssid);
  prefs_.putString("pass", password);
  prefs_.end();
}

String Settings::deviceId() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("id", ELCIN_DEFAULT_DEVICE_ID);
  prefs_.end();
  return value;
}

void Settings::setDeviceId(const String& id) {
  prefs_.begin(kNamespace, false);
  prefs_.putString("id", id);
  prefs_.end();
}

String Settings::backendUrl() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("api", "");
  prefs_.end();
  return value;
}

String Settings::websocketUrl() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("ws", "");
  prefs_.end();
  return value;
}

void Settings::setUrls(const String& backend, const String& websocket) {
  prefs_.begin(kNamespace, false);
  prefs_.putString("api", backend);
  prefs_.putString("ws", websocket);
  prefs_.end();
}

String Settings::deviceToken() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("token", "");
  prefs_.end();
  return value;
}

void Settings::setDeviceToken(const String& token) {
  prefs_.begin(kNamespace, false);
  prefs_.putString("token", token);
  prefs_.end();
}

bool Settings::isPaired() const { return deviceToken().length() > 0; }

bool Settings::hasCloud() const { return websocketUrl().length() > 0; }

bool Settings::isFirstBoot() const {
  prefs_.begin(kNamespace, true);
  const bool booted = prefs_.getBool("booted", false);
  prefs_.end();
  return !booted;
}

void Settings::markBooted() {
  prefs_.begin(kNamespace, false);
  prefs_.putBool("booted", true);
  prefs_.end();
}

String Settings::userName() const {
  prefs_.begin(kNamespace, true);
  const String value = prefs_.getString("user", "Gülçin");
  prefs_.end();
  return value;
}

void Settings::setUserName(const String& name) {
  prefs_.begin(kNamespace, false);
  prefs_.putString("user", name);
  prefs_.end();
}

BootRecord Settings::bootRecord() const {
  prefs_.begin(kNamespace, true);
  BootRecord record{};
  record.bootAttempts = prefs_.getUChar("otaTry", 0);
  record.confirmed = prefs_.getBool("otaOk", true);
  prefs_.end();
  return record;
}

void Settings::setBootRecord(const BootRecord& record) {
  prefs_.begin(kNamespace, false);
  prefs_.putUChar("otaTry", record.bootAttempts);
  prefs_.putBool("otaOk", record.confirmed);
  prefs_.end();
}

void Settings::factoryReset() {
  prefs_.begin(kNamespace, false);
  prefs_.clear();
  prefs_.end();
}

}  // namespace elcin
