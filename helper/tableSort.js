export const compareValues = (leftValue, rightValue) => {
  const left = leftValue ?? "";
  const right = rightValue ?? "";

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftIsNumber =
    left !== "" && left !== null && left !== undefined && !Number.isNaN(leftNumber);
  const rightIsNumber =
    right !== "" && right !== null && right !== undefined && !Number.isNaN(rightNumber);

  if (leftIsNumber && rightIsNumber) {
    return leftNumber - rightNumber;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);
  const leftIsDate = !Number.isNaN(leftDate);
  const rightIsDate = !Number.isNaN(rightDate);

  if (leftIsDate && rightIsDate) {
    return leftDate - rightDate;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

export const sortRows = (rows, config) => {
  if (!config?.key) return rows;

  const sortedRows = [...rows].sort((leftRow, rightRow) => {
    const result = compareValues(
      config.getValue(leftRow),
      config.getValue(rightRow)
    );

    return config.direction === "asc" ? result : -result;
  });

  return sortedRows;
};
