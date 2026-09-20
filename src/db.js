'use strict';
/**
 * Database + Storage access.
 * - Postgres (Supabase) via `pg` for all queries (faithful port of the MySQL queries).
 * - Supabase Storage for uploaded PDFs.
 */
require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// ---------- Postgres pool ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Simple query wrapper: db.query(sql, params) -> rows
async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// Executes a single-statement query ignoring errors that arise only from
// duplicate-key constraints (the port of MySQL INSERT IGNORE).
async function insertIgnore(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return { rowCount: res.rowCount };
  } catch (err) {
    if (isUniqueViolation(err)) return { rowCount: 0, ignored: true };
    throw err;
  }
}

function isUniqueViolation(err) {
  return err && err.code === '23505';
}

// ---------- Supabase Storage ----------
const storage = (() => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      available: false,
      async upload() { throw new Error('Supabase Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).'); },
      async download() { throw new Error('Supabase Storage is not configured.'); },
      async remove() {},
    };
  }
  const client = createClient(url, key);
  const BUCKET = 'pdfs';

  async function ensureBucket() {
    try {
      const { error } = await client.storage.getBucket(BUCKET);
      if (error && error.message && /not found/i.test(error.message || '')) {
        await client.storage.createBucket(BUCKET, { public: false });
      }
    } catch (e) {
      // bucket may not exist yet; try to create it
      try { await client.storage.createBucket(BUCKET, { public: false }); } catch (e2) { /* ignore */ }
    }
  }

  return {
    available: true,
    BUCKET,
    ensureBucket,
    async upload(name, buffer, contentType = 'application/pdf') {
      await ensureBucket();
      const { error } = await client.storage.from(BUCKET).upload(name, buffer, {
        contentType,
        upsert: true,
      });
      if (error) throw new Error('Storage upload failed: ' + error.message);
      return { name };
    },
    async download(name) {
      const { data, error } = await client.storage.from(BUCKET).download(name);
      if (error) {
        const e = new Error(error.message);
        e.code = error.statusCode || 404;
        if (/not found/i.test(error.message)) e.code = 404;
        throw e;
      }
      return Buffer.from(await data.arrayBuffer());
    },
    async list(prefix) {
      await ensureBucket();
      const { data, error } = await client.storage.from(BUCKET).list(prefix);
      if (error) throw new Error('Storage list failed: ' + error.message);
      return (data || []).map((f) => ({ name: f.name, path: prefix + '/' + f.name }));
    },
    async remove(names) {
      if (!Array.isArray(names) || names.length === 0) return;
      await client.storage.from(BUCKET).remove(names);
    },
  };
})();

module.exports = { pool, query, insertIgnore, isUniqueViolation, storage };