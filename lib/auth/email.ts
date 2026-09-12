// lib/auth/email.ts
// -----------------------------------------------------------------------------
// 邮件发送（server-only）——OTP 验证码投递的唯一切面。
//
// 两种发送方，由 OTP_EMAIL_PROVIDER 二选一：
//   1. smtp   —— 通用 SMTP（QQ 邮箱 / 163 / Gmail 等），走 nodemailer。
//                SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS
//   2. resend —— Resend 事务邮件 API，走 HTTPS。RESEND_API_KEY
// 两者都没配好：退回 console 打印 + 仅在非 production 回显 devCode，供本地联调。
//
// 依赖分层：邮件投递属"可选增强"，缺失时优雅降级（不算 fatal）；
//          是否真正投递成功由 SendResult.delivered 诚实回报给调用方。
// -----------------------------------------------------------------------------
import 'server-only';

import nodemailer from 'nodemailer';

export interface SendResult {
  delivered: boolean; // 是否真正经发送方投出
  devCode?: string; // 仅非 production 回显，便于本地联调
}

const CODE_TTL_MIN = 10;

function mailBody(code: string): { subject: string; text: string } {
  return {
    subject: '阿鲲の小窝 - 登录验证码',
    text: `你的登录验证码是 ${code}（${CODE_TTL_MIN} 分钟内有效，请勿告知他人）。`,
  };
}

async function sendViaSmtp(email: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) return false;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  try {
    // 配置内联，交给 createTransport 的重载自行推断类型
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 465),
      // secure=true 表示直接走 TLS（465）；587 端口应设 false 让它 STARTTLS 升级
      secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
      auth: user && pass ? { user, pass } : undefined,
      // Serverless 环境务必设超时，避免单次发送把函数调用拖到时长上限
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: process.env.OTP_EMAIL_FROM ?? user,
      to: email,
      ...mailBody(code),
    });
    return true;
  } catch (e) {
    console.error('[otp/email] SMTP 发送失败:', e);
    return false;
  }
}

async function sendViaResend(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.OTP_EMAIL_FROM ?? 'onboarding@resend.dev',
        to: email,
        ...mailBody(code),
      }),
    });
    if (!res.ok) {
      console.error('[otp/email] Resend 发送失败:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[otp/email] Resend 请求异常:', e);
    return false;
  }
}

export async function sendOtpEmail(email: string, code: string): Promise<SendResult> {
  const provider = process.env.OTP_EMAIL_PROVIDER;

  let delivered = false;
  if (provider === 'smtp') {
    delivered = await sendViaSmtp(email, code);
  } else if (provider === 'resend') {
    delivered = await sendViaResend(email, code);
  }

  if (delivered) return { delivered: true };

  // 未配置可用发送方：打印到服务端日志，且仅在非 production 回显验证码给前端
  console.log(
    `[OTP] 无可用发送方，${email} 验证码 = ${code}（${CODE_TTL_MIN} 分钟内有效）`,
  );
  if (process.env.NODE_ENV !== 'production') {
    return { delivered: false, devCode: code };
  }
  return { delivered: false };
}
