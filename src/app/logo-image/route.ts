import { getSetting } from "@/lib/settings";

/**
 * Serves the admin-uploaded logo stored in the settings table.
 *
 * The upload used to be written under `public/uploads`, which does not survive
 * a redeploy on serverless hosts — the image is now kept in the database and
 * served from here so the logo stays exactly as uploaded, deploy after deploy.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const data = await getSetting("logo_data");
  if (!data) return new Response(null, { status: 404 });

  const mime = (await getSetting("logo_data_mime", "")) || "image/png";
  let body: ArrayBuffer;
  try {
    const bytes = Buffer.from(data, "base64");
    body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(body, {
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=3600",
    },
  });
}
