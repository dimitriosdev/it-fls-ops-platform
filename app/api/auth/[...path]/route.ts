import { auth } from "@/src/lib/auth/server";
import { isAllowedEmailDomain } from "@/src/lib/auth/email-domain";

const handlers = auth.handler();

export const { GET, PUT, PATCH, DELETE } = handlers;

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  if (path.join("/") !== "sign-up/email") {
    return handlers.POST(request, context);
  }

  let payload: unknown;
  try {
    payload = await request.clone().json();
  } catch {
    return Response.json({ message: "Invalid registration request." }, { status: 400 });
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "email" in payload &&
    typeof payload.email === "string" &&
    !isAllowedEmailDomain(payload.email)
  ) {
    return Response.json(
      { message: "Only @digitecgalaxus.ch email addresses are allowed." },
      { status: 403 },
    );
  }

  return handlers.POST(request, context);
}
