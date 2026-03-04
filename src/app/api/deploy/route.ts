import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { exec } from "child_process";
import path from "path";

const SECRET = process.env.DEPLOY_WEBHOOK_SECRET ?? "";
const APP_DIR = path.join(process.env.HOME ?? "/home/pi", "planner");
const PM2_BIN = "/usr/bin/pm2";

function verifySignature(payload: string, signature: string): boolean {
  if (!SECRET) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // main 브랜치 push만 처리
  try {
    const body = JSON.parse(rawBody);
    if (body.ref !== "refs/heads/main") {
      return NextResponse.json({ ok: true, skipped: true });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 비동기로 배포 실행 (응답은 즉시 반환)
  const deployCmd = [
    `cd ${APP_DIR}`,
    "git pull origin main",
    "npm install --prefer-offline",
    "npm run build",
    `${PM2_BIN} restart planner`,
  ].join(" && ");

  exec(deployCmd, { env: { ...process.env, HOME: process.env.HOME ?? "/home/pi" } },
    (err, stdout, stderr) => {
      if (err) console.error("[deploy] error:", stderr);
      else console.log("[deploy] done:", stdout.slice(-200));
    }
  );

  return NextResponse.json({ ok: true, message: "Deploy started" });
}
