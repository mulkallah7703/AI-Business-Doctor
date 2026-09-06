"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const t = useTranslations("signup");
  const locale = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      organizationName: String(form.get("organizationName") ?? ""),
    };
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setPending(false);
      setError(body.error === "Email already registered" ? t("exists") : t("error"));
      return;
    }
    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError(t("loginAfter"));
      return;
    }
    window.location.href = `/${locale}/onboarding`;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="text-sm font-semibold">{t("title")}</span>
        </Link>
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm" htmlFor="name">
                {t("name")}
              </label>
              <Input id="name" name="name" required minLength={2} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm" htmlFor="organizationName">
                {t("organizationName")}
              </label>
              <Input id="organizationName" name="organizationName" required minLength={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm" htmlFor="email">
                {t("email")}
              </label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm" htmlFor="password">
                {t("password")}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button className="w-full" disabled={pending}>
              {pending ? "…" : t("submit")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary">
              {t("login")}
            </Link>
          </p>
          <Link href="/" className="mt-3 inline-block text-sm text-primary">
            {t("back")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
