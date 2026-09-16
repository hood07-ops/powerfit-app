export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const body = req.body || {};
  const filename = String(body.filename || "CPS_Tomo_Estudio.txt")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
  const content = String(body.content || "");

  if (!content) {
    return res.status(400).json({ error: "EMPTY_CONTENT" });
  }

  const payload = Buffer.from(content, "utf8");
  const encodedFilename = encodeURIComponent(filename);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(payload.length));
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
  );
  res.setHeader("Content-Transfer-Encoding", "binary");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.end(payload);
}
