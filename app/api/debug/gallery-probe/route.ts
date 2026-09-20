import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { extractStoragePath } from "@/lib/actions/gallery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const probePath = searchParams.get("path");

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let adminClientDbResult: any = null;
  let adminClientStorageResult: any = null;
  let probeDeleteResult: any = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from("gallery") as any).select("*");
    adminClientDbResult = { dataCount: data?.length, data, error };
  } catch (err: any) {
    adminClientDbResult = { exception: err?.message };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("media").list("gallery");
    adminClientStorageResult = {
      fileCount: data?.length,
      files: data?.map((f: any) => ({ name: f.name, size: f.metadata?.size, created_at: f.created_at })),
      error,
    };
  } catch (err: any) {
    adminClientStorageResult = { exception: err?.message };
  }

  let anonClientDbResult: any = null;
  try {
    const anon = await createClient();
    const { data, error } = await (anon.from("gallery") as any).select("id, title, media_url");
    anonClientDbResult = { dataCount: data?.length, error };
  } catch (err: any) {
    anonClientDbResult = { exception: err?.message };
  }

  if (probePath) {
    try {
      const admin = createAdminClient();
      const res = await admin.storage.from("media").remove([probePath]);
      probeDeleteResult = { probePath, res };
    } catch (err: any) {
      probeDeleteResult = { probePath, exception: err?.message };
    }
  }

  return NextResponse.json({
    env: {
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      serviceRoleKeyPrefix: serviceRoleKey ? serviceRoleKey.substring(0, 12) + "..." : null,
      hasSecretKey: !!secretKey,
      secretKeyLength: secretKey?.length || 0,
      hasAnonKey: !!anonKey,
      nodeEnv: process.env.NODE_ENV,
    },
    adminClientDbResult,
    adminClientStorageResult,
    anonClientDbResult,
    probeDeleteResult,
  });
}

export async function POST(request: Request) {
  try {
    const { id, mediaUrl } = await request.json();
    const { deleteGalleryMediaAction } = await import("@/lib/actions/gallery");
    const result = await deleteGalleryMediaAction(id, mediaUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
