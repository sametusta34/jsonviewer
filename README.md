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
- **CSV İndir** — UTF-8 BOM ile Excel uyumlu (tüm tablo görünümlerinde)
- **Excel İndir** — `.xlsx` formatında (tüm tablo görünümlerinde)
- **Her tabloda export** — Array of objects, single object veya joined tablo, hepsini indirebilirsin

### 🔗 İlişkisel Tablo Birleştirme (JOIN)
- **Multi-table JSON desteği** — Apiaries/Hives, Users/Departments gibi ilişkisel veriler
- **Tab bar navigasyon** — Üst panelde tablo seçici (departments, employees, hives, vb.)
- **Tablo birleştirme** — İki tabloyu foreign key ile join et
- **Left JOIN mantığı** — Sol tablonun tüm satırları + eşleşen sağ tablo alanları
- **Kolon prefix** — Çakışan kolon adlarını önlemek için otomatik prefix (apiary_, department_, vb.)
- **Birleştir Modal** — 
  - Sol/sağ tablo seçimi
  - Join alan seçimi (leftKey = rightKey)
  - Prefix özelleştirmesi
  - Sonuç CSV/Excel export
- **Örnek**: `hives` tablosunu `apiaries` ile join → her kovasının hangi apiaryda olduğunu görebilirsin

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

### Basit Tablo Görüntüleme
1. **JSON Gir** — Editöre JSON yapıştır, dosya yükle veya sürükle
2. **Doğrulama** — Otomatik doğrulama, hataları görür ve düzeltirsin
3. **Tablo Görünümü** — Geçerli JSON otomatik tablo olarak gösterilir
4. **Sıralama/Filtreleme** — Sütun başlığına tıkla veya filtre alanını kullan
5. **Nested Veriye Erişim** — Object/Array hücrelerine tıklayınca popup açılır
6. **Export** — Tablo toolbar'ında [CSV] [Excel] butonlarıyla indir

### Multi-Table (İlişkisel) Kullanım
1. **Multi-table JSON yükle** — `{apiaries: [...], hives: [...]}` formatında
2. **Tab bar'da tablolar görülür** — [apiaries] [hives] gibi sekmeler
3. **Tablo seç** — Hangi tabloyu görmek istersen tıkla
4. **Birleştir butonuna tıkla** — Header'da "Birleştir" butonu aktif olur
5. **Join Modal açılır**:
   - Sol Tablo: `hives` seç
   - Sağ Tablo: `apiaries` seç
   - Sol Alan: `apiaryId` seç (foreignKey)
   - Sağ Alan: `id` seç (primaryKey)
   - [Join Yap] → Sonuç tablosu açılır
6. **Sonuç CSV/Excel'e aktar** — Modal footer'daki [CSV] [Excel] butonları
7. **Her tablonun kendi CSV/Excel export'u** — Tab bar'da tıkladığın tablonun toolbar'ında da export var

## Örnek JSON

Proje başlatıldığında örnek bir ilişkisel veri seti yüklü gelir (departments & employees):

```json
{
  "departments": [
    {
      "id": 1,
      "name": "Engineering",
      "location": "Istanbul"
    },
    {
      "id": 2,
      "name": "Sales",
      "location": "Ankara"
    }
  ],
  "employees": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "age": 30,
      "departmentId": 1,
      "salary": 95000
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "age": 25,
      "departmentId": 1,
      "salary": 78000
    }
  ]
}
```

**Multi-table örneği**: `employees`'i `departments` ile birleştirip her çalışanın departman adını görebilirsin.

## Kısayollar

- **Escape** — Nested modal veya Join modal'ı kapat
- **Tıkla & Sürükle** — Panel ayırıcısını boyutlandır (ikili görünümde)
- **Tab bar** — Multi-table JSON'da tablolar arasında geçiş yap
- **[Birleştir]** — İlişkisel tabloları join et (header'da multi-table JSON'da görünür)

## Tasarım

- **Dark Theme** — Gözler için rahat, modern slate/blue color scheme
- **Responsive** — Masaüstünde optimize edilmiş
- **Accessibility** — Keyboard navigation ve screen reader destekleri

## Lisans

MIT
