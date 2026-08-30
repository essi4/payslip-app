import { NextResponse } from "next/server";
import pool from "../../lib/db.js";
import { requireAdmin } from "../../lib/admin-auth.js";
import { writeAuditLog } from "../../lib/audit-log.js";

export async function GET(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try { const { rows } = await pool.query(`SELECT pp.id,pp.company_id,pp.year,pp.month,pp.status,pp.start_date,pp.end_date,pp.created_at,pp.updated_at,COUNT(p.id)::int AS payslip_count FROM payroll_periods pp LEFT JOIN payslips p ON p.payroll_period_id=pp.id GROUP BY pp.id ORDER BY pp.year DESC,pp.month DESC,pp.id DESC`); return NextResponse.json({success:true,data:rows}); }
  catch(error){ console.error("GET /api/payroll-periods:",error); return NextResponse.json({success:false,error:"خطا در دریافت دوره‌های حقوق"},{status:500}); }
}

export async function POST(request) {
  const authError=requireAdmin(request); if(authError)return authError;
  try { const body=await request.json(),companyId=Number(body.company_id),year=Number(body.year),month=Number(body.month),status=body.status||"open",startDate=body.start_date||null,endDate=body.end_date||null;
    if(!Number.isInteger(companyId)||!Number.isInteger(year)||!Number.isInteger(month))return NextResponse.json({success:false,error:"company_id، year و month الزامی هستند"},{status:400});
    if(month<1||month>12)return NextResponse.json({success:false,error:"ماه باید بین ۱ تا ۱۲ باشد"},{status:400});
    if(!["open","closed"].includes(status))return NextResponse.json({success:false,error:"وضعیت دوره نامعتبر است"},{status:400});
    const duplicate=await pool.query(`SELECT id FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1`,[companyId,year,month]);
    if(duplicate.rowCount>0)return NextResponse.json({success:false,error:"این دوره برای این شرکت قبلاً ثبت شده است"},{status:409});
    const {rows}=await pool.query(`INSERT INTO payroll_periods (company_id,year,month,status,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[companyId,year,month,status,startDate,endDate]);
    const row=rows[0]; await writeAuditLog({action:"CREATE",entityType:"payroll_period",entityId:row.id,payrollPeriodId:row.id,details:{company_id:row.company_id,year:row.year,month:row.month,status:row.status}});
    return NextResponse.json({success:true,data:row},{status:201});
  } catch(error){console.error("POST /api/payroll-periods:",error);return NextResponse.json({success:false,error:"خطا در ایجاد دوره حقوق"},{status:500});}
}

export async function PATCH(request) {
  const authError=requireAdmin(request); if(authError)return authError;
  try { const body=await request.json(),id=Number(body.id),status=body.status;
    if(!Number.isInteger(id))return NextResponse.json({success:false,error:"شناسه دوره مشخص نشده است"},{status:400});
    if(!["open","closed"].includes(status))return NextResponse.json({success:false,error:"وضعیت دوره باید open یا closed باشد"},{status:400});
    const before=await pool.query(`SELECT * FROM payroll_periods WHERE id=$1`,[id]);
    if(!before.rows.length)return NextResponse.json({success:false,error:"دوره موردنظر پیدا نشد"},{status:404});
    const {rows}=await pool.query(`UPDATE payroll_periods SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,[status,id]);
    const row=rows[0]; await writeAuditLog({action:status==="closed"?"CLOSE":"OPEN",entityType:"payroll_period",entityId:id,payrollPeriodId:id,details:{before_status:before.rows[0].status,after_status:row.status,year:row.year,month:row.month,company_id:row.company_id}});
    return NextResponse.json({success:true,data:row});
  } catch(error){console.error("PATCH /api/payroll-periods:",error);return NextResponse.json({success:false,error:"خطا در تغییر وضعیت دوره"},{status:500});}
}
