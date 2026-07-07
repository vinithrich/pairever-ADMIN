import { PageHeading } from "@/widgets";
import TablePagination from "@/components/TablePagination";
import { GetUserPaymentCallRecordApi } from "@/helper/Redux/ReduxThunk/Homepage";
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

const DEFAULT_LIMIT = 10;

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

const formatNumber = (value) =>
  (Number(value) || 0).toLocaleString("en-IN");

const formatCurrency = (value) => `Rs. ${formatNumber(value)}`;

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatDuration = (value) => {
  const totalSeconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const getPaymentStatus = (deposit) =>
  String(deposit?.paymentStatus || deposit?.status || "").toLowerCase();

const getCallType = (call) =>
  String(call?.callType || call?.type || "-").toLowerCase();

const getCallBadge = (type) => {
  if (type === "video") return "danger";
  if (type === "audio") return "primary";
  if (type === "chat") return "success";
  return "secondary";
};

const getStaffDetailId = (call) => {
  const staffId = call?.staffId;

  if (staffId && typeof staffId === "object") {
    return staffId?._id || staffId?.id || "";
  }

  return (
    call?.staff?._id ||
    call?.staff?.id ||
    (typeof staffId === "string" ? staffId : "") ||
    ""
  );
};

const getStaffName = (call) =>
  call?.staffName ||
  call?.staff?.name ||
  call?.staffId?.name ||
  call?.staffMemberID ||
  "-";

const renderStaffName = (call) => {
  const id = getStaffDetailId(call);
  const name = getStaffName(call);

  return id ? (
    <Link href={`/staff-management/${id}`} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    name
  );
};

const renderMainUserName = (user, fallback) => {
  const id = user?._id || user?.id || "";
  const name = user?.name || fallback || "-";

  return id ? (
    <Link href={`/user-management/${id}`} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    name
  );
};

const normalizePagination = (pagination, fallbackPage) => ({
  page: Number(pagination?.page) || fallbackPage,
  totalPages: Number(pagination?.totalPages || pagination?.pages) || 1,
  total: Number(pagination?.total || pagination?.totalRecords) || 0,
});

const UserAuditReportPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { memberID } = router.query;

  const [report, setReport] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [calls, setCalls] = useState([]);
  const [depositPage, setDepositPage] = useState(1);
  const [callPage, setCallPage] = useState(1);
  const [depositPagination, setDepositPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [callPagination, setCallPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    depositStatus: "",
    callType: "",
    date: "",
    month: "",
    fromDate: "",
    toDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!memberID) return;

    setIsLoading(true);

    const params = {
      search: memberID,
      depositPage,
      depositLimit: DEFAULT_LIMIT,
      callPage,
      callLimit: DEFAULT_LIMIT,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    await dispatch(
      GetUserPaymentCallRecordApi(params, (resp) => {
        const isSuccess = Boolean(resp?.status ?? resp?.success);
        const payload = resp?.data && typeof resp.data === "object" ? resp.data : resp;

        if (isSuccess) {
          const depositRows = getNestedValue(
            payload,
            [
              "depositRecords.records",
              "deposits.rows",
              "deposits.data",
              "depositRows",
              "deposits",
            ],
            []
          );
          const callRows = getNestedValue(
            payload,
            [
              "callChatRecords.records",
              "calls.rows",
              "calls.data",
              "callRows",
              "calls",
            ],
            []
          );

          setReport(payload);
          setDeposits(Array.isArray(depositRows) ? depositRows : []);
          setCalls(Array.isArray(callRows) ? callRows : []);
          setDepositPagination(
            normalizePagination(
              getNestedValue(
                payload,
                ["depositRecords.pagination", "deposits.pagination", "depositPagination"],
                {}
              ),
              depositPage
            )
          );
          setCallPagination(
            normalizePagination(
              getNestedValue(
                payload,
                ["callChatRecords.pagination", "calls.pagination", "callPagination"],
                {}
              ),
              callPage
            )
          );
        } else {
          setReport(null);
          setDeposits([]);
          setCalls([]);
          setDepositPagination({ page: 1, totalPages: 1, total: 0 });
          setCallPagination({ page: 1, totalPages: 1, total: 0 });
          Notiflix.Notify.failure(resp?.message || "Failed to fetch audit report");
        }

        setIsLoading(false);
      })
    );
  }, [callPage, depositPage, dispatch, filters, memberID]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const user = useMemo(
    () => getNestedValue(report, ["user", "userDetails", "profile"], {}),
    [report]
  );

  const depositSummary = useMemo(
    () => getNestedValue(report, ["depositSummary", "summary.deposits"], {}),
    [report]
  );

  const callSummary = useMemo(
    () => getNestedValue(report, ["callSummary", "summary.calls"], {}),
    [report]
  );

  const totalSpent =
    callSummary?.totalUserSpentCoins ??
    callSummary?.totalSpentCoins ??
    callSummary?.totalCoinsSpent ??
    (Number(callSummary?.video?.spentCoins ?? callSummary?.video?.coins ?? 0) +
      Number(callSummary?.audio?.spentCoins ?? callSummary?.audio?.coins ?? 0) +
      Number(callSummary?.chat?.spentCoins ?? callSummary?.chat?.coins ?? 0)) ??
    0;

  const getSummaryCount = (summary) =>
    summary?.count ?? summary?.calls ?? summary?.totalCalls ?? 0;

  const getSummaryCoins = (summary) =>
    summary?.spentCoins ?? summary?.coins ?? summary?.userSpentCoins ?? 0;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDepositPage(1);
    setCallPage(1);
  };

  const clearFilters = () => {
    setFilters({
      depositStatus: "",
      callType: "",
      date: "",
      month: "",
      fromDate: "",
      toDate: "",
    });
    setDepositPage(1);
    setCallPage(1);
  };

  const statCards = [
    {
      label: "Current Balance",
      value: formatNumber(user?.coinBalance ?? report?.coinBalance),
      subtext: "Coins available",
    },
    {
      label: "Paid Amount",
      value: formatCurrency(depositSummary?.totalPaidAmount ?? depositSummary?.paidAmount),
      subtext: `${formatNumber(depositSummary?.paidDeposits ?? depositSummary?.paidCount)} paid deposits`,
    },
    {
      label: "Credited Coins",
      value: formatNumber(depositSummary?.totalCreditedCoins ?? depositSummary?.creditedCoins),
      subtext: `${formatNumber(depositSummary?.paidButCoinNotCredited ?? depositSummary?.paidNotCredited)} paid not credited`,
    },
    {
      label: "Spent Coins",
      value: formatNumber(totalSpent),
      subtext: `${formatNumber(callSummary?.totalCalls ?? callSummary?.total)} calls/chats`,
    },
  ];

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="User Audit Report" />
      </div>

      <Card className="mt-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <div className="text-white-50 small">User</div>
              <div className="text-white fw-bold">
                {renderMainUserName(user, report?.name)}
              </div>
            </Col>
            <Col md={3}>
              <div className="text-white-50 small">Member ID</div>
              <div className="text-white fw-bold">
                {user?.memberID || memberID || "-"}
              </div>
            </Col>
            <Col md={3}>
              <div className="text-white-50 small">Phone</div>
              <div className="text-white fw-bold">
                {user?.phone || report?.phone || "-"}
              </div>
            </Col>
            <Col md={3} className="text-md-end">
              <Button variant="outline-light" onClick={fetchReport} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        {statCards.map((stat) => (
          <Col md={6} xl={3} className="mb-3" key={stat.label}>
            <Card className="h-100">
              <Card.Body>
                <div className="text-white-50 small">{stat.label}</div>
                <h3 className="text-white my-2">{isLoading ? "-" : stat.value}</h3>
                <div className="text-white-50 small">{stat.subtext}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mt-3">
        <Card.Body>
          <Form className="d-flex flex-wrap align-items-end gap-3">
            <div>
              <Form.Label className="fw-bold">Deposit Status</Form.Label>
              <Form.Select
                value={filters.depositStatus}
                onChange={(event) =>
                  handleFilterChange("depositStatus", event.target.value)
                }
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="created">Created</option>
                <option value="credited">Credited</option>
                <option value="not_credited">Not Credited</option>
                <option value="pending_credit">Pending Credit</option>
              </Form.Select>
            </div>
            <div>
              <Form.Label className="fw-bold">Call Type</Form.Label>
              <Form.Select
                value={filters.callType}
                onChange={(event) =>
                  handleFilterChange("callType", event.target.value)
                }
              >
                <option value="">All</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="chat">Chat</option>
              </Form.Select>
            </div>
            <div>
              <Form.Label className="fw-bold">Date</Form.Label>
              <Form.Control
                type="date"
                value={filters.date}
                onChange={(event) => handleFilterChange("date", event.target.value)}
              />
            </div>
            <div>
              <Form.Label className="fw-bold">Month</Form.Label>
              <Form.Control
                type="month"
                value={filters.month}
                onChange={(event) => handleFilterChange("month", event.target.value)}
              />
            </div>
            <div>
              <Form.Label className="fw-bold">From Date</Form.Label>
              <Form.Control
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  handleFilterChange("fromDate", event.target.value)
                }
              />
            </div>
            <div>
              <Form.Label className="fw-bold">To Date</Form.Label>
              <Form.Control
                type="date"
                value={filters.toDate}
                onChange={(event) =>
                  handleFilterChange("toDate", event.target.value)
                }
              />
            </div>
            <Button variant="outline-secondary" onClick={clearFilters}>
              Clear
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col xl={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h4 className="mb-0">Deposit Summary</h4>
            </Card.Header>
            <Table responsive className="mb-0">
              <tbody>
                <tr>
                  <td>Total Records</td>
                  <td className="text-end">{formatNumber(depositSummary?.totalDepositRecords ?? depositSummary?.totalRecords)}</td>
                </tr>
                <tr>
                  <td>Paid And Coin Credited</td>
                  <td className="text-end">{formatNumber(depositSummary?.paidAndCoinCredited ?? depositSummary?.paidCredited)}</td>
                </tr>
                <tr>
                  <td>Pending/Created Count</td>
                  <td className="text-end">{formatNumber(depositSummary?.pendingCreatedCount ?? depositSummary?.createdDeposits)}</td>
                </tr>
                <tr>
                  <td>Pending/Created Amount</td>
                  <td className="text-end">{formatCurrency(depositSummary?.pendingCreatedAmount ?? depositSummary?.createdAmount)}</td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col xl={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h4 className="mb-0">Call Summary</h4>
            </Card.Header>
            <Table responsive className="mb-0">
              <tbody>
                <tr>
                  <td>Video</td>
                  <td className="text-end">
                    {formatNumber(callSummary?.videoCalls ?? getSummaryCount(callSummary?.video))} calls /
                    {" "}{formatNumber(callSummary?.videoCoins ?? getSummaryCoins(callSummary?.video))} coins
                  </td>
                </tr>
                <tr>
                  <td>Audio</td>
                  <td className="text-end">
                    {formatNumber(callSummary?.audioCalls ?? getSummaryCount(callSummary?.audio))} calls /
                    {" "}{formatNumber(callSummary?.audioCoins ?? getSummaryCoins(callSummary?.audio))} coins
                  </td>
                </tr>
                <tr>
                  <td>Chat</td>
                  <td className="text-end">
                    {formatNumber(callSummary?.chatCalls ?? getSummaryCount(callSummary?.chat))} chats /
                    {" "}{formatNumber(callSummary?.chatCoins ?? getSummaryCoins(callSummary?.chat))} coins
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Deposit Records</h4>
        </Card.Header>
        <Table responsive hover className="text-nowrap mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Coins</th>
              <th>Status</th>
              <th>Coin Credited</th>
              <th>Payment ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading deposits...
                </td>
              </tr>
            ) : deposits.length > 0 ? (
              deposits.map((deposit, index) => {
                const status = getPaymentStatus(deposit);

                return (
                  <tr key={deposit?._id || `${deposit?.createdAt}-${index}`}>
                    <td>{(depositPage - 1) * DEFAULT_LIMIT + index + 1}</td>
                    <td>{formatDateTime(deposit?.createdAt || deposit?.updatedAt)}</td>
                    <td>{formatCurrency(deposit?.totalAmount ?? deposit?.amount)}</td>
                    <td>{formatNumber(deposit?.coins ?? deposit?.coin ?? deposit?.creditCoins)}</td>
                    <td>
                      <Badge bg={status === "paid" ? "success" : "secondary"}>
                        {status || "-"}
                      </Badge>
                    </td>
                    <td>
                      {deposit?.coinCredited ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">No</Badge>
                      )}
                    </td>
                    <td>{deposit?.paymentId || deposit?.razorpayPaymentId || "-"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  No deposit records found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <TablePagination
          currentPage={depositPage}
          totalPages={depositPagination.totalPages}
          onPageChange={(page) => setDepositPage(page)}
        />
      </Card>

      <Card>
        <Card.Header>
          <h4 className="mb-0">Call / Chat Records</h4>
        </Card.Header>
        <Table responsive hover className="text-nowrap mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Type</th>
              <th>Staff</th>
              <th>Duration</th>
              <th>User Spent</th>
              <th>Staff Earned</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading calls...
                </td>
              </tr>
            ) : calls.length > 0 ? (
              calls.map((call, index) => {
                const type = getCallType(call);

                return (
                  <tr key={call?._id || `${call?.createdAt}-${index}`}>
                    <td>{(callPage - 1) * DEFAULT_LIMIT + index + 1}</td>
                    <td>{formatDateTime(call?.createdAt || call?.startedAt)}</td>
                    <td>
                      <Badge bg={getCallBadge(type)}>{type}</Badge>
                    </td>
                    <td>
                      {renderStaffName(call)}
                    </td>
                    <td>{formatDuration(call?.callDuration ?? call?.duration)}</td>
                    <td className="text-danger">
                      {formatNumber(call?.userSpentAmount ?? call?.userSpentCoins ?? call?.coins)}
                    </td>
                    <td className="text-success">
                      {formatNumber(call?.staffEarned ?? call?.staffEarnedAmount)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  No call or chat records found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <TablePagination
          currentPage={callPage}
          totalPages={callPagination.totalPages}
          onPageChange={(page) => setCallPage(page)}
        />
      </Card>
    </Container>
  );
};

export default UserAuditReportPage;
