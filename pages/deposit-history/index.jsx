import { PageHeading } from "@/widgets";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Col,
  Row,
  Container,
  Form,
  Card,
  Table,
  ButtonGroup,
  Button,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";

import Notiflix from "notiflix";
import { GetdepositHistoryApi } from "@/helper/Redux/ReduxThunk/Homepage";

const getDepositStatus = (status) =>
  String(status || "").toLowerCase() === "paid" ? "Paid" : "Pending";

const formatDateTime = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getUserDetailId = (user) =>
  user?.userId?._id ||
  user?.userId ||
  user?.user?._id ||
  user?.customerId?._id ||
  user?.customerId ||
  user?.createdBy?._id ||
  user?.createdBy ||
  "";

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();


  const getUserDetails = useCallback(async () => {
    const queryParams = {
      search: searchQuery,
      page: currentPage,
      limit: leadsPerPage,
    };

    if (statusFilter) {
      queryParams.paymentStatus = statusFilter;
    }

    await dispatch(
      GetdepositHistoryApi(queryParams, (resp) => {
        if (resp?.status) {
          setUserList(resp.data || []);
          setTotalPages(resp.pagination?.totalPages || 1);
        } else {
          setUserList([]);
          setTotalPages(1);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch users");
        }
      })
    );
  }, [currentPage, dispatch, leadsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    getUserDetails();
  }, [getUserDetails]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const paginate = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedUsers = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => (currentPage - 1) * leadsPerPage + index + 1,
      userName: (user) => user.userName || "",
      userPhone: (user) => user.userPhone || "",
      memberID: (user) => user.memberID || "",
      totalAmount: (user) => user.totalAmount ?? 0,
      paymentStatus: (user) => getDepositStatus(user.paymentStatus),
      createdAt: (user) => user.createdAt || "",
    };

    return sortRows(
      userList.map((user, index) => ({ ...user, __index: index })),
      {
        ...sortConfig,
        getValue: (user) =>
          getValue[sortConfig.key]?.(user, user.__index) ?? "",
      }
    );
  }, [currentPage, leadsPerPage, sortConfig, userList]);

  return (
    <Container fluid className="p-6">

      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
        ></i>
        <PageHeading heading="Deposit History" />
      </div>


      <div className="d-flex justify-content-between w-100">
        <Form className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search Name / Phone /"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Filter</Form.Label>
            <ButtonGroup className="d-flex">
              <Button
                type="button"
                variant={statusFilter === "" ? "primary" : "outline-primary"}
                onClick={() => handleStatusFilter("")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={statusFilter === "paid" ? "primary" : "outline-primary"}
                onClick={() => handleStatusFilter("paid")}
              >
                Paid
              </Button>
              <Button
                type="button"
                variant={statusFilter === "pending" ? "primary" : "outline-primary"}
                onClick={() => handleStatusFilter("pending")}
              >
                Pending
              </Button>
            </ButtonGroup>
          </div>
        </Form>
      </div>


      <Row className="mt-6">
        <Col md={12}>
          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th><SortableHeader label="S.No" sortKey="serialNumber" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Name" sortKey="userName" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Phone" sortKey="userPhone" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="memberID" sortKey="memberID" sortConfig={sortConfig} onSort={handleSort} /></th>
                  {/* <th>DOB</th> */}
                  {/* <th>Language</th> */}
                  <th><SortableHeader label="Coins" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  {/* <th>Role</th> */}
                  <th><SortableHeader label="Status" sortKey="paymentStatus" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Created At" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user, i) => (
                    <tr key={user._id}>
                      <td>
                        {(currentPage - 1) * leadsPerPage + i + 1}
                      </td>
                      <td>
                        {user.userName && getUserDetailId(user) ? (
                          <Link
                            href={`/user-management/${getUserDetailId(user)}`}
                            className="text-decoration-none fw-semibold"
                          >
                            {user.userName}
                          </Link>
                        ) : (
                          user.userName || "-"
                        )}
                      </td>
                      <td>{user.userPhone || "-"}</td>
                      <td>{user.memberID || "-"}</td>
                      {/* <td>{user.DOB || "-"}</td> */}
                      {/* <td>{user.Language || "-"}</td> */}
                      <td>{user.totalAmount ?? 0} {user.currency}</td>
                      {/* <td>{user.role || "-"}</td> */}
                      <td>
                        {getDepositStatus(user.paymentStatus) === "Paid" ? (
                          <span className="badge bg-success">Paid</span>
                        ) : (
                          <span className="badge bg-secondary">Pending</span>
                        )}
                      </td>
                      <td>
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => router.push(`/deposit-history/${user._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No Users Found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
            />
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ManageInvoice;
