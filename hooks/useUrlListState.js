import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

/**
 * Keeps a list page's whole view — page number, search and every filter — in the
 * URL, so it survives opening a row and pressing Back.
 *
 * Why one hook for all of it rather than one per value: each write does a
 * router.replace built from router.query as of the last render. Two separate
 * syncs firing in the same tick (changing a filter also resets the page) would
 * each start from that same stale query, and whichever wrote last would silently
 * drop the other's change. Owning every key here means one replace per update.
 *
 * Only values that differ from their default are put in the URL, so a clean view
 * has a clean address bar.
 */

const coerce = (raw, fallback) => {
  if (raw === undefined || raw === null) return fallback;
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof fallback === "number") {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
  if (typeof fallback === "boolean") return String(value) === "true";
  return String(value);
};

const readFrom = (defaults, get) => {
  const next = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    next[key] = coerce(get(key), fallback);
  }
  return next;
};

const useUrlListState = (defaults) => {
  const router = useRouter();
  const routerRef = useRef(router);
  // Frozen on first render: the defaults define which keys this hook owns, and
  // a caller passing a fresh object literal each render must not change that.
  const defaultsRef = useRef(defaults);

  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { ...defaults };
    const params = new URLSearchParams(window.location.search);
    return readFrom(defaults, (key) => params.get(key));
  });

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const writeToUrl = useCallback((next) => {
    const activeRouter = routerRef.current;
    if (!activeRouter.isReady) return;

    const query = { ...activeRouter.query };
    for (const [key, fallback] of Object.entries(defaultsRef.current)) {
      const value = next[key];
      if (value === fallback || value === "" || value === undefined || value === null) {
        delete query[key];
      } else {
        query[key] = String(value);
      }
    }

    activeRouter.replace(
      { pathname: activeRouter.pathname, query },
      undefined,
      { shallow: true, scroll: false }
    );
  }, []);

  // Accepts a partial patch — setState({ city: "Chennai", page: 1 }) — or a
  // function of the previous state.
  const update = useCallback(
    (patch) => {
      setState((previous) => {
        const next = {
          ...previous,
          ...(typeof patch === "function" ? patch(previous) : patch),
        };
        const changed = Object.keys(next).some((key) => next[key] !== previous[key]);
        if (!changed) return previous;
        writeToUrl(next);
        return next;
      });
    },
    [writeToUrl]
  );

  // Browser back/forward moves the URL without remounting: adopt what it says.
  useEffect(() => {
    if (!router.isReady) return;
    setState((previous) => {
      const fromUrl = readFrom(defaultsRef.current, (key) => router.query[key]);
      const changed = Object.keys(fromUrl).some((key) => fromUrl[key] !== previous[key]);
      return changed ? fromUrl : previous;
    });
  }, [router.isReady, router.query]);

  return [state, update];
};

export default useUrlListState;
