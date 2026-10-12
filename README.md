# IT Demirbaş ve Zimmet Yönetim Sistemi

Kurum içindeki bilgisayar, sunucu, monitör ve diğer donanımların kaydı, durum takibi ve personele zimmeti için full-stack uygulama. Web paneli zorunlu kapsamı karşılar. Aynı REST API ile çalışan Expo mobil uygulaması QR okuma ve saha işlemlerini ekler.

## Ekran görüntüleri

Giriş

![Giriş ekranı](docs/screenshots/giris.png)

Gösterge paneli: toplam, arızalı, depoda ve zimmetli cihazlar

![Gösterge paneli](docs/screenshots/panel.png)

Durum filtresi uygulanmış cihaz listesi

![Cihaz listesi](docs/screenshots/cihazlar.png)

Cihaz detayı, otomatik QR kod ve zimmet geçmişi

![Cihaz detayı](docs/screenshots/cihaz-detay.png)

Kullanıcı, rol ve departman yönetimi

![Kullanıcılar](docs/screenshots/kullanicilar.png)

Personelin kendi zimmetleri

![Zimmetlerim](docs/screenshots/zimmetlerim.png)

Dar ekranda zimmet kartları

![Mobil web](docs/screenshots/mobil-zimmet.png)

## Özellikler

- JWT ile giriş ve çıkış, yönetici ve personel rolleri
- Kullanıcı ekleme, güncelleme, silme ve şifre sıfırlama
- Cihaz ekleme, güncelleme, silme; her cihaza benzersiz QR kod
- Personele teslim, geri kabul ve arıza bildirimi
- Zimmet geçmişi ve işlem günlüğü (bir cihazda aynı anda tek açık zimmet)
- Durum, departman, kullanıcı ve metin ile filtre; sayfalama
- Başarı ve hata için toast bildirimleri
- Responsive web arayüzü
- Mobil: giriş, kamerayla QR, saha işlemleri, kişisel zimmet listesi
- Docker Compose ile Postgres, API ve web

## Teknolojiler

- API: NestJS, Prisma, PostgreSQL, JWT, bcryptjs
- Web: React, Vite, TypeScript, Tailwind CSS, TanStack Query, Sonner
- Mobil: Expo (React Native), expo-camera
- Paket yöneticisi: pnpm

## Ortam değişkenleri

Kökteki [.env.example](.env.example) dosyasını `apps/api/.env` olarak kopyalayın. Docker Compose bu değerleri servis tanımının içinde verir; yerel çalıştırmada dosya gerekir.

| Değişken | Açıklama | Örnek |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL bağlantısı | `postgresql://demirbas:demirbas@localhost:5432/demirbas` |
| `JWT_SECRET` | Token imza anahtarı | uzun rastgele bir metin |
| `JWT_EXPIRES_IN` | Access token süresi | `8h` |
| `PORT` | API portu | `3000` |
| `CORS_ORIGIN` | İzin verilen web adresleri, virgülle ayrılır | `http://localhost:5173` |
| `VITE_API_URL` | Web'in API adresi. Boşsa istekler `/api` yoluna gider | boş |
| `EXPO_PUBLIC_API_URL` | Mobil uygulamanın API adresi | `http://localhost:3000/api` |

## Docker ile çalıştırma

Docker ve Docker Compose kurulu olmalıdır.

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000/api/health
- Postgres: `localhost:5432`, kullanıcı/şifre/veritabanı `demirbas`

İlk açılışta migrasyon uygulanır ve demo veriler yüklenir. Seed tekrar çalışsa da aynı kayıtları ikinci kez eklemez.

## Yerel geliştirme

Gerekenler: Node.js 22+, pnpm 12 (`corepack enable`), PostgreSQL 16.

```bash
corepack pnpm install
# Windows: copy apps\api\.env.example apps\api\.env
# macOS/Linux: cp apps/api/.env.example apps/api/.env
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev:api
corepack pnpm dev:web
```

Web arayüzü http://localhost:5173 adresindedir. Vite, `/api` isteklerini `localhost:3000` adresine iletir.

Mobil uygulama:

```bash
copy apps\mobile\.env.example apps\mobile\.env
corepack pnpm dev:mobile
```

Telefonda Expo Go ile denerken `EXPO_PUBLIC_API_URL` bilgisayarın yerel IP adresi olmalıdır, örneğin `http://192.168.1.20:3000/api`. Android emülatörü için `http://10.0.2.2:3000/api` kullanın. Telefon ve bilgisayar aynı ağda olmalıdır.

## Demo hesaplar

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Yönetici | admin@kurum.local | Admin123! |
| Personel | ayse.yilmaz@kurum.local | Personel123! |
| Personel | mehmet.demir@kurum.local | Personel123! |
| Personel | zeynep.kaya@kurum.local | Personel123! |

Şifreler veritabanında bcrypt özeti olarak durur.

## Roller

Yönetici cihaz, kullanıcı, departman, zimmet ve arıza işlemlerinin tamamını yapar. Personel envanteri ve kendi zimmetlerini görür, yalnızca kendi üzerindeki cihaz için arıza bildirebilir. Teslim ve geri kabul yöneticiye aittir.

## Veri modeli

Cihaz ile personel arasındaki zimmet kaydı zaman içinde çoktan çoğa ilişkidir. `Assignment.returnedAt` boş olan kayıt açık zimmettir. Veritabanındaki kısmi benzersiz indeks, bir cihazda birden fazla açık zimmet oluşmasını engeller. Her oluşturma, güncelleme, zimmet, iade ve arıza `AssetLog` tablosuna yazılır.

Durumlar: `IN_STOCK` depoda, `ASSIGNED` zimmetli, `FAULTY` arızalı, `RETIRED` hurda. İade, cihaz arızalı değilse depoya alır. Arızalı cihaz iade edilince arıza durumu korunur.

## API özeti

Tüm korumalı isteklerde `Authorization: Bearer <token>` başlığı gerekir. Listeler `page`, `limit` ve `search` alır; cevap `{ data, meta }` şeklindedir.

- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout` istemci token'ı siler
- `GET /api/auth/me`
- `GET /api/dashboard/stats`
- `GET|POST /api/users`, `PATCH /api/users/:id`, `PATCH /api/users/:id/password`, `DELETE /api/users/:id`
- `GET|POST /api/departments`, `PATCH|DELETE /api/departments/:id`
- `GET|POST /api/assets`, `GET /api/assets/:id`, `GET /api/assets/by-code/:qrCode`, `GET /api/assets/:id/qr`
- `PATCH|DELETE /api/assets/:id`, `POST /api/assets/:id/fault`
- `GET|POST /api/assignments`, `POST /api/assignments/:id/return`
- `GET /api/me/assets`

Cihaz listesi filtreleri: `status`, `type`, `departmentId`, `userId`.
