---
trigger: always_on
---

## 🛠 Tauri & Rust Performance Rules

- **Zero-Clone Policy:** Rust tarafında `Clone` kullanımını minimize et. Veri sahipliği (`ownership`) ve referanslar (`&T`) üzerinden ilerle. Büyük veri setleri için `Arc<T>` kullan.
- **Async-First Backend:** Yoğun işlemleri `tokio` runtime kullanarak ana thread'i bloklamadan yap. CPU-intensive işler için `rayon` kullan.
- **Anti-Cheat Safety:** Oyun süreçlerini (process) izlerken veya bellek taraması yaparken asla **DLL Injection** veya **Invasive Hooking** yöntemlerini kullanma. Sadece resmi Windows API'lerini (`EnumProcesses`, `GetModuleFileNameEx` vb.) kullan ve handle'ları hemen serbest bırak.
- **Minimal IPC Overhead:** Frontend ve Backend arasındaki `invoke` trafiğini minimize et. Verileri küçük parçalar yerine "batch" (toplu) halde gönder. `serde` serileştirmesini optimize et.
- **Memory Footprint:** Arka planda çalışırken bellek kullanımını düşük tutmak için `Box<[T]>` gibi sabit boyutlu collection'ları tercih et.

## ⚛️ React & UI Performance Rules

- **Strict Memoization:** Tüm bileşenleri `React.memo` ile sarmalla. Fonksiyonları `useCallback`, hesaplamaları `useMemo` içine al.
- **State Management:** `Zustand` kullanırken "Fine-grained subscription" prensibini uygula. Tüm store'u çekmek yerine sadece ilgili primitive değerleri seç:

```typescript
const score = useStore((state) => state.score); // Doğru
```

- **No Vibe Coding UI:** AI tarafından üretilen "generic" tasarım kalıplarından kaçın. CSS-in-JS (Styled-components vb.) yerine **Tailwind CSS** veya **CSS Modules** kullanarak runtime yükünü sıfıra indir.
- **Render Audit:** Gereksiz render'ları önlemek için `why-did-you-render` kontrolü yapılmış gibi optimize et. DOM düğümü sayısını (DOM tree depth) minimumda tut.
- **Virtualization:** Oyun listesi gibi uzun listelerde mutlaka `react-window` veya `tanstack-virtual` kullan.

## 🛡 Type-Safety & Code Standards

- **Strict TypeScript:** `any` kullanımı yasaktır. Tüm `invoke` fonksiyonları için Rust tarafındaki `struct`'lar ile Frontend tarafındaki `interface`'ler birebir uyumlu (TS-RS gibi kütüphanelerle otomatik oluşturulmuşçasına) olmalı.
- **Error Handling:** Result pattern kullan. `unwrap()` yerine `match` veya `?` operatörü ile hataları yönet ve kullanıcıya performans kaybı yaratmadan (non-blocking) bildir.
