import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // Mengaktifkan global variable Node.js seperti process, console, dsb.
      },
    },
    rules: {
      // Aturan-aturan untuk Clean Code Anda
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^req|^res|^next|^error" }], // Variabel tidak terpakai jadi warning (diabaikan jika req/res/next)
      "no-console": "off",       // Diizinkan memakai console.log/console.error untuk logging backend
      "eqeqeq": "error",         // Wajib menggunakan === dan !== (menghindari bug tipe data otomatis)
      "curly": "error",          // Wajib menggunakan kurung kurawal {} untuk block if/else
      "no-duplicate-imports": "error", // Melarang double import dari file yang sama
      "prefer-const": "warn",    // Menyarankan const jika variabel nilainya tidak pernah diubah
    },
  },
];