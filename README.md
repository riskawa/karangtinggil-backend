# Karangtinggil

## INSTALASI BACK-END

```bash
1. Download dan install database PostgreSQL serta Node js.
   (https://www.postgresql.org/download/)
   (https://nodejs.org/en/download/)
2.	Clone/download Repository karangtinggil-backend.
   (https://github.com/riskawa/karangtinggil-backend)
3. Install dependency dengan perintah "npm install" di folder karangtinggil-backend.
4. Siapkan database di PostgreSQL.
5. Restore file karangtinggil.sql yang ada pada folder karangtinggil-backend ke database yang sudah dibuat.
6. Salin file .env.example menjadi .env, kemudian ubah poin berikut:
   a.	PG_USER     => username postgresql 
   b.	PG_PASSWORD => password user postgresql
   c.	PG_DB_NAME  => nama db
7. Untuk menjalankan back-end ketikkan perintah "node ace serve"

```

For detailed explanation on how things work, check out the [documentation](https://nuxtjs.org).