import { useEffect, useRef, useState } from "react";

type QueryState<T> = {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: string;
};

export function useQuery<T>(key: string, load: () => Promise<T>) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ status: "loading", data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, error: "" });
    loadRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: "" });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: err instanceof Error ? err.message : "Something went wrong.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  return {
    ...state,
    retry: () => setNonce((value) => value + 1),
  };
}
