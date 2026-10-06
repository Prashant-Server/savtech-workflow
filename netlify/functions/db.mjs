import { getStore } from "@netlify/blobs";

// Shared database for Savtech Field Ops, stored in Netlify Blobs.
// GET  /api/db          -> { version, data }
// GET  /api/db?v=N      -> { unchanged:true } if nothing changed since version N
// PUT  /api/db          body { baseVersion, data } -> { version }  (409 + latest data on conflict)
export default async (req) => {
  const store = getStore({ name: "savtech-fieldops", consistency: "strong" });
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

  try {
    const meta = (await store.get("meta", { type: "json" })) || { version: 0 };

    if (req.method === "GET") {
      const v = new URL(req.url).searchParams.get("v");
      if (v !== null && Number(v) === meta.version && meta.version > 0) return json({ unchanged: true, version: meta.version });
      const data = await store.get("db", { type: "json" });
      return json({ version: meta.version, data: data || null });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      if (!body || typeof body.data !== "object") return json({ error: "Missing data" }, 400);
      if (meta.version > 0 && Number(body.baseVersion) !== meta.version) {
        const data = await store.get("db", { type: "json" });
        return json({ error: "conflict", version: meta.version, data }, 409);
      }
      const version = meta.version + 1;
      await store.setJSON("db", body.data);
      await store.setJSON("meta", { version, savedAt: new Date().toISOString() });
      return json({ version });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
};

export const config = { path: "/api/db" };
