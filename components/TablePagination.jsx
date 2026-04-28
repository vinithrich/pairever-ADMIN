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
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(currentPage, totalPages);

  return (
    <div className="table-pagination d-flex justify-content-center mt-3 px-3 pb-3 overflow-auto">
      <Pagination className="mb-0 flex-nowrap align-items-center">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {items.map((item) => {
          if (typeof item !== "number") {
            return <Pagination.Ellipsis key={item} disabled />;
          }

          return (
            <Pagination.Item
              key={item}
              active={currentPage === item}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Pagination.Item>
          );
        })}

        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </Pagination>
    </div>
  );
};

export default TablePagination;
