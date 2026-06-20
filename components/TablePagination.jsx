import Pagination from "react-bootstrap/Pagination";

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) {
    pages.push("start-ellipsis");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) {
    pages.push("end-ellipsis");
  }

  pages.push(totalPages);

  return pages;
};

const TablePagination = ({ currentPage, totalPages, onPageChange }) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(
    safeTotalPages,
    Math.max(1, Number(currentPage) || 1)
  );

  if (safeTotalPages <= 1) {
    return null;
  }

  const handleClick = (event, page) => {
    event.preventDefault();

    if (page < 1 || page > safeTotalPages || page === safeCurrentPage) {
      return;
    }

    onPageChange(page);
  };

  const items = getPaginationItems(safeCurrentPage, safeTotalPages);

  return (
    <div className="table-pagination d-flex justify-content-center mt-3 px-3 pb-3 overflow-auto">
      <Pagination className="mb-0 flex-nowrap align-items-center">
        <Pagination.Prev
          disabled={safeCurrentPage === 1}
          onClick={(event) => handleClick(event, safeCurrentPage - 1)}
        />

        {items.map((item) => {
          if (typeof item !== "number") {
            return <Pagination.Ellipsis key={item} disabled />;
          }

          return (
            <Pagination.Item
              key={item}
              active={safeCurrentPage === item}
              onClick={(event) => handleClick(event, item)}
            >
              {item}
            </Pagination.Item>
          );
        })}

        <Pagination.Next
          disabled={safeCurrentPage === safeTotalPages}
          onClick={(event) => handleClick(event, safeCurrentPage + 1)}
        />
      </Pagination>
    </div>
  );
};

export default TablePagination;
