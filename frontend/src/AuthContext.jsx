import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const save = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };
  const update = (u) => { localStorage.setItem("user", JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, save, update, logout }}>{children}</Ctx.Provider>;
}
