export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/db-check") {
      const headers = { "Cache-Control": "no-store" };

      if (request.method !== "GET") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { ...headers, Allow: "GET" }
        });
      }

      if (!env.DB) {
        return Response.json(
          { ok: false, message: "DB binding is missing" },
          { status: 503, headers }
        );
      }

      try {
        const result = await env.DB
          .prepare("SELECT 1 AS connected")
          .first();

        if (result?.connected !== 1) {
          throw new Error("Unexpected database response");
        }

        return Response.json(
          { ok: true, message: "Database connected" },
          { headers }
        );
      } catch (error) {
        console.error("Database check failed:", error);

        return Response.json(
          { ok: false, message: "Database query failed" },
          { status: 503, headers }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
