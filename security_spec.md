# Spesifikasi Keamanan Firestore — Undangan Studio

## 1. Invarian Data
1. **Kepemilikan Akun & PII (`/users/{userId}`)**: Dokumen profil pengguna hanya dapat dibaca (`get`) dan ditulis (`create`, `update`) oleh pemilik `request.auth.uid == userId` yang terverifikasi emailnya. Operasi `list` dilarang sepenuhnya.
2. **Kepemilikan Undangan (`/invitations/{invitationId}`)**: Hanya pemilik terverifikasi (`ownerId == request.auth.uid`) yang dapat membuat, mengubah, menghapus, atau melakukan query `list` undangannya. Tamu publik hanya dapat membaca satu dokumen (`get`) apabila `resource.data.isPublished == true`.
3. **Kunci Status Pembayaran (Terminal State)**: Setelah `isPaid == true`, status pembayaran, metode pembayaran, kode faktur, dan `paidAt` tidak dapat diturunkan kembali menjadi `false` atau dimodifikasi.
4. **Master Gate Subkoleksi Tamu (`/invitations/{invitationId}/guests/{guestId}`)**: Tamu personal tidak dapat dibuat tanpa dokumen undangan induk yang ada dan dimiliki oleh `request.auth.uid`. Pembacaan dan daftar tamu hanya untuk pemilik undangan.
5. **Buku Tamu & RSVP (`/invitations/{invitationId}/wishes/{wishId}`)**: Ucapan hanya boleh dibuat jika dokumen undangan induk ada dan `isPublished == true`, dengan validasi batas karakter (`nama <= 80`, `ucapan <= 400`), status enum (`Hadir` / `Berhalangan`), dan timestamp server (`createdAt == request.time`). Pembaruan oleh tamu dilarang; hanya pemilik undangan yang boleh menghapus ucapan.

## 2. Skenario Uji Penolakan (Dirty Dozen Payloads)
1. **Identity Spoofing on User Create**: Membuat `/users/userB` saat login sebagai `userA` -> DITOLAK.
2. **User List Scraping**: Query `list` pada koleksi `/users` -> DITOLAK.
3. **Invitation Spoofing**: Membuat `/invitations/inv1` dengan `ownerId: "victimUid"` saat login sebagai `attackerUid` -> DITOLAK.
4. **Shadow Field Injection**: Menyisipkan field liar `isAdmin: true` pada `create` `/invitations/inv1` -> DITOLAK (`keys().hasOnly(...)`).
5. **ID Poisoning**: Menggunakan ID dokumen sepanjang 500 karakter atau mengandung karakter ilegal `/` -> DITOLAK (`isValidId()`).
6. **Unverified Email Write**: Menulis dokumen undangan dengan `email_verified: false` -> DITOLAK.
7. **Client Timestamp Forgery**: Mengirim `createdAt` manual bukan `request.time` -> DITOLAK.
8. **Payment Downgrade Attack**: Mengubah `isPaid: true` kembali menjadi `isPaid: false` setelah pembayaran aktif -> DITOLAK.
9. **Cross-Owner Invitation List**: Melakukan `list` pada `/invitations` tanpa filter `ownerId == request.auth.uid` -> DITOLAK.
10. **Orphaned Guest Injection**: Menambah tamu ke `/invitations/invOther/guests/g1` milik pengguna lain -> DITOLAK (`get()` Master Gate).
11. **Wish Spam / Oversized Payload**: Mengirim ucapan dengan panjang 1.000 karakter atau status `"Mungkin"` -> DITOLAK.
12. **Wish Tampering**: Tamu mencoba `update` atau `delete` ucapan orang lain -> DITOLAK.
