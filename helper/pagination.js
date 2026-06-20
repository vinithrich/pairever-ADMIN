const getNestedValue = (source, paths, fallback = undefined) => {
  for (const path of paths) {
    const value = path
      .split(".")
      .reduce((current, key) => current?.[key], source);

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
};

export const getTotalPagesFromResponse = (response, limit = 10) => {
  const totalPages = getNestedValue(response, [
    "pagination.totalPages",
    "pagination.pages",
    "pagination.totalPage",
    "pagination.lastPage",
    "data.pagination.totalPages",
    "data.pagination.pages",
    "data.meta.totalPages",
    "data.meta.pages",
    "meta.totalPages",
    "meta.pages",
    "totalPages",
    "pages",
  ]);

  if (Number(totalPages) > 0) {
    return Number(totalPages);
  }

  const totalRecords = getNestedValue(response, [
    "pagination.total",
    "pagination.totalRecords",
    "data.pagination.total",
    "data.pagination.totalRecords",
    "data.meta.total",
    "data.meta.totalRecords",
    "meta.total",
    "meta.totalRecords",
    "total",
    "totalRecords",
  ]);

  return Math.max(1, Math.ceil((Number(totalRecords) || 0) / limit));
};

export const getListFromResponse = (response) => {
  const list = getNestedValue(response, [
    "data.docs",
    "data.items",
    "data.results",
    "data.list",
    "data.records",
    "docs",
    "items",
    "results",
    "list",
    "records",
  ]);

  if (Array.isArray(list)) {
    return list;
  }

  return Array.isArray(response?.data) ? response.data : [];
};
