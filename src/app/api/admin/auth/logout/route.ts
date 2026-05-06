// POST /api/admin/auth/logout
export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set(
    "Set-Cookie",
    "lw_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
  return response;
}
