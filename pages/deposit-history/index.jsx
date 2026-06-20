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
  Badge,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { sortRows } from "@/helper/tableSort";
import * as XLSX from "xlsx";

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

const formatCurrency = (amount, currency = "INR") => {
  const numericAmount = Number(amount || 0);

  return `${numericAmount.toLocaleString("en-IN")} ${currency || "INR"}`;
};

const compactLabel = (value) => String(value || "-").replace(/_/g, " ");

const formatHourRange = (hour) => {
  const numericHour = Number(hour);

  if (!Number.isInteger(numericHour) || numericHour < 0 || numericHour > 23) {
    return "";
  }

  const start = `${String(numericHour).padStart(2, "0")}:00`;
  const end = `${String(numericHour).padStart(2, "0")}:59`;

  return `${start} - ${end}`;
};

const getBreakdownLabel = (item, primaryKey, index) => {
  const id = item?._id;

  if (primaryKey === "time") {
    if (item?.startTime && item?.endTime) {
      return `${item.startTime} - ${item.endTime}`;
    }

    const hourLabel = formatHourRange(item?.hour ?? id?.hour);
    if (hourLabel) return hourLabel;
  }

  const label =
    item?.[primaryKey] ||
    item?.label ||
    item?.date ||
    item?.month ||
    item?.day ||
    item?.time ||
    item?.slot ||
    item?.period ||
    item?.range ||
    item?.startTime ||
    (typeof id === "object"
      ? id?.[primaryKey] || id?.date || id?.month || id?.day || id?.time
      : id);

  return label || `Group ${index + 1}`;
};

const hasRealBreakdownLabel = (item, primaryKey) => {
  const label = getBreakdownLabel(item, primaryKey, 0);

  return Boolean(label) && !String(label).startsWith("Group ");
};

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");
  const [serverSortBy, setServerSortBy] = useState("");
  const [serverOrder, setServerOrder] = useState("desc");
  const [summary, setSummary] = useState(null);
  const [dayWiseDeposits, setDayWiseDeposits] = useState([]);
  const [monthWiseDeposits, setMonthWiseDeposits] = useState([]);
  const [timeWiseDeposits, setTimeWiseDeposits] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();


  const buildDepositQuery = useCallback((page, limit) => {
    const queryParams = {
      search: searchQuery,
      page,
      limit,
    };

    if (statusFilter) {
      queryParams.paymentStatus = statusFilter;
    }

    if (languageFilter) {
      queryParams.language = languageFilter;
    }

    if (dayFilter) {
      queryParams.day = dayFilter;
    }

    if (monthFilter) {
      queryParams.month = monthFilter;
    }

    if (fromDateFilter) {
      queryParams.fromDate = fromDateFilter;
    }

    if (toDateFilter) {
      queryParams.toDate = toDateFilter;
    }

    if (startTimeFilter) {
      queryParams.startTime = startTimeFilter;
    }

    if (endTimeFilter) {
      queryParams.endTime = endTimeFilter;
    }

    if (serverSortBy) {
      queryParams.sortBy = serverSortBy;
      queryParams.order = serverOrder;
    }

    return queryParams;
  }, [
    dayFilter,
    endTimeFilter,
    fromDateFilter,
    languageFilter,
    monthFilter,
    searchQuery,
    serverOrder,
    serverSortBy,
    startTimeFilter,
    statusFilter,
    toDateFilter,
  ]);

  const getUserDetails = useCallback(async () => {
    const queryParams = buildDepositQuery(currentPage, leadsPerPage);

    await dispatch(
      GetdepositHistoryApi(queryParams, (resp) => {
        if (resp?.status) {
          setUserList(resp.data || []);
          setTotalPages(resp.pagination?.totalPages || 1);
          setSummary(resp.summary || null);
          setDayWiseDeposits(resp.dayWiseDeposits || []);
          setMonthWiseDeposits(resp.monthWiseDeposits || []);
          setTimeWiseDeposits(resp.timeWiseDeposits || []);
        } else {
          setUserList([]);
          setTotalPages(1);
          setSummary(null);
          setDayWiseDeposits([]);
          setMonthWiseDeposits([]);
          setTimeWiseDeposits([]);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch users");
        }
      })
    );
  }, [buildDepositQuery, currentPage, dispatch, leadsPerPage]);

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

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const handleServerSortChange = (event) => {
    setServerSortBy(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setLanguageFilter("");
    setDayFilter("");
    setMonthFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setStartTimeFilter("");
    setEndTimeFilter("");
    setServerSortBy("");
    setServerOrder("desc");
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

  const handleDownloadExcel = async () => {
    setIsExporting(true);

    try {
      const exportLimit = 500;
      let page = 1;
      let totalPagesForExport = 1;
      const records = [];

      do {
        const response = await new Promise((resolve) => {
          dispatch(
            GetdepositHistoryApi(buildDepositQuery(page, exportLimit), resolve)
          );
        });

        if (!response?.status) {
          throw new Error(response?.message || "Unable to download deposit records");
        }

        records.push(...(response.data || []));
        totalPagesForExport = Math.max(1, Number(response.pagination?.totalPages) || 1);
        page += 1;
      } while (page <= totalPagesForExport);

      if (!records.length) {
        Notiflix.Notify.info("No deposit records found for the selected filters");
        return;
      }

      const rows = records.map((deposit, index) => {
        const depositAmount = Number(deposit.totalAmount ?? deposit.amount ?? 0);
        const platformFee = 10;
        const gst = Number((depositAmount * 0.18).toFixed(2));

        return {
          "S.No": index + 1,
          Name: deposit.userName || "-",
          Phone: deposit.userPhone || "-",
          "Member ID": deposit.memberID || "-",
          Language: deposit.Language || deposit.language || "-",
          "Deposit Amount": depositAmount,
          "Platform Fee": platformFee,
          "GST (18%)": gst,
          "Net Amount": Number((depositAmount - platformFee - gst).toFixed(2)),
          Currency: deposit.currency || "INR",
          Status: getDepositStatus(deposit.paymentStatus),
          "Created At": formatDateTime(deposit.createdAt),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Deposit Report");
      XLSX.writeFile(workbook, `deposit-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      Notiflix.Notify.success("Deposit Excel report downloaded");
    } catch (error) {
      Notiflix.Notify.failure(error?.message || "Failed to download deposit report");
    } finally {
      setIsExporting(false);
    }
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

  const summaryItems = useMemo(() => {
    if (!summary) return [];

    return [
      ["Total Deposits", summary.totalDeposits ?? summary.totalCount],
      ["Paid Deposits", summary.paidDeposits ?? summary.paidCount],
      ["Pending Deposits", summary.pendingDeposits ?? summary.pendingCount],
      [
        "Total Amount",
        summary.totalAmount !== undefined
          ? formatCurrency(summary.totalAmount, summary.currency)
          : undefined,
      ],
      [
        "Paid Amount",
        summary.paidAmount !== undefined
          ? formatCurrency(summary.paidAmount, summary.currency)
          : undefined,
      ],
      [
        "Pending Amount",
        summary.pendingAmount !== undefined
          ? formatCurrency(summary.pendingAmount, summary.currency)
          : undefined,
      ],
    ].filter(([, value]) => value !== undefined && value !== null);
  }, [summary]);

  const renderDepositBreakdown = (title, items, primaryKey) => {
    const visibleItems =
      primaryKey === "time"
        ? items?.filter((item) => hasRealBreakdownLabel(item, primaryKey))
        : items;

    if (!visibleItems?.length) return null;

    return (
      <Col lg={4} className="mt-3">
        <div className="deposit-breakdown h-100 rounded border border-secondary p-3">
          <h5 className="text-white mb-3">{title}</h5>
          <div className="d-flex flex-column gap-2">
            {visibleItems.slice(0, 6).map((item, index) => {
              const label = getBreakdownLabel(item, primaryKey, index);
              const amount = item.totalAmount ?? item.amount ?? item.total ?? 0;
              const count = item.count ?? item.deposits ?? item.totalDeposits;

              return (
                <div
                  key={`${title}-${label}-${index}`}
                  className="d-flex justify-content-between align-items-center gap-3"
                >
                  <span className="text-white-50 text-capitalize">
                    {compactLabel(label)}
                  </span>
                  <span className="text-white fw-semibold text-end">
                    {formatCurrency(amount, item.currency)}
                    {count !== undefined ? (
                      <Badge bg="secondary" className="ms-2">
                        {count} {Number(count) === 1 ? "deposit" : "deposits"}
                      </Badge>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Col>
    );
  };

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
          <div>
            <Form.Label className="text-white fw-bold">Language</Form.Label>
            <Form.Control
              type="text"
              placeholder="malayalam, tamil..."
              value={languageFilter}
              onChange={handleFilterChange(setLanguageFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Day</Form.Label>
            <Form.Control
              type="date"
              value={dayFilter}
              onChange={handleFilterChange(setDayFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Month</Form.Label>
            <Form.Control
              type="month"
              value={monthFilter}
              onChange={handleFilterChange(setMonthFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">From Date</Form.Label>
            <Form.Control
              type="date"
              value={fromDateFilter}
              onChange={handleFilterChange(setFromDateFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">To Date</Form.Label>
            <Form.Control
              type="date"
              value={toDateFilter}
              onChange={handleFilterChange(setToDateFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Start Time</Form.Label>
            <Form.Control
              type="time"
              value={startTimeFilter}
              onChange={handleFilterChange(setStartTimeFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">End Time</Form.Label>
            <Form.Control
              type="time"
              value={endTimeFilter}
              onChange={handleFilterChange(setEndTimeFilter)}
            />
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Sort By</Form.Label>
            <Form.Select value={serverSortBy} onChange={handleServerSortChange}>
              <option value="">Newest</option>
              <option value="highestPaidDeposit">Highest Paid</option>
              <option value="amount">Amount</option>
            </Form.Select>
          </div>
          <div>
            <Form.Label className="text-white fw-bold">Order</Form.Label>
            <Form.Select
              value={serverOrder}
              onChange={handleFilterChange(setServerOrder)}
              disabled={!serverSortBy}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </Form.Select>
          </div>
          <Button type="button" variant="outline-light" onClick={clearFilters}>
            Clear
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={handleDownloadExcel}
            disabled={isExporting}
          >
            {isExporting ? "Preparing Excel..." : "Download Excel"}
          </Button>
        </Form>
      </div>

      {summaryItems.length > 0 ? (
        <Row className="mt-4">
          {summaryItems.map(([label, value]) => (
            <Col md={4} xl={2} className="mt-3" key={label}>
              <div className="rounded border border-secondary p-3 h-100">
                <div className="text-white-50 small">{label}</div>
                <div className="text-white fw-bold mt-1">{value}</div>
              </div>
            </Col>
          ))}
        </Row>
      ) : null}

      <Row className="mt-3">
        {renderDepositBreakdown("Deposits By Date", dayWiseDeposits, "day")}
        {renderDepositBreakdown("Deposits By Month", monthWiseDeposits, "month")}
        {renderDepositBreakdown("Deposits By Time", timeWiseDeposits, "time")}
      </Row>

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
