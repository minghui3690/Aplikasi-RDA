# PANDUAN INTEGRASI FRONTEND REACT KE BACKEND LARAVEL (FULLSTACK)

Panduan ini menjelaskan cara mengubah aplikasi ini dari mode "Simulasi Browser" menjadi aplikasi Fullstack nyata yang terhubung ke Laravel 12 dan MySQL.

## BAGIAN 1: PERSIAPAN BACKEND (LARAVEL)

Sebelum menyentuh kode React, Anda harus menyiapkan backend Laravel terlebih dahulu.

### 1. Instalasi Laravel
Jalankan perintah ini di terminal Anda:
```bash
composer create-project laravel/laravel rda-backend
cd rda-backend
```

### 2. Konfigurasi Database (.env)
Buka file `.env` di project Laravel dan atur koneksi database:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rdabusiness
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Membuat Migrations & Model
Anda perlu membuat tabel yang sesuai dengan tipe data di frontend (`types.ts`).

**a. Tabel Users**
Pastikan tabel user memiliki kolom tambahan:
- `referral_code` (string, unique)
- `upline_id` (nullable, foreign key ke users.id)
- `wallet_balance` (decimal/double)
- `role` (enum: 'ADMIN', 'MEMBER')

**b. Tabel Products**
- `name`, `price` (decimal), `points` (integer), `description`.

**c. Tabel Transactions**
- `user_id`, `product_id`, `amount`, `points`, `created_at`.

**d. Tabel Commission_Logs**
- `transaction_id`, `beneficiary_id` (penerima), `source_user_id` (pembeli), `level`, `amount`.

**e. Tabel Settings**
- `key` (string), `value` (json/text) untuk menyimpan persentase level.

### 4. Memindahkan Logika Bisnis (PENTING)
Logika "Unilevel" yang saat ini ada di file `services/mockDatabase.ts` (fungsi `processPurchase`) **HARUS** ditulis ulang ke dalam Controller Laravel (PHP).

**Contoh Logika PHP (TransactionController.php):**
```php
public function store(Request $request) {
    // 1. Simpan Transaksi
    $user = auth()->user();
    $product = Product::find($request->product_id);
    
    $trx = Transaction::create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'amount' => $product->price,
        'points' => $product->points
    ]);

    // 2. Logika Unilevel (Looping ke atas)
    $upline = $user->upline;
    $level = 1;
    $settings = json_decode(Setting::get('commission_levels')); // [20, 5, 2]
    
    while($upline && $level <= count($settings)) {
        $percent = $settings[$level - 1];
        $commission = $product->points * ($percent / 100) * 1; // Kurs Rp 1
        
        // Update Wallet Upline
        $upline->increment('wallet_balance', $commission);
        
        // Catat Log
        CommissionLog::create([
            'transaction_id' => $trx->id,
            'beneficiary_id' => $upline->id,
            'source_user_id' => $user->id,
            'level' => $level,
            'amount' => $commission
        ]);

        $upline = $upline->upline; // Naik ke level atasnya
        $level++;
    }
    
    return response()->json(['message' => 'Success']);
}
```

### 5. Membuat API Routes (api.php)
Buat endpoint yang akan dipanggil oleh Frontend:
- `POST /api/login` (Return token Sanctum + data User)
- `POST /api/register`
- `GET /api/products`
- `POST /api/transactions` (Untuk beli produk)
- `GET /api/network` (Return struktur tree JSON)
- `GET /api/user/history` (Return riwayat transaksi/komisi)

---

## BAGIAN 2: INTEGRASI FRONTEND (REACT)

Sekarang, ubah kode React agar tidak menggunakan `localStorage` lagi, tapi menggunakan API Laravel.

### 1. Install Axios
```bash
npm install axios
```

### 2. Buat Service API Baru
Buat file baru `src/services/api.ts` untuk menggantikan `mockDatabase.ts`.

**Contoh kode `api.ts`:**
```typescript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Ganti dengan domain Anda nanti

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Tambahkan token otomatis jika sudah login
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = async (email, password) => {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('auth_token', response.data.token);
    return response.data.user;
};

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const purchaseProduct = async (productId) => {
    return await api.post('/transactions', { product_id: productId });
};

// ... dan seterusnya untuk fungsi lain
```

### 3. Update App.tsx
Buka file `App.tsx` dan ganti semua pemanggilan `db.xxx()` menjadi pemanggilan ke `api.ts`.

*Lama (Mock):*
```typescript
const user = db.loginUser(loginEmail);
```

*Baru (API):*
```typescript
import * as API from './services/api';

// ... di dalam fungsi handleLogin
try {
   const user = await API.loginUser(loginEmail, password);
   // ...
}
```

---

## BAGIAN 3: DEPLOYMENT KE CPANEL

### 1. Build React App
Jalankan perintah build untuk mengubah kode React menjadi file HTML/JS statis:
```bash
npm run build
```
Hasilnya akan ada di folder `dist` atau `build`.

### 2. Upload Laravel
1. Zip folder project Laravel Anda.
2. Upload ke File Manager CPanel (biasanya di luar folder `public_html`, misal: `/home/user/laravel_project`).
3. Setup Database MySQL di CPanel dan import file SQL.
4. Sesuaikan `.env` di CPanel dengan kredensial database CPanel.

### 3. Menghubungkan Frontend
Ada 2 cara umum:

**Cara A (Disatukan):**
1. Ambil semua isi folder `dist` (hasil build React).
2. Pindahkan ke dalam folder `public` milik Laravel.
3. Pastikan `index.html` React menjadi entry point utama atau di-load melalui View Laravel `welcome.blade.php`.

**Cara B (Terpisah / Subdomain - REKOMENDASI):**
1. Buat folder `api` di `public_html` dan arahkan domain utama ke sana untuk Laravel (Backend).
2. Upload hasil build React (`dist`) ke `public_html` utama (Frontend).
3. Di file React `services/api.ts`, ubah `API_URL` menjadi `https://namadomain.com/api`.
4. Di CPanel, buat file `.htaccess` di root folder React agar routing SPA (Single Page Application) berjalan lancar (tidak 404 saat refresh):

**Isi .htaccess untuk React:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```
