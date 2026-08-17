import { createContext, useContext } from "react";

export const OpenLogContext = createContext(() => {});

export function useOpenLog() {
  return useContext(OpenLogContext);
}
