# JSON Viewer

Modern JSON viewer ve editor uygulaması. JSON verilerini tablo formatında görüntüle, doğrula, filtrele, sırala ve Excel/CSV olarak dışa aktar.

## Özellikler

### 🔍 JSON Parsing & Validation
- **Gerçek zamanlı doğrulama** — JSON'u yazarken hata/başarı bilgisi
- **Hata raporlama** — Satır ve sütun numarası ile hata konumu gösterimi
- **Biçimlendir/Sıkıştır** — Toolbar butonları ile JSON'u düzenle

### 📊 Spreadsheet-Tarzı Grid
- **Sütun sıralama** — Artan/azalan sıralama (⬆️⬇️ butonları)
- **Gelişmiş sütun filtreleri** — 12 filter operasyonu:
  - İçinde ara, Hariç tut
  - Başında ara, Sonunda ara
  - Eşit, Eşit değil
  - Büyüktür, Küçüktür, Büyük eşit, Küçük eşit
  - Boş, Boş değil
- **Global arama** — Tüm veride ara
- **Renk kodlaması** — Veri tipine göre renklendirilmiş görüntü
  - `number` → sarı
  - `boolean` → yeşil/kırmızı
  - `null` → gri italik
- **Nested veri görünümü** — Colon format (key: value) veya Tablo görünümü seçeneği
- **Tam ekran modu** — Popup'ları tam ekrana genişlet

### 📥 Input
- **Yapıştırma** — Editöre doğrudan JSON yapıştır
- **Dosya yükle** — `.json` dosyasını seç
- **Sürükle-bırak** — JSON dosyasını editöre sürükle

### 📤 Export
- **CSV İndir** — UTF-8 BOM ile Excel uyumlu
- **Excel İndir** — `.xlsx` formatında

### 🎯 İç İçe JSON Yönetimi
- **Nested Popup** — Object/Array hücrelerine tıklayınca modal'da ayrı tablo açılır
- **Recursive navigation** — Popup'lar içinde tekrar nested veriye erişebilirsin

### 🎨 Layout Modları
- **İkili Görünüm** — Editör ve Tablo yan yana (sürükle-boyutlandır)
- **Yalnızca Editör** — JSON girişine odaklan
- **Yalnızca Tablo** — Verileri geniş görüntüle

## Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool (ultra-hızlı dev server)
- **TanStack Table v8** — Advanced table/grid logic
- **Tailwind CSS** — Styling
- **XLSX** — Excel export
- **Lucide React** — Icons

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Tarayıcı otomatik açılır: `http://localhost:5173`

## Build

```bash
npm run build
```

Prodüksiyon derlemesi `dist/` klasörüne kaydedilir.

## Preview

```bash
npm run preview
```

Başarıyla derlenmiş uygulamayı yerel olarak önizle.

## Kullanım

1. **JSON Gir** — Editöre JSON yapıştır, dosya yükle veya sürükle
2. **Doğrulama** — Otomatik doğrulama, hataları görür ve düzeltirsin
3. **Tablo Görünümü** — Geçerli JSON otomatik tablo olarak gösterilir
4. **Sıralama/Filtreleme** — Sütun başlığına tıkla veya filtre alanını kullan
5. **Nested Veriye Erişim** — Object/Array hücrelerine tıklayınca popup açılır
6. **Export** — CSV veya Excel olarak indir

## Örnek JSON

Proje başlatıldığında örnek bir müşteri verisi seti yüklü gelir:

```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "age": 30,
    "active": true,
    "address": {
      "city": "Istanbul",
      "country": "Turkey"
    },
    "tags": ["admin", "editor"]
  },
  ...
]
```

## Kısayollar

- **Escape** — Nested modal'ı kapat
- **Tıkla & Sürükle** — Panel ayırıcısını boyutlandır (ikili görünümde)

## Tasarım

- **Dark Theme** — Gözler için rahat, modern slate/blue color scheme
- **Responsive** — Masaüstünde optimize edilmiş
- **Accessibility** — Keyboard navigation ve screen reader destekleri

## Lisans

MIT
