import { logoutAction } from "../login/actions";

export default function LogoutPage() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form action={logoutAction}>
        <h1>Logout</h1>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
