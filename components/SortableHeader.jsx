import React from "react";

const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig?.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;
  const indicator = direction === "asc" ? "^" : direction === "desc" ? "v" : "-";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        color: "inherit",
        font: "inherit",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: "11px", opacity: isActive ? 1 : 0.45 }}>
        {indicator}
      </span>
    </button>
  );
};

export default SortableHeader;
