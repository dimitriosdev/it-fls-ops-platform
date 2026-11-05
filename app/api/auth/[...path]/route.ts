import { auth } from "@/src/lib/auth/server";

export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
