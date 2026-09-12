// app/components/auth/LoginForm.tsx
// -----------------------------------------------------------------------------
// 登录 / 注册 / 验证码 三模式表单（Client Component）。
// 服务端复检同规则（lib/auth/validate），此处第一道校验只为省一次往返。
// 登录/注册成功 → 跳 nextPath（锁定卡带来的回跳地址）。
//
// 身份模型：登录标识可为「账号名」或「邮箱」（账号名不含 @，靠此区分）；
//   注册时账号名必填，邮箱可选（仅用于验证码登录等增强能力）。
// -----------------------------------------------------------------------------
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';

import {
  isValidEmail,
  validatePassword,
  validateUsername,
} from '@/lib/auth/validate';

type Mode = 'login' | 'register' | 'otp';

interface ApiResult {
  ok: boolean;
  error?: string;
  devCode?: string; // 仅开发环境回显，便于本地联调
}

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  // 登录
  const [identifier, setIdentifier] = useState('');
  // 注册
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  // 通用
  const [password, setPassword] = useState('');
  // 验证码
  const [code, setCode] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 验证码重发冷却
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setDevCode(null);
  };

  const post = async (url: string, body: unknown): Promise<ApiResult> => {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await resp.json()) as ApiResult;
  };

  const handleLogin = async () => {
    const id = identifier.trim();
    if (!id || !password) {
      setError('请输入账号（或邮箱）和密码');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const json = await post('/api/auth/login', { identifier: id, password });
      if (!json.ok) {
        setError(json.error ?? '登录失败，请稍后重试');
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const uname = username.trim();
    const mail = email.trim();
    const unameErr = validateUsername(uname);
    if (unameErr) {
      setError(unameErr);
      return;
    }
    if (mail && !isValidEmail(mail)) {
      setError('邮箱格式无效');
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const json = await post('/api/auth/register', {
        username: uname,
        email: mail || undefined,
        password,
      });
      if (!json.ok) {
        setError(json.error ?? '注册失败，请稍后重试');
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const mail = email.trim();
    if (!isValidEmail(mail)) {
      setError('请输入有效邮箱');
      return;
    }
    setError(null);
    setSendState('sending');
    try {
      const json = await post('/api/auth/otp/send', { email: mail });
      if (!json.ok) {
        setError(json.error ?? '验证码发送失败，请稍后重试');
        setSendState('idle');
        return;
      }
      setSendState('sent');
      setCooldown(60);
      if (json.devCode) setDevCode(json.devCode);
    } catch {
      setError('网络错误，请稍后重试');
      setSendState('idle');
    }
  };

  const handleVerifyOtp = async () => {
    const mail = email.trim();
    if (!isValidEmail(mail)) {
      setError('请输入有效邮箱');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('请输入 6 位验证码');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const json = await post('/api/auth/otp/verify', {
        email: mail,
        code: code.trim(),
      });
      if (!json.ok) {
        setError(json.error ?? '验证失败，请稍后重试');
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? '登录' : mode === 'register' ? '注册' : '邮箱验证码登录';
  const subtitle =
    mode === 'login'
      ? '登录后查看全部文章与音乐库'
      : mode === 'register'
        ? '注册阿鲲の小窝账号：自定义账号名 + 密码'
        : '输入绑定邮箱，用验证码免密登录';

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--panel-shadow-sm)]">
      <h2 className="text-center text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1.5 mb-5 text-center text-sm text-[var(--text-secondary)]">{subtitle}</p>

      <div className="space-y-3">
        {mode === 'login' && (
          <input
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="账号名或邮箱"
            autoComplete="username"
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
            aria-label="账号名或邮箱"
          />
        )}

        {mode === 'register' && (
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError(null);
            }}
            placeholder="账号名（3-20 位字母/数字/下划线）"
            autoComplete="username"
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
            aria-label="账号名"
          />
        )}

        {mode === 'register' && (
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="邮箱（可选，用于验证码登录）"
            autoComplete="email"
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
            aria-label="邮箱（可选）"
          />
        )}

        {mode !== 'otp' && (
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) void (mode === 'login' ? handleLogin() : handleRegister());
            }}
            placeholder="密码（含数字+字母+符号，至少 8 位）"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
            aria-label="密码"
          />
        )}

        {mode === 'otp' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="绑定邮箱"
              autoComplete="email"
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
              aria-label="绑定邮箱"
            />
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) void handleVerifyOtp();
                }}
                placeholder="6 位验证码"
                className="min-w-0 flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                aria-label="验证码"
              />
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={sendState === 'sending' || cooldown > 0}
                className="shrink-0 rounded-xl border border-[var(--input-border)] px-3 text-sm text-[var(--accent)] transition-colors hover:bg-[var(--theme-toggle-hover)] disabled:opacity-50"
              >
                {sendState === 'sending'
                  ? '发送中…'
                  : cooldown > 0
                    ? `${cooldown}s`
                    : '发送验证码'}
              </button>
            </div>
            {devCode && (
              <p className="text-xs text-[var(--text-muted)]">
                开发模式验证码：<span className="font-mono text-[var(--accent)]">{devCode}</span>
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          void (mode === 'login'
            ? handleLogin()
            : mode === 'register'
              ? handleRegister()
              : handleVerifyOtp())
        }
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'login' ? '登录' : mode === 'register' ? '注册并登录' : '登录'}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-[var(--text-secondary)]">
        {(['login', 'register', 'otp'] as Mode[])
          .filter((m) => m !== mode)
          .map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className="text-[var(--accent)] hover:underline"
            >
              {m === 'login' ? '账号密码登录' : m === 'register' ? '注册账号' : (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> 验证码登录
                </span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
}
