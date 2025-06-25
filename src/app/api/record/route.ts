// app/api/record/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto"; // <-- Import here

export async function POST(req: NextRequest) {
  const { salary, bonus, includeBonusInTaxableIncome } = await req.json();

  // Get IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  // Hash IP address for confidentiality
  const hashedIp = crypto.createHash("sha256").update(ip).digest("hex");

  const timestamp = new Date().toISOString();

  // Log or store the anonymized data
  console.log("Confidential Record:", {
    ip,
    hashedIp,
    timestamp,
    salary,
    bonus,
    includeBonusInTaxableIncome,
  });

  return NextResponse.json({ success: true });
}
