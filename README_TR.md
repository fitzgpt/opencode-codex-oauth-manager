# 🌐 [English](./README.md) | [Türkçe](./README_TR.md)

# 🚀 opencode-codex-oauth-manager (Türkçe)

![Dashboard Preview](./preview.png)

**"OpenCode deneyimini daha pratik ve kusursuz hale getirmek için geliştirildi."**

[OpenCode](https://github.com/opencode) üzerinde birden fazla **OpenAI Plus, Team veya Business** hesabını yönetmeyi çok daha pratik hale getirmek istedim. Aslında bu aracı kendi iş akışımı hızlandırmak için geliştirmiştim, ancak benzer kurulumlara sahip başkalarının da işine yarayabileceğini düşünerek herkesle paylaşmak istedim.

---

## ⚡ Bir Bakışta: Neden Kritik?

Birden fazla üst düzey hesabı manuel olarak yönetmek bir verimlilik katilidir. İşte bu aracın yeni gizli silahınız olmasının nedenleri:

- **🔥 Sıfır Sürtünme ile Geçiş:** Aktif hesapları 2 saniyenin altında değiştirin. Dosya düzenleme, çıkış/giriş döngüleri yok.
- **⚡ Anında Uygulanır:** **OpenCode'u kapatıp açmanıza gerek yok!** Değişiklikler anında uygulanır. Sadece geçiş yapın ve çalışmaya devam edin.
- **📊 Canlı Kota İstihbaratı:** Tahmin yürütmeyin. Her açılışta kaç mesaj hakkınız kaldığını ve tam sıfırlama sürelerini görün.
- **🧠 Akıllı Otomatik Senkronizasyon:** Mevcut OpenCode hesabınızı otomatik olarak algılar ve yerel veritabanınıza kopyalar.
- **🛡️ Sorumlu Kullanım:** Bu araç verimlilik içindir. **Lütfen sistemi suistimal etmeyin (abuse).**
- **💎 Pro Desteği:** **Pro** hesap kullanıcıları için de mükemmeldir. (Eğer Pro kotanızı bitirmeyi başarabiliyorsanız, helal olsun! 😄)

---

## 🔥 Neden Bir Oyun Değiştirici?

Eğer sıkı bir OpenCode kullanıcısıysanız, bu araç sizin yeni avantajınız:

- **🚀 Hız:** Kişisel ve iş hesapları arasında, bir mesaj yazma süresinden daha kısa sürede geçiş yapın.
- **📉 Şeffaflık:** 5 saatlik ve haftalık limitlerinizi renk kodlu ASCII çubuklarıyla görün.
- **📈 Analiz:** Hangi hesapların size en çok değeri sağladığını görmek için kullanım istatistiklerini takip edin.
- **💾 Taşınabilirlik:** Tüm hesap deponuzu kolayca yedekleyin ve başka bir makineye taşıyın.
- **🌍 Evrensel:** **Windows, Linux ve macOS** için yerel, yüksek performanslı destek.

---

## 🛠️ Gerçekten İşe Yarayan Özellikler

- **İnteraktif Komuta Merkezi:** İsim değiştirme, sağlık kontrolü ve geçiş için şık ve sezgisel bir menü.
- **Otomatik Sağlık Kontrolü:** Her açılışta otomatik yenileme ile her zaman taze verilerle çalışın.
- **Hesap Etiketleme:** Hesaplarınıza `Sirket-Business` veya `Yedek-Plus-2` gibi anlamlı isimler verin.
- **Çoklu Dil Desteği:** İngilizce ve Türkçe dilleri arasında dinamik geçiş.
- **Önce Güvenlik:** Token'larınız makinenizde kalır. Sırlarınıza asla dokunmayız.

---

## 🚀 Hızlı Başlangıç ve Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri)

### Adımlar
1. **Repoyu klonlayın:** 
   ```bash
   git clone https://github.com/fitzgpt/opencode-codex-oauth-manager.git
   cd opencode-codex-oauth-manager
   ```
2. **Tek Tıkla Kurulumu Çalıştırın:**
   - **Windows:** `install.bat` dosyasına çift tıklayın.
   - **Linux/macOS:** `chmod +x install.sh && ./install.sh` komutunu çalıştırın.
3. **Başlatın:** Herhangi bir terminale `oc-hesap` yazın.

---

## 🎮 İnteraktif Komutlar

Karmaşık argümanları unutun. Her şeyi tek tuşla yönetin:

- **`[Numara]`**: Seçilen hesaba anında geçiş yapar.
- **`0`**: Tüm hesapların sağlık/kota durumunu manuel olarak yeniler.
- **`r [N] [İsim]`**: `N` numaralı hesabı istediğiniz isimle yeniden adlandırır.
- **`l`**: Arayüz dilini değiştirir (İngilizce/Türkçe).
- **`b`**: Hesap veritabanınızın zaman damgalı bir yedeğini oluşturur.
- **`i`**: Mevcut bir yedek dosyasını içeri aktarır.
- **`q`**: Programdan güvenli bir şekilde çıkar.

---

## ➕ Yeni Hesap Nasıl Eklenir?

Hesap eklemek tamamen otomatiktir ve zahmetsizdir:

1. **OpenCode**'u açın.
2. `/connect` yazın ve **OpenAI** seçeneğini seçin.
3. Yeni hesabınızla giriş yapın.
4. `oc-hesap` komutunu çalıştırın.
5. **İşte bu kadar!** Yeni hesap otomatik olarak algılanır ve listenize eklenir.

---

## 🗺️ 2026 Yol Haritası

### **Faz 1: Temeller (Tamamlandı) ✅**
- [x] **Modüler Mimari:** Yüksek stabilite için profesyonel kod yapısı.
- [x] **Cross-Platform Desteği:** Tüm işletim sistemleri için yükleyiciler.
- [x] **Otomatik Senkronizasyon:** Yeni OpenCode girişlerini otomatik algılama.
- [x] **Kullanım İstatistikleri:** Hesap kullanım sayılarının takibi.
- [x] **i18n Desteği:** Dinamik İngilizce/Türkçe geçişi.
- [x] **Yedekleme Sistemi:** Veri dışa/içe aktarma.

### **Faz 2: Güç ve Güvenlik (Devam Ediyor) 🏗️**
- [ ] **Ana Şifre:** Kayıtlı token'lar için AES-256 şifreleme.
- [ ] **Paralel Kontroller:** Tüm hesap durumlarını aynı anda yenileme.
- [ ] **Manuel Yönetim:** CLI üzerinden doğrudan hesap ekleme/çıkarma.

### **Faz 3: Gelecek (Çok Yakında) 🌟**
- [ ] **TUI Paneli:** Klavye navigasyonlu, grafiksel terminal arayüzü.
- [ ] **Masaüstü Bildirimleri:** Kotanız sıfırlandığında bildirim alın.
- [ ] **Bulut Senkronizasyonu:** Hesaplarınızı cihazlar arasında güvenli şekilde eşitleyin.

---

## 🤝 Teşekkür & Topluluk

Böylesine harika bir ekosistem oluşturdukları için **OpenCode** ekibine özel teşekkürler.

### Bağlantıda Kalın
Yolculuğu takip etmek ve en son güncellemeleri almak için Twitter üzerinden takip edebilirsiniz:
👉 **[@FitzGPT](https://x.com/FitzGPT)**

---

## 📄 Lisans
[MIT Lisansı](./LICENSE) altında lisanslanmıştır.

[Click here for English documentation (README.md)](./README.md)
