// Cloudflare Pages Function — replaces Netlify Functions + Blobs
// KV binding name: SAVTECH_DB  (set in Cloudflare dashboard)
// GET  /api/db          -> { version, data }
// GET  /api/db?v=N      -> { unchanged:true } if nothing changed since version N
// PUT  /api/db          body { baseVersion, data } -> { version }  (409 + latest data on conflict)

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function onRequest(context) {
  const { request, env } = context;
  const KV = env.SAVTECH_DB;

  if (!KV) return json({ error: "KV binding SAVTECH_DB not configured" }, 500);

  try {
    const metaRaw = await KV.get("meta", { type: "json" });
    const meta = metaRaw || { version: 0 };

    if (request.method === "GET") {
      const url = new URL(request.url);
      const v = url.searchParams.get("v");
      if (v !== null && Number(v) === meta.version && meta.version > 0) {
        return json({ unchanged: true, version: meta.version });
      }
      const data = await KV.get("db", { type: "json" });
      return json({ version: meta.version, data: data || null });
    }

    if (request.method === "PUT") {
      const body = await request.json();
      if (!body || typeof body.data !== "object") {
        return json({ error: "Missing data" }, 400);
      }
      if (meta.version > 0 && Number(body.baseVersion) !== meta.version) {
        const data = await KV.get("db", { type: "json" });
        return json({ error: "conflict", version: meta.version, data }, 409);
      }
      const version = meta.version + 1;
      await KV.put("db", JSON.stringify(body.data));
      await KV.put("meta", JSON.stringify({ version, savedAt: new Date().toISOString() }));
      return json({ version });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
