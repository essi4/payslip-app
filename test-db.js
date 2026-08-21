import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('\n--- تست مستقیم دیتابیس ---\n');
  try {
    // ۱. ساخت جدول با کوئری کاملاً تمیز در یک خط
    await pool.query('CREATE TABLE IF NOT EXISTS payslips (id SERIAL PRIMARY KEY, personnel_id INT, year VARCHAR(10), month VARCHAR(20), base_salary NUMERIC DEFAULT 0, net_salary NUMERIC DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
    console.log(' جدول payslips با موفقیت ساخته/تایید شد.');

    // ۲. شمارش رکوردها
    const res = await pool.query('SELECT COUNT(*) FROM payslips;');
    console.log(` تعداد فیش‌های ثبت شده: ${res.rows[0].count}`);

    console.log('\n دیتابیس بدون هیچ مشکلی آماده استفاده است!\n');
  } catch (err) {
    console.error(' خطا:', err.message);
  } finally {
    await pool.end();
  }
}

run();