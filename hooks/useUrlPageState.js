import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const normalizePage = (value) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue, 10);

  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getInitialPage = (paramName) => {
  if (typeof window === "undefined") {
    return 1;
  }

  return normalizePage(new URLSearchParams(window.location.search).get(paramName));
};

const useUrlPageState = (paramName = "page") => {
  const router = useRouter();
  const routerRef = useRef(router);
  const [currentPage, setCurrentPageState] = useState(() =>
    getInitialPage(paramName)
  );

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const syncPageToUrl = useCallback(
    (page) => {
      const nextRouter = routerRef.current;

      if (!nextRouter.isReady) return;

      const query = { ...nextRouter.query };

      if (page <= 1) {
        delete query[paramName];
      } else {
        query[paramName] = String(page);
      }

      nextRouter.replace(
        {
          pathname: nextRouter.pathname,
          query,
        },
        undefined,
        { shallow: true, scroll: false }
      );
    },
    [paramName]
  );

  const setCurrentPage = useCallback(
    (value) => {
      setCurrentPageState((previousPage) => {
        const nextPage = normalizePage(
          typeof value === "function" ? value(previousPage) : value
        );

        if (nextPage !== previousPage) {
          syncPageToUrl(nextPage);
        }

        return nextPage;
      });
    },
    [syncPageToUrl]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const pageFromUrl = normalizePage(router.query[paramName]);
    setCurrentPageState((previousPage) =>
      previousPage === pageFromUrl ? previousPage : pageFromUrl
    );
  }, [paramName, router.isReady, router.query]);

  return [currentPage, setCurrentPage];
};

export default useUrlPageState;
