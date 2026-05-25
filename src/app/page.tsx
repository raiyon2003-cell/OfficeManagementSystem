import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAMES } from "@/lib/constants";

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  redirect("/login");
}
