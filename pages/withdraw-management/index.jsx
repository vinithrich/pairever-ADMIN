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
  Button,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { sortRows } from "@/helper/tableSort";

import Notiflix from "notiflix";
import {  GetWithdrawhistoryApi, } from "@/helper/Redux/ReduxThunk/Homepage";

const formatCurrency = (amount) => {
  const numericAmount = Number(amount || 0);

  return numericAmount.toLocaleString("en-IN");
};

const formatFee = (withdraw) => {
  const feeAmount = Number(withdraw?.withdrawalFee ?? 0);
  const feeValue = withdraw?.withdrawalFeeValue;
  const feeUnit = withdraw?.withdrawalFeeUnit;

  if (!feeAmount && !feeValue) {
    return "-";
  }

  const feeMeta =
    feeValue !== undefined && feeValue !== null && feeValue !== ""
      ? ` (${feeValue}${feeUnit === "percent" ? "%" : feeUnit ? ` ${feeUnit}` : ""})`
      : "";

  return `${formatCurrency(feeAmount)}${feeMeta}`;
};

const getStatusLabel = (status) => {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (normalizedStatus === "0" || normalizedStatus === "pending") {
    return { label: "Pending", variant: "warning text-dark" };
  }

  if (normalizedStatus === "1" || normalizedStatus === "approved" || normalizedStatus === "paid") {
    return { label: normalizedStatus === "paid" ? "Paid" : "Approved", variant: "success" };
  }

  if (normalizedStatus === "2" || normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "danger" };
  }

  return { label: status || "-", variant: "secondary" };
};

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reportType, setReportType] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [counts, setCounts] = useState(null);
  const [summary, setSummary] = useState(null);
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

    if (statusFilter) {
      queryParams.status = statusFilter;
    }

    if (reportType) {
      queryParams.reportType = reportType;
    }

    if (reportType === "daily" && dateFilter) {
      queryParams.date = dateFilter;
    }

    if (reportType === "monthly" && monthFilter) {
      queryParams.month = monthFilter;
    }

    if (fromDateFilter) {
      queryParams.fromDate = fromDateFilter;
    }

    if (toDateFilter) {
      queryParams.toDate = toDateFilter;
    }

    await dispatch(
      GetWithdrawhistoryApi(queryParams, (resp) => {
        if (resp?.status) {
          setUserList(resp.data || []);
          setTotalPages(resp.pagination?.totalPages || 1);
          setCounts(resp.counts || null);
          setSummary(resp.summary || null);
        } else {
          setUserList([]);
          setTotalPages(1);
          setCounts(null);
          setSummary(null);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch users");
        }
      })
    );
  }, [
    currentPage,
    dateFilter,
    dispatch,
    fromDateFilter,
    leadsPerPage,
    monthFilter,
    reportType,
    searchQuery,
    statusFilter,
    toDateFilter,
  ]);

  useEffect(() => {
    getStaffDetails();
  }, [getStaffDetails]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const handleReportTypeChange = (event) => {
    const nextReportType = event.target.value;

    setReportType(nextReportType);
    setDateFilter("");
    setMonthFilter("");
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setReportType("");
    setDateFilter("");
    setMonthFilter("");
    setFromDateFilter("");
    setToDateFilter("");
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
      requestedAmount: (user) => user.requestedAmount ?? user.amount ?? 0,
      withdrawalFee: (user) => user.withdrawalFee ?? 0,
      finalAmount: (user) => user.finalAmount ?? user.amount ?? 0,
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

  const summaryItems = useMemo(() => {
    const source = {
      ...(counts || {}),
      ...(summary || {}),
    };

    if (!counts && !summary) return [];

    return [
      ["Total", source.totalCount ?? source.totalWithdraws ?? source.total],
      ["Paid", source.paidCount ?? source.paidWithdraws ?? source.paid],
      ["Pending", source.pendingCount ?? source.pendingWithdraws ?? source.pending],
      ["Rejected", source.rejectedCount ?? source.rejectedWithdraws ?? source.rejected],
      ["Total Amount", source.totalAmount],
      ["Paid Amount", source.paidAmount],
      ["Pending Amount", source.pendingAmount],
      ["Rejected Amount", source.rejectedAmount],
    ].filter(([, value]) => value !== undefined && value !== null);
  }, [counts, summary]);

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
        <Form className="w-100">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4} lg={3}>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search name, phone, UPI, bank..."
              value={searchQuery}
              onChange={handleSearch}
            />
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Label className="text-white fw-bold">Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="0">Status 0</option>
                <option value="1">Status 1</option>
                <option value="2">Status 2</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Label className="text-white fw-bold">Report</Form.Label>
              <Form.Select value={reportType} onChange={handleReportTypeChange}>
                <option value="">All</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </Form.Select>
            </Col>

            {reportType === "daily" ? (
              <Col xs={12} sm={6} md={3} lg={2}>
                <Form.Label className="text-white fw-bold">Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFilter}
                  onChange={handleFilterChange(setDateFilter)}
                />
              </Col>
            ) : null}

            {reportType === "monthly" ? (
              <Col xs={12} sm={6} md={3} lg={2}>
                <Form.Label className="text-white fw-bold">Month</Form.Label>
                <Form.Control
                  type="month"
                  value={monthFilter}
                  onChange={handleFilterChange(setMonthFilter)}
                />
              </Col>
            ) : null}

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Label className="text-white fw-bold">From Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDateFilter}
                onChange={handleFilterChange(setFromDateFilter)}
              />
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Label className="text-white fw-bold">To Date</Form.Label>
              <Form.Control
                type="date"
                value={toDateFilter}
                min={fromDateFilter || undefined}
                onChange={handleFilterChange(setToDateFilter)}
              />
            </Col>

            <Col xs={12} md="auto">
              <Button type="button" variant="outline-light" onClick={clearFilters}>
                Clear
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      {summaryItems.length > 0 ? (
        <Row className="mt-4">
          {summaryItems.map(([label, value]) => (
            <Col md={4} xl={2} className="mt-3" key={label}>
              <div className="rounded border border-secondary p-3 h-100">
                <div className="text-white-50 small">{label}</div>
                <div className="text-white fw-bold mt-1">
                  {label.includes("Amount") ? formatCurrency(value) : value}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      ) : null}


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
                  <th><SortableHeader label="Requested" sortKey="requestedAmount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Fee" sortKey="withdrawalFee" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Final Amount" sortKey="finalAmount" sortConfig={sortConfig} onSort={handleSort} /></th>
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
                      <td>{formatCurrency(user.requestedAmount ?? user.amount)}</td>
                      <td>{formatFee(user)}</td>
                      <td>{formatCurrency(user.finalAmount ?? user.amount)}</td>
                      {/* <td>{user.role || "-"}</td> */}
                      <td>
                        {(() => {
                          const status = getStatusLabel(user.status);

                          return (
                            <span className={`badge bg-${status.variant}`}>
                              {status.label}
                            </span>
                          );
                        })()}
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
                    <td colSpan="11" className="text-center">
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
