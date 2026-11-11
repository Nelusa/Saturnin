import { useBeforeUnload, useBlocker } from "@remix-run/react";
import { useCallback, useEffect } from "react";

/** Warn both for router navigation and closing/reloading the browser. */
export function useUnsavedChanges(dirty: boolean) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("Máte neuložené změny. Opravdu chcete odejít?")) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useBeforeUnload(useCallback((event: BeforeUnloadEvent) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  }, [dirty]));
}
