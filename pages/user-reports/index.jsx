import { PageHeading } from "@/widgets";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { GetUserReportListApi } from "@/helper/Redux/ReduxThunk/Homepage";

const REPORT_TYPES = [
  { value: "all", label: "All Users" },
  { value: "highest_deposit", label: "Highest Deposit" },
  { value: "free_coin_used_no_deposit", label: "Free Coin Used, No Deposit" },
  { value: "free_coin_not_used", label: "Free Coin Not Used" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "deposit_attempted", label: "Deposit Attempted" },
  { value: "deposit_in_process", label: "Deposit In Process" },
  { value: "not_deposited", label: "Not Deposited" },
];

const SUMMARY_CARDS = [
  { key: "all", label: "All Users" },
  { key: "highestDeposit", label: "Paid Deposit Users" },
  { key: "freeCoinUsedNoDeposit", label: "Free Coin Used, No Deposit" },
  { key: "freeCoinNotUsed", label: "Free Coin Not Used" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
  { key: "depositAttempted", label: "Deposit Attempted" },
  { key: "depositInProcess", label: "Deposit In Process" },
  { key: "notDeposited", label: "Not Deposited" },
];

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

const formatAmount = (amount) => Number(amount || 0).toLocaleString("en-IN");

const getBooleanBadge = (value, trueLabel = "Yes", falseLabel = "No") =>
  value ? (
    <Badge bg="success">{trueLabel}</Badge>
  ) : (
    <Badge bg="secondary">{falseLabel}</Badge>
  );

const getReportLabel = (value) =>
  REPORT_TYPES.find((item) => item.value === value)?.label || "All Users";

const UserReportsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reportType, setReportType] = useState("all");
  const [serverSortBy, setServerSortBy] = useState("");
  const [serverOrder, setServerOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const limit = 10;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput, setCurrentPage]);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);

    const params = {
      status: reportType,
      page: currentPage,
      limit,
      search: debouncedSearch,
    };

    if (serverSortBy) {
      params.sortBy = serverSortBy;
      params.order = serverOrder;
    }

    await dispatch(
      GetUserReportListApi(params, (resp) => {
        const isSuccess = resp?.status === true || resp?.success === true;

        if (isSuccess) {
          setUsers(Array.isArray(resp?.data) ? resp.data : []);
          setCounts(resp?.counts || resp?.summary || {});
          setTotalPages(resp?.pagination?.totalPages || 1);
        } else {
          setUsers([]);
          setCounts({});
          setTotalPages(1);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch user reports"
          );
        }

        setIsLoading(false);
      })
    );
  }, [
    currentPage,
    debouncedSearch,
    dispatch,
    reportType,
    serverOrder,
    serverSortBy,
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedUsers = useMemo(() => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    return [...users].sort((a, b) => {
      const aValue = a?.[sortConfig.key] ?? "";
      const bValue = b?.[sortConfig.key] ?? "";

      if (typeof aValue === "number" || typeof bValue === "number") {
        return (Number(aValue || 0) - Number(bValue || 0)) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [sortConfig, users]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
    setCurrentPage(1);
  };

  const handleServerSortChange = (event) => {
    setServerSortBy(event.target.value);
    setCurrentPage(1);
  };

  const summaryCards = SUMMARY_CARDS.map((item) => ({
    ...item,
    value: counts?.[item.key] ?? 0,
  }));

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="User Reports" />
      </div>

      <Row className="mt-4">
        {summaryCards.map((item) => (
          <Col md={4} xl={3} xxl={2} className="mt-3" key={item.key}>
            <Card className="support-stat-card h-100">
              <p className="support-stat-label">{item.label}</p>
              <h3 className="support-stat-value">
                {isLoading ? "-" : item.value}
              </h3>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-4">
        <Form className="d-flex gap-3 flex-wrap align-items-end">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search name / phone / member ID / language"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Report Type</Form.Label>
            <Form.Select value={reportType} onChange={handleReportTypeChange}>
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Sort By</Form.Label>
            <Form.Select value={serverSortBy} onChange={handleServerSortChange}>
              <option value="">Newest</option>
              <option value="deposit">Deposit</option>
              <option value="coins">Coins</option>
              <option value="name">Name</option>
            </Form.Select>
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Order</Form.Label>
            <Form.Select
              value={serverOrder}
              onChange={(event) => {
                setServerOrder(event.target.value);
                setCurrentPage(1);
              }}
              disabled={!serverSortBy}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </Form.Select>
          </div>
        </Form>

        <Button variant="outline-light" onClick={fetchReports}>
          Refresh
        </Button>
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <Card>
            <Card.Body className="pb-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">{getReportLabel(reportType)}</h4>
                  <p className="text-muted mb-0">
                    Users matched by deposit, free coin, verification, and
                    activity signals.
                  </p>
                </div>
                <span className="text-muted small">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </Card.Body>

            <Table responsive className="text-nowrap mb-0 mt-3">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>
                    <SortableHeader
                      label="Name"
                      sortKey="name"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>Phone</th>
                  <th>Member ID</th>
                  <th>Language</th>
                  <th>
                    <SortableHeader
                      label="Coins"
                      sortKey="coinBalance"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>Verified</th>
                  <th>Welcome Bonus</th>
                  <th>Free Coins Used</th>
                  <th>Paid Deposit</th>
                  <th>Deposit Attempts</th>
                  <th>In Process</th>
                  <th>
                    <SortableHeader
                      label="Total Deposit"
                      sortKey="totalPaidDeposit"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Highest Deposit"
                      sortKey="highestDepositAmount"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Created"
                      sortKey="createdAt"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="16" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading user reports...
                    </td>
                  </tr>
                ) : sortedUsers.length > 0 ? (
                  sortedUsers.map((user, index) => (
                    <tr key={user?._id || index}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td>
                        {user?._id ? (
                          <Link href={`/user-management/${user._id}`}>
                            {user?.name || "-"}
                          </Link>
                        ) : (
                          user?.name || "-"
                        )}
                      </td>
                      <td>{user?.phone || "-"}</td>
                      <td>{user?.memberID || "-"}</td>
                      <td>{user?.Language || "-"}</td>
                      <td>{formatAmount(user?.coinBalance)}</td>
                      <td>{getBooleanBadge(user?.isLogin)}</td>
                      <td>{getBooleanBadge(user?.hasWelcomeBonus)}</td>
                      <td>{getBooleanBadge(user?.hasUsedFreeCoins)}</td>
                      <td>{getBooleanBadge(user?.hasPaidDeposit)}</td>
                      <td>{user?.depositCount ?? 0}</td>
                      <td>{user?.createdDepositCount ?? 0}</td>
                      <td>{formatAmount(user?.totalPaidDeposit)} INR</td>
                      <td>{formatAmount(user?.highestDepositAmount)} INR</td>
                      <td>{formatDateTime(user?.createdAt)}</td>
                      <td>
                        {user?._id ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/user-management/${user._id}`)
                            }
                          >
                            View
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="16" className="text-center py-5">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserReportsPage;
