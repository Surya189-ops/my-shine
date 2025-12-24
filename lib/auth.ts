export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;

  const user = localStorage.getItem("myshine_user");
  if (!user) return false;

  try {
    const parsed = JSON.parse(user);
    return parsed.loggedIn === true;
  } catch {
    return false;
  }
}
