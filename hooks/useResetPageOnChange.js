import { useRef } from "react";

/**
 * Sends pagination back to page 1 when a search or filter value actually CHANGES.
 *
 * Why this exists: the debounce effects that own search/filter state also run on
 * mount. Calling setCurrentPage(1) inside them unconditionally threw away the
 * page restored from the URL — coming back from a detail page landed on page 3
 * and then jumped to page 1 a moment later, which read as "back always goes to
 * page 1".
 *
 * Call the returned function inside the effect with the current value. It resets
 * only when that value differs from the last one it saw, so the mount run is a
 * no-op while a real edit — including clearing a search — still resets.
 */
const useResetPageOnChange = (setCurrentPage, initialValue) => {
  const lastValue = useRef(initialValue);

  return (value) => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    setCurrentPage(1);
  };
};

export default useResetPageOnChange;
