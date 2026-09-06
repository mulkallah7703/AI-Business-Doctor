"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo") === "1";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function authenticate(email: string, password: string) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError(t("error"));
      return;
    }
    window.location.href = `/${locale}/briefing`;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authenticate(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
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
              <label className="text-sm">{t("email")}</label>
              <Input
                name="email"
                type="email"
                defaultValue={demo ? "demo@businessdoctor.ai" : ""}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">{t("password")}</label>
              <Input
                name="password"
                type="password"
                defaultValue={demo ? "demo1234" : ""}
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button className="w-full" disabled={pending}>
              {pending ? "…" : t("submit")}
            </Button>
          </form>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => authenticate("demo@businessdoctor.ai", "demo1234")}
            >
              {t("tryDemo")}
            </Button>
            <p className="text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-primary">
                {t("signup")}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("demoHint")}: demo@businessdoctor.ai / demo1234
            </p>
            <Link href="/" className="text-primary">
              {t("back")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
