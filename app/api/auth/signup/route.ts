import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createTenant } from "@/lib/org";
import { DEMO_EMAIL } from "@/lib/connectors";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, email, password, organizationName } = parsed.data;
  if (email === DEMO_EMAIL) {
    return NextResponse.json({ error: "Reserved account" }, { status: 409 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { user, organization } = await prisma.$transaction((tx) =>
    createTenant(tx, {
      email,
      name,
      passwordHash,
      organizationName,
    }),
  );

  return NextResponse.json({
    id: user.id,
    email: user.email,
    organizationId: organization.id,
  });
}
