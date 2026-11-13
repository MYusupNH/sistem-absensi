import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diisi.");
}

const sql = neon(process.env.DATABASE_URL);

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error(
    "Isi ADMIN_EMAIL dan ADMIN_PASSWORD di .env.local"
  );
}

if (password.length < 8) {
  throw new Error("Password admin minimal 8 karakter.");
}

const hash = await bcrypt.hash(password, 12);

const existing = await sql`
  SELECT id, role
  FROM users
  WHERE email = ${email}
  LIMIT 1
`;

if (existing.length > 0) {
  if (existing[0].role !== "admin") {
    throw new Error(
      "Email tersebut sudah digunakan oleh akun non-admin."
    );
  }

  await sql`
    UPDATE users
    SET
      password_hash = ${hash},
      is_active = TRUE
    WHERE id = ${existing[0].id}
  `;

  console.log("Password Admin berhasil diperbarui.");
} else {
  await sql`
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      role,
      school_id,
      is_active
    )
    VALUES (
      'Administrator STRIDE',
      ${email},
      ${hash},
      'admin',
      NULL,
      TRUE
    )
  `;

  console.log("Akun Admin berhasil dibuat.");
}

console.log("Email Admin:", email);
console.log("Silakan login menggunakan password di .env.local.");