import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Col,
  Row,
  Container,
  Form,
  Card,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";

import Notiflix from "notiflix";
import {  GetWithdrawhistoryApi, } from "@/helper/Redux/ReduxThunk/Homepage";

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();


  const getStaffDetails = useCallback(async () => {
    const queryParams = {
      search: searchQuery,
      page: currentPage,
      limit: leadsPerPage,
    };

    await dispatch(
      GetWithdrawhistoryApi(queryParams, (resp) => {
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
  }, [currentPage, dispatch, leadsPerPage, searchQuery]);

  useEffect(() => {
    getStaffDetails();
  }, [getStaffDetails]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
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
      memberID: (user) => user.memberID || "",
      name: (user) => user.name || "",
      phone: (user) => user.phone || "",
      amount: (user) => user.amount ?? 0,
      verified: (user) => user.status || "",
      status: (user) => (user.isLogin ? "Online" : "Offline"),
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
        <PageHeading heading="Withdraw Management" />
      </div>


      <div className="d-flex justify-content-between w-100">
        <Form className="d-flex gap-3">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search Name / Phone / Gender / Language"
              value={searchQuery}
              onChange={handleSearch}
            />
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
                  <th><SortableHeader label="memberID" sortKey="memberID" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={handleSort} /></th>
                  {/* <th>DOB</th> */}
                  <th><SortableHeader label="Amount" sortKey="amount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  {/* <th>Role</th> */}
                  <th><SortableHeader label="is Verified" sortKey="verified" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
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
                      <td>{user.memberID || "-"}</td>
                      <td>{user.name || "-"}</td>
                      <td>{user.phone || "-"}</td>
                      {/* <td>{user.dob || "-"}</td> */}
                      <td>{user.amount ?? 0}</td>
                      {/* <td>{user.role || "-"}</td> */}
                      <td>
                        {user.status === "0" && (
                          <span className="badge bg-warning text-dark">Pending</span>
                        )}
                        {user.status === "1" && (
                          <span className="badge bg-success">Approved</span>
                        )}
                        {user.status === "2" && (
                          <span className="badge bg-danger">Rejected</span>
                        )}
                        {!["0", "1", "2"].includes(user.status) && "-"}
                      </td>
                      <td>
                        {user.isLogin ? (
                          <span className="badge bg-success">Online</span>
                        ) : (
                          <span className="badge bg-secondary">Offline</span>
                        )}
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => router.push(`/withdraw-management/${user._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
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
