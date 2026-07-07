import { PageHeading } from "@/widgets";
import TablePagination from "@/components/TablePagination";
import { GetStaffAuditRecordApi } from "@/helper/Redux/ReduxThunk/Homepage";
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

const formatAmount = (value) => `Rs. ${formatNumber(value)}`;

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
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes || hours) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
};

const normalizePagination = (pagination, fallbackPage) => ({
  page: Number(pagination?.page) || fallbackPage,
  totalPages: Number(pagination?.totalPages || pagination?.pages) || 1,
  total: Number(pagination?.total || pagination?.totalRecords) || 0,
});

const getCallType = (call) =>
  String(call?.callType || call?.type || "-").toLowerCase();

const getCallBadge = (type) => {
  if (type === "video") return "danger";
  if (type === "audio") return "primary";
  if (type === "chat") return "success";
  return "secondary";
};

const getUserDetailId = (call) => {
  const userId = call?.userId;

  if (userId && typeof userId === "object") {
    return userId?._id || userId?.id || "";
  }

  return (
    call?.user?._id ||
    call?.user?.id ||
    (typeof userId === "string" ? userId : "") ||
    ""
  );
};

const getUserName = (call) =>
  call?.userName ||
  call?.user?.name ||
  call?.userId?.name ||
  call?.userMemberID ||
  "-";

const renderUserName = (call) => {
  const id = getUserDetailId(call);
  const name = getUserName(call);

  return id ? (
    <Link href={`/user-management/${id}`} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    name
  );
};

const renderMainStaffName = (staff, fallback) => {
  const id = staff?._id || staff?.id || "";
  const name = staff?.name || fallback || "-";

  return id ? (
    <Link href={`/staff-management/${id}`} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    name
  );
};

const getWithdrawStatus = (status) => {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "0" || normalized === "pending") {
    return { label: "Pending", variant: "warning text-dark" };
  }

  if (normalized === "1" || normalized === "approved" || normalized === "paid") {
    return { label: normalized === "paid" ? "Paid" : "Approved", variant: "success" };
  }

  if (normalized === "2" || normalized === "rejected") {
    return { label: "Rejected", variant: "danger" };
  }

  return { label: status || "-", variant: "secondary" };
};

const getSummaryCount = (summary) =>
  summary?.count ?? summary?.calls ?? summary?.totalCalls ?? 0;

const getSummaryCoins = (summary) =>
  summary?.spentCoins ?? summary?.coins ?? summary?.userSpentCoins ?? 0;

const getDurationLabel = (summary) => {
  if (summary?.totalDurationLabel) return summary.totalDurationLabel;

  const seconds = summary?.totalDurationSeconds;
  if (seconds !== undefined && seconds !== null) {
    return formatDuration(seconds);
  }

  const minutes = summary?.totalDurationMinutes;
  if (minutes !== undefined && minutes !== null) {
    return `${Number(minutes).toFixed(2)} minutes`;
  }

  return "-";
};

const getWithdrawTotal = (summary) =>
  summary?.total ??
  summary?.totalWithdraws ??
  summary?.totalRecords ??
  summary?.totalCount ??
  0;

const getWithdrawApproved = (summary) =>
  summary?.approved ??
  summary?.approvedWithdraws ??
  summary?.approvedCount ??
  0;

const getWithdrawPending = (summary) =>
  summary?.pending ??
  summary?.pendingWithdraws ??
  summary?.pendingCount ??
  0;

const getWithdrawRejected = (summary) =>
  summary?.rejected ??
  summary?.rejectedWithdraws ??
  summary?.rejectedCount ??
  0;

const StaffAuditReportPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { memberID } = router.query;

  const [report, setReport] = useState(null);
  const [calls, setCalls] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [callPage, setCallPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [callPagination, setCallPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [withdrawPagination, setWithdrawPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    callType: "",
    withdrawStatus: "",
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
      callPage,
      callLimit: DEFAULT_LIMIT,
      withdrawPage,
      withdrawLimit: DEFAULT_LIMIT,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    await dispatch(
      GetStaffAuditRecordApi(params, (resp) => {
        const isSuccess = Boolean(resp?.status ?? resp?.success);
        const payload = resp?.data && typeof resp.data === "object" ? resp.data : resp;

        if (isSuccess) {
          const callRows = getNestedValue(
            payload,
            [
              "callRecords.records",
              "callChatRecords.records",
              "calls.rows",
              "calls.data",
              "callRows",
              "calls",
            ],
            []
          );
          const withdrawRows = getNestedValue(
            payload,
            [
              "withdrawRecords.records",
              "withdraws.rows",
              "withdraws.data",
              "withdrawRows",
              "withdraws",
            ],
            []
          );

          setReport(payload);
          setCalls(Array.isArray(callRows) ? callRows : []);
          setWithdraws(Array.isArray(withdrawRows) ? withdrawRows : []);
          setCallPagination(
            normalizePagination(
              getNestedValue(
                payload,
                [
                  "callRecords.pagination",
                  "callChatRecords.pagination",
                  "calls.pagination",
                  "callPagination",
                ],
                {}
              ),
              callPage
            )
          );
          setWithdrawPagination(
            normalizePagination(
              getNestedValue(
                payload,
                [
                  "withdrawRecords.pagination",
                  "withdraws.pagination",
                  "withdrawPagination",
                ],
                {}
              ),
              withdrawPage
            )
          );
        } else {
          setReport(null);
          setCalls([]);
          setWithdraws([]);
          setCallPagination({ page: 1, totalPages: 1, total: 0 });
          setWithdrawPagination({ page: 1, totalPages: 1, total: 0 });
          Notiflix.Notify.failure(resp?.message || "Failed to fetch staff audit report");
        }

        setIsLoading(false);
      })
    );
  }, [callPage, dispatch, filters, memberID, withdrawPage]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const staff = useMemo(
    () => getNestedValue(report, ["staff", "staffDetails", "profile"], {}),
    [report]
  );

  const staffSummary = useMemo(
    () => getNestedValue(report, ["staffSummary", "summary.staff"], {}),
    [report]
  );

  const callSummary = useMemo(
    () => getNestedValue(report, ["callSummary", "summary.calls"], {}),
    [report]
  );

  const withdrawSummary = useMemo(
    () => ({
      ...getNestedValue(report, ["withdrawalCounts"], {}),
      ...getNestedValue(report, ["withdrawalSummary"], {}),
      ...getNestedValue(report, ["staffSummary.withdrawals"], {}),
      ...getNestedValue(report, ["staffSummary.withdrawSummary"], {}),
      ...getNestedValue(report, ["summary.withdraws"], {}),
      ...getNestedValue(report, ["withdrawSummary"], {}),
    }),
    [report]
  );

  const totalEarned =
    staffSummary?.totalEarned ??
    staffSummary?.staffEarned ??
    staff?.staffEarned ??
    0;

  const staffDurationLabel = getDurationLabel(staffSummary);
  const callDurationLabel = getDurationLabel(callSummary);
  const totalDurationLabel =
    staffDurationLabel !== "-" ? staffDurationLabel : callDurationLabel;

  const totalCallCoins =
    Number(getSummaryCoins(callSummary?.video)) +
    Number(getSummaryCoins(callSummary?.audio)) +
    Number(getSummaryCoins(callSummary?.chat));

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCallPage(1);
    setWithdrawPage(1);
  };

  const clearFilters = () => {
    setFilters({
      callType: "",
      withdrawStatus: "",
      date: "",
      month: "",
      fromDate: "",
      toDate: "",
    });
    setCallPage(1);
    setWithdrawPage(1);
  };

  const statCards = [
    {
      label: "Total Calls",
      value: formatNumber(callSummary?.totalCalls ?? callSummary?.total ?? callPagination.total),
      subtext: "Audio, video and chat",
    },
    {
      label: "Call Coins",
      value: formatNumber(callSummary?.totalCoins ?? totalCallCoins),
      subtext: "Coins from calls/chats",
    },
    {
      label: "Total Duration",
      value: totalDurationLabel,
      subtext: "All calls/chats",
    },
    {
      label: "Staff Earned",
      value: formatAmount(totalEarned),
      subtext: "Current earned amount",
    },
    {
      label: "Withdraw Records",
      value: formatNumber(getWithdrawTotal(withdrawSummary) || withdrawPagination.total),
      subtext: "All withdrawal requests",
    },
  ];

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Staff Audit Report" />
      </div>

      <Card className="mt-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <div className="text-white-50 small">Staff</div>
              <div className="text-white fw-bold">
                {renderMainStaffName(staff, report?.name)}
              </div>
            </Col>
            <Col md={3}>
              <div className="text-white-50 small">Member ID</div>
              <div className="text-white fw-bold">
                {staff?.memberID || memberID || "-"}
              </div>
            </Col>
            <Col md={3}>
              <div className="text-white-50 small">Phone</div>
              <div className="text-white fw-bold">
                {staff?.phone || report?.phone || "-"}
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
              <Form.Label className="fw-bold">Withdraw Status</Form.Label>
              <Form.Select
                value={filters.withdrawStatus}
                onChange={(event) =>
                  handleFilterChange("withdrawStatus", event.target.value)
                }
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
              <h4 className="mb-0">Call Summary</h4>
            </Card.Header>
            <Table responsive className="mb-0">
              <tbody>
                <tr>
                  <td>Video</td>
                  <td className="text-end">
                    {formatNumber(getSummaryCount(callSummary?.video))} calls /
                    {" "}{formatNumber(getSummaryCoins(callSummary?.video))} coins /
                    {" "}{getDurationLabel(callSummary?.video)}
                  </td>
                </tr>
                <tr>
                  <td>Audio</td>
                  <td className="text-end">
                    {formatNumber(getSummaryCount(callSummary?.audio))} calls /
                    {" "}{formatNumber(getSummaryCoins(callSummary?.audio))} coins /
                    {" "}{getDurationLabel(callSummary?.audio)}
                  </td>
                </tr>
                <tr>
                  <td>Chat</td>
                  <td className="text-end">
                    {formatNumber(getSummaryCount(callSummary?.chat))} chats /
                    {" "}{formatNumber(getSummaryCoins(callSummary?.chat))} coins /
                    {" "}{getDurationLabel(callSummary?.chat)}
                  </td>
                </tr>
                <tr>
                  <td>Total Duration</td>
                  <td className="text-end">
                    {totalDurationLabel}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col xl={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h4 className="mb-0">Withdraw Summary</h4>
            </Card.Header>
            <Table responsive className="mb-0">
              <tbody>
                <tr>
                  <td>Total</td>
                  <td className="text-end">
                    {formatNumber(getWithdrawTotal(withdrawSummary))}
                  </td>
                </tr>
                <tr>
                  <td>Approved</td>
                  <td className="text-end">
                    {formatNumber(getWithdrawApproved(withdrawSummary))}
                  </td>
                </tr>
                <tr>
                  <td>Pending</td>
                  <td className="text-end">
                    {formatNumber(getWithdrawPending(withdrawSummary))}
                  </td>
                </tr>
                <tr>
                  <td>Rejected</td>
                  <td className="text-end">
                    {formatNumber(getWithdrawRejected(withdrawSummary))}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Call / Chat Records</h4>
        </Card.Header>
        <Table responsive hover className="text-nowrap mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Type</th>
              <th>User</th>
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
                      {renderUserName(call)}
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

      <Card>
        <Card.Header>
          <h4 className="mb-0">Withdraw Records</h4>
        </Card.Header>
        <Table responsive hover className="text-nowrap mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Requested</th>
              <th>Fee</th>
              <th>Final Amount</th>
              <th>Status</th>
              <th>UPI / Bank</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading withdraws...
                </td>
              </tr>
            ) : withdraws.length > 0 ? (
              withdraws.map((withdraw, index) => {
                const status = getWithdrawStatus(withdraw?.status);

                return (
                  <tr key={withdraw?._id || `${withdraw?.createdAt}-${index}`}>
                    <td>{(withdrawPage - 1) * DEFAULT_LIMIT + index + 1}</td>
                    <td>{formatDateTime(withdraw?.createdAt || withdraw?.updatedAt)}</td>
                    <td>{formatAmount(withdraw?.requestedAmount ?? withdraw?.amount)}</td>
                    <td>{formatAmount(withdraw?.withdrawalFee ?? withdraw?.fee)}</td>
                    <td>{formatAmount(withdraw?.finalAmount ?? withdraw?.amount)}</td>
                    <td>
                      <Badge bg={status.variant}>{status.label}</Badge>
                    </td>
                    <td>
                      {withdraw?.UPI ||
                        withdraw?.upi ||
                        withdraw?.bankHolderName ||
                        withdraw?.accountNumber ||
                        "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  No withdraw records found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <TablePagination
          currentPage={withdrawPage}
          totalPages={withdrawPagination.totalPages}
          onPageChange={(page) => setWithdrawPage(page)}
        />
      </Card>
    </Container>
  );
};

export default StaffAuditReportPage;
