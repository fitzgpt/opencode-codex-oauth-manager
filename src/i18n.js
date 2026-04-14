"use strict";

const translations = {
  en: {
    accounts: "Accounts:",
    active: "ACTIVE",
    healthCheckStarted: "Refreshing account health status...",
    healthCheckComplete: "Health check complete.",
    commands: "number=switch | 0=refresh health | r <n> <name>=rename | l=change language | b=backup | i=import | q=exit",
    selection: "Selection: ",
    exit: "Exit.",
    invalidNumber: "Invalid number.",
    nameEmpty: "Name cannot be empty.",
    accountNotFound: "Account not found.",
    nameUpdated: "Name updated: ",
    switchedTo: "Switched to: ",
    invalidCommand: "Invalid command.",
    addedToDepo: "Added to repository: ",
    noAccounts: "No accounts to select in depo.json.",
    authNotFound: "auth.json not found: ",
    noOpenAiAccount: "auth.json does not contain openai account.",
    tokenExpired: "token expired",
    noToken: "no token",
    noAccountId: "no accountId",
    apiError: "api error",
    timeout: "timeout",
    remaining: "remaining",
    reset: "Reset",
    weeklyReset: "Weekly Reset",
    fiveHourReset: "5-Hour Reset",
    unknown: "unknown",
    quota: "quota",
    langSwitched: "Language switched to English.",
    newUpdateAvailable: "🚀 NEW UPDATE AVAILABLE (v",
    runGitPull: ")! Run 'git pull' to update.",
    usageCount: "Usage:",
    backupSuccess: "Backup created: ",
    importSuccess: "Accounts imported successfully!",
    importFailed: "Failed to import backup: ",
    times: "times"
  },
  tr: {
    accounts: "Hesaplar:",
    active: "AKTİF",
    healthCheckStarted: "Hesap sağlık durumu güncelleniyor...",
    healthCheckComplete: "Sağlık kontrolü tamamlandı.",
    commands: "numara=geçiş | 0=sağlık kontrolü | r <n> <isim>=yeniden adlandır | l=dili değiştir | b=yedekle | i=içe aktar | q=çıkış",
    selection: "Seçim: ",
    exit: "Çıkış.",
    invalidNumber: "Geçersiz numara.",
    nameEmpty: "İsim boş olamaz.",
    accountNotFound: "Hesap bulunamadı.",
    nameUpdated: "İsim güncellendi: ",
    switchedTo: "Şuna geçildi: ",
    invalidCommand: "Geçersiz komut.",
    addedToDepo: "Depoya eklendi: ",
    noAccounts: "depo.json içinde seçilecek hesap yok.",
    authNotFound: "auth.json bulunamadı: ",
    noOpenAiAccount: "auth.json içinde openai hesabı yok.",
    tokenExpired: "token süresi dolmuş",
    noToken: "token yok",
    noAccountId: "accountId yok",
    apiError: "api hatası",
    timeout: "zaman aşımı",
    remaining: "kaldı",
    reset: "Sıfırlama",
    weeklyReset: "Haftalık Sıfırlama",
    fiveHourReset: "5 Saatlik Sıfırlama",
    unknown: "bilinmiyor",
    quota: "hak",
    langSwitched: "Dil Türkçe olarak değiştirildi.",
    newUpdateAvailable: "🚀 YENİ GÜNCELLEME MEVCUT (v",
    runGitPull: ")! Güncellemek için 'git pull' yazın.",
    usageCount: "Kullanım:",
    backupSuccess: "Yedek oluşturuldu: ",
    importSuccess: "Hesaplar başarıyla içe aktarıldı!",
    importFailed: "Yedek içe aktarılamadı: ",
    times: "defa"
  }
};

let currentLang = "en";

function detectSystemLanguage() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith("tr") || locale.startsWith("az")) return "tr";
  } catch (e) {
    const envLang = (process.env.LANG || process.env.LANGUAGE || "").toLowerCase();
    if (envLang.startsWith("tr") || envLang.startsWith("az")) return "tr";
  }
  return "en";
}

function t(key) {
  return translations[currentLang][key] || key;
}

module.exports = {
  t,
  get currentLang() { return currentLang; },
  set currentLang(val) { currentLang = val; },
  detectSystemLanguage
};
