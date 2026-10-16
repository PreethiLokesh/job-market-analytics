import { createContext, useCallback, useContext, useState } from "react";
import Icon from "./Icon.jsx";

const Ctx = createContext(() => {});
/** const toast = useToast();  toast("Saved"); toast("Failed", "error"); */
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={"toast " + t.type}>
            <Icon name={t.type === "error" ? "alert" : "check"} size={16} />{t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
