import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";
import TablePagination from "@/components/TablePagination";
import { TrendChart, AppComparisonChart } from "@/components/ReportCharts";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
  { key: "all", label: "All Time" },
];

const nf = new Intl.NumberFormat("en-IN");
const money = (v) => `₹${nf.format(Math.round((Number(v) || 0) * 100) / 100)}`;

const todayISO = () => {
  // The backend reads dates as IST calendar days, so default the picker to the
  // admin's IST "today" rather than the browser's UTC date.
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

const AppReportsPage = () => {
  const router = useRouter();

  const [apps, setApps] = useState([]);
  const [appName, setAppName] = useState("all");
  // Users and Staff are separate views rather than one long scroll.
  const [view, setView] = useState("users");
  const [period, setPeriod] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Which metric card is opened as a user list.
  const [segment, setSegment] = useState("joined");
  const [userList, setUserList] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(20);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  // Only the newest request may write to state — filters change fast and an older
  // response landing late would show the wrong list under the wrong heading.
  const usersRequestRef = useRef(0);

  // ---- staff side (global: staff are shared across every app) ----
  const [staffReport, setStaffReport] = useState(null);
  const [isStaffLoading, setIsStaffLoading] = useState(true);
  const [staffSegment, setStaffSegment] = useState("registered");
  const [staffRows, setStaffRows] = useState(null);
  const [staffPage, setStaffPage] = useState(1);
  const [staffLimit, setStaffLimit] = useState(20);
  const [staffSearch, setStaffSearch] = useState("");
  const [debouncedStaffSearch, setDebouncedStaffSearch] = useState("");
  const [isStaffRowsLoading, setIsStaffRowsLoading] = useState(false);
  const staffRequestRef = useRef(0);

  const [series, setSeries] = useState(null);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);

  const [languages, setLanguages] = useState(null);
  const [isLanguagesLoading, setIsLanguagesLoading] = useState(true);

  const [compare, setCompare] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === "custom") {
      params.set("from", from);
      params.set("to", to || from);
    }
    return params;
  }, [period, from, to]);

  useEffect(() => {
    apiHelper
      .getRequest("app-report/apps")
      .then((resp) => setApps(resp?.status ? resp.data || [] : []))
      .catch(() => setApps([]));
  }, []);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(query);
      params.set("appName", appName);
      const resp = await apiHelper.getRequest(`app-report?${params.toString()}`);
      if (resp?.status) {
        setReport(resp.data);
      } else {
        setReport(null);
        Notiflix.Notify.failure(resp?.message || "Failed to load report");
      }
    } finally {
      setIsLoading(false);
    }
  }, [appName, query]);

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const resp = await apiHelper.getRequest(`app-report/summary?${query.toString()}`);
      if (resp?.status) {
        setSummary(resp);
      } else {
        setSummary(null);
        Notiflix.Notify.failure(resp?.message || "Failed to load comparison");
      }
    } finally {
      setIsSummaryLoading(false);
    }
  }, [query]);

  const loadUsers = useCallback(async () => {
    const requestId = ++usersRequestRef.current;
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams(query);
      params.set("appName", appName);
      params.set("segment", segment);
      params.set("page", String(userPage));
      params.set("limit", String(userLimit));
      if (debouncedUserSearch) params.set("search", debouncedUserSearch);

      const resp = await apiHelper.getRequest(`app-report/users?${params.toString()}`);
      if (requestId !== usersRequestRef.current) return;

      if (resp?.status) {
        setUserList(resp);
      } else {
        setUserList(null);
        Notiflix.Notify.failure(resp?.message || "Failed to load users");
      }
    } finally {
      if (requestId === usersRequestRef.current) setIsUsersLoading(false);
    }
  }, [appName, query, segment, userPage, userLimit, debouncedUserSearch]);

  // One request after typing stops, rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
      setUserPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Changing app, period or segment restarts the list at page 1.
  useEffect(() => {
    setUserPage(1);
  }, [appName, query, segment]);

  const loadSeries = useCallback(async () => {
    setIsSeriesLoading(true);
    try {
      const params = new URLSearchParams(query);
      params.set("appName", appName);
      const resp = await apiHelper.getRequest(`app-report/series?${params.toString()}`);
      setSeries(resp?.status ? resp.data : null);
    } finally {
      setIsSeriesLoading(false);
    }
  }, [appName, query]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const loadLanguages = useCallback(async () => {
    setIsLanguagesLoading(true);
    try {
      const params = new URLSearchParams(query);
      params.set("appName", appName);
      const resp = await apiHelper.getRequest(`app-report/languages?${params.toString()}`);
      setLanguages(resp?.status ? resp.data : null);
    } finally {
      setIsLanguagesLoading(false);
    }
  }, [appName, query]);

  useEffect(() => {
    if (view === "users") loadSeries();
  }, [view, loadSeries]);

  useEffect(() => {
    if (view === "users") loadLanguages();
  }, [view, loadLanguages]);

  // Only fetch what the visible view needs — the hidden report should not be
  // issuing queries against a 300k-user collection in the background.
  useEffect(() => {
    if (view === "users") loadUsers();
  }, [view, loadUsers]);

  const loadStaffReport = useCallback(async () => {
    setIsStaffLoading(true);
    try {
      const resp = await apiHelper.getRequest(`staff-report-overview?${query.toString()}`);
      setStaffReport(resp?.status ? resp.data : null);
    } finally {
      setIsStaffLoading(false);
    }
  }, [query]);

  const loadStaffRows = useCallback(async () => {
    const requestId = ++staffRequestRef.current;
    setIsStaffRowsLoading(true);
    try {
      const params = new URLSearchParams(query);
      params.set("segment", staffSegment);
      params.set("page", String(staffPage));
      params.set("limit", String(staffLimit));
      if (debouncedStaffSearch) params.set("search", debouncedStaffSearch);

      const resp = await apiHelper.getRequest(`staff-report-overview/rows?${params.toString()}`);
      if (requestId !== staffRequestRef.current) return;
      setStaffRows(resp?.status ? resp : null);
    } finally {
      if (requestId === staffRequestRef.current) setIsStaffRowsLoading(false);
    }
  }, [query, staffSegment, staffPage, staffLimit, debouncedStaffSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStaffSearch(staffSearch.trim());
      setStaffPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [staffSearch]);

  useEffect(() => {
    setStaffPage(1);
  }, [query, staffSegment]);

  useEffect(() => {
    if (view === "staff") loadStaffReport();
  }, [view, loadStaffReport]);

  useEffect(() => {
    if (view === "staff") loadStaffRows();
  }, [view, loadStaffRows]);

  useEffect(() => {
    if (compare) loadSummary();
  }, [compare, loadSummary]);

  const m = report?.metrics || {};

  const cards = [
    { label: "Users Joined", value: nf.format(m.joinedUsers || 0), hint: "New sign-ups in this period", segment: "joined" },
    { label: "Verified Users", value: nf.format(m.joinedVerifiedUsers || 0), hint: "Of those, OTP verified", segment: "verified" },
    { label: "Deposit Users", value: nf.format(m.depositUsers || 0), hint: "Unique users who completed a deposit", segment: "deposited" },
    // Deposits is a count of payments, not of people, so it has no user list.
    { label: "Deposits", value: nf.format(m.deposits || 0), hint: `${money(m.depositAmount)} collected`, segment: null },
    { label: "Users on Calls", value: nf.format(m.callingUsers || 0), hint: "Made an audio/video call", segment: "calling" },
    { label: "Free-Call Users", value: nf.format(m.freeCallUsers || 0), hint: "Bonus coins only — never deposited", segment: "free" },
  ];

  const sm = staffReport?.metrics || {};
  const staffCards = [
    { label: "Staff Registered", value: nf.format(sm.registered || 0), hint: "New staff sign-ups", segment: "registered" },
    { label: "Verified Staff", value: nf.format(sm.verified || 0), hint: "Of those, OTP verified", segment: "verified" },
    { label: "Pending Approval", value: nf.format(sm.pendingFromPeriod || 0), hint: `${nf.format(sm.pendingApprovalBacklog || 0)} pending in total`, segment: "pending" },
    { label: "Approved", value: nf.format(sm.approvedInPeriod || 0), hint: "Approved in this period", segment: "approved" },
    { label: "Withdrawals Paid", value: nf.format(sm.withdrawCompleted || 0), hint: `${money(sm.withdrawCompletedAmount)} paid out`, segment: "withdraw_completed" },
    { label: "Withdrawals Pending", value: nf.format(sm.withdrawPending || 0), hint: `${money(sm.withdrawPendingAmount)} awaiting approval`, segment: "withdraw_pending" },
  ];

  const COLUMNS = [
    ["Application", (row) => row.app.name, "text-start"],
    ["Joined", (row) => nf.format(row.metrics.joinedUsers)],
    ["Verified", (row) => nf.format(row.metrics.joinedVerifiedUsers)],
    ["Deposit Users", (row) => nf.format(row.metrics.depositUsers)],
    ["Deposits", (row) => nf.format(row.metrics.deposits)],
    ["Amount", (row) => money(row.metrics.depositAmount)],
    ["On Calls", (row) => nf.format(row.metrics.callingUsers)],
    ["Free Call", (row) => nf.format(row.metrics.freeCallUsers)],
    ["Total Users", (row) => nf.format(row.metrics.totalUsers)],
  ];

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={() => router.back()} />
        <PageHeading heading="App Reports" />
      </div>

      {/* ---------------- Filters ---------------- */}
      <Card className="shadow-sm mt-4 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={4} lg={3}>
              <Form.Label className="fw-bold small mb-1">Application</Form.Label>
              <Form.Select value={appName} onChange={(e) => setAppName(e.target.value)}>
                <option value="all">All Applications</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </Form.Select>
              {view === "staff" && (
                <div className="text-muted small mt-1">
                  Staff figures ignore this selector
                </div>
              )}
            </Col>

            <Col md={8} lg={5}>
              <Form.Label className="fw-bold small mb-1 d-block">Period</Form.Label>
              <ButtonGroup className="flex-wrap">
                {PERIODS.map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={period === p.key ? "primary" : "outline-secondary"}
                    onClick={() => setPeriod(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>

            {period === "custom" && (
              <>
                <Col sm={6} md={4} lg={2}>
                  <Form.Label className="fw-bold small mb-1">From</Form.Label>
                  <Form.Control type="date" value={from} max={to || todayISO()} onChange={(e) => setFrom(e.target.value)} />
                </Col>
                <Col sm={6} md={4} lg={2}>
                  <Form.Label className="fw-bold small mb-1">To</Form.Label>
                  <Form.Control type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                </Col>
              </>
            )}
          </Row>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
            <div className="text-muted small">
              {report?.period?.label ? (
                <>
                  Showing <span className="fw-semibold">{report.app.name}</span> ·{" "}
                  <Badge bg="dark">{report.period.label}</Badge>{" "}
                  {report.period.startsAt && (
                    <>
                      {new Date(report.period.startsAt).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" })}
                      {" – "}
                      {new Date(new Date(report.period.endsAt).getTime() - 1).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" })}
                      {" (IST)"}
                    </>
                  )}
                </>
              ) : (
                "Loading..."
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <ButtonGroup size="sm">
                {[
                  { key: "users", label: "User Report" },
                  { key: "staff", label: "Staff Report" },
                ].map((v) => (
                  <Button
                    key={v.key}
                    variant={view === v.key ? "primary" : "outline-secondary"}
                    onClick={() => setView(v.key)}
                  >
                    {v.label}
                  </Button>
                ))}
              </ButtonGroup>
              {view === "users" && (
              <Button size="sm" variant={compare ? "primary" : "outline-primary"} onClick={() => setCompare((v) => !v)}>
                {compare ? "Hide comparison" : "Compare all apps"}
              </Button>
              )}
              <Button size="sm" variant="outline-secondary" onClick={loadReport} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {view === "users" && (
        <>
      {/* ---------------- Metric cards ---------------- */}
      <Row className="g-3 mb-4">
        {cards.map((card) => {
          const active = card.segment && card.segment === segment;
          return (
            <Col key={card.label} xs={6} md={4} xl={2}>
              <Card
                className={`border-0 shadow-sm h-100 ${active ? "border-primary" : ""}`}
                style={{
                  cursor: card.segment ? "pointer" : "default",
                  outline: active ? "2px solid var(--bs-primary)" : "none",
                }}
                onClick={() => card.segment && setSegment(card.segment)}
                title={card.segment ? "Click to list these users" : undefined}
              >
                <Card.Body className="py-3">
                  <div className="text-muted small">{card.label}</div>
                  <div className="fs-3 fw-bold d-flex align-items-center gap-2">
                    {isLoading ? <Spinner animation="border" size="sm" /> : card.value}
                  </div>
                  <div className="text-muted small">{card.hint}</div>
                  {card.segment && (
                    <div className="small text-primary mt-1">
                      {active ? "Showing below" : "View users"}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ---------------- Trend ---------------- */}
      <Row className="g-3 mb-4">
        <Col xs={12} xl={compare ? 7 : 12}>
          <TrendChart
            points={series?.points || []}
            granularity={series?.granularity}
            title={`${report?.app?.name || ""} — ${report?.period?.label || ""}`}
            subtitle={
              isSeriesLoading
                ? "Loading..."
                : series?.granularity === "hour"
                  ? "By hour (IST)"
                  : "By day (IST)"
            }
          />
        </Col>
        {compare && (
          <Col xs={12} xl={5}>
            <AppComparisonChart
              rows={summary?.data || []}
              title="Applications compared"
              subtitle={report?.period?.label}
            />
          </Col>
        )}
      </Row>

      {/* ---------------- All-time context ---------------- */}
      <Card className="shadow-sm mb-4">
        <Card.Body className="d-flex flex-wrap gap-5 py-3">
          <div>
            <div className="text-muted small">Total users (all time)</div>
            <div className="fs-4 fw-bold">{nf.format(m.totalUsers || 0)}</div>
          </div>
          <div>
            <div className="text-muted small">Total verified users (all time)</div>
            <div className="fs-4 fw-bold">{nf.format(m.totalVerifiedUsers || 0)}</div>
          </div>
          <div>
            <div className="text-muted small">Deposit coins issued</div>
            <div className="fs-4 fw-bold">{nf.format(m.depositCoins || 0)}</div>
          </div>
          <div>
          
          </div>
        </Card.Body>
      </Card>

      {/* ---------------- Language breakdown ---------------- */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
            <div>
              <h5 className="mb-1">Users and deposits by language</h5>
              <p className="text-muted small mb-0">
                Users of each language, and what they deposited in{" "}
                {report?.period?.label || "this period"}.
              </p>
            </div>
            {isLanguagesLoading && <Spinner animation="border" size="sm" />}
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle text-nowrap">
              <thead className="table-light">
                <tr>
                  <th>Language</th>
                  <th className="text-end">Total Users</th>
                  <th className="text-end">Joined</th>
                  <th className="text-end">Verified</th>
                  <th className="text-end">Deposit Users</th>
                  <th className="text-end">Deposits</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLanguagesLoading && !languages ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Building language report...
                    </td>
                  </tr>
                ) : !languages?.rows?.length ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No data
                    </td>
                  </tr>
                ) : (
                  languages.rows.map((row) => (
                      <tr key={row.language} className={row.isDeleted ? "text-muted" : ""}>
                        <td className="fw-semibold">
                          {row.language}
                          {row.isDeleted && (
                            <span
                              className="badge bg-secondary ms-2 fw-normal"
                              title="These users deposited, then their account was deleted. The money is still counted; they have no language."
                            >
                              no account
                            </span>
                          )}
                        </td>
                        <td className="text-end">{nf.format(row.totalUsers)}</td>
                        <td className="text-end">{nf.format(row.joinedUsers)}</td>
                        <td className="text-end">{nf.format(row.verifiedUsers)}</td>
                        <td className="text-end">{nf.format(row.depositUsers)}</td>
                        <td className="text-end">{nf.format(row.deposits)}</td>
                        <td className="text-end fw-semibold">{money(row.depositAmount)}</td>
                      </tr>
                  ))
                )}
              </tbody>
              {languages?.totals && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>Total</td>
                    <td className="text-end">{nf.format(languages.totals.totalUsers)}</td>
                    <td className="text-end">{nf.format(languages.totals.joinedUsers)}</td>
                    <td className="text-end">{nf.format(languages.totals.verifiedUsers)}</td>
                    <td className="text-end">{nf.format(languages.totals.depositUsers)}</td>
                    <td className="text-end">{nf.format(languages.totals.deposits)}</td>
                    <td className="text-end">{money(languages.totals.depositAmount)}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ---------------- Users behind the numbers ---------------- */}
      <Card className="shadow-sm mb-4">
        <Card.Body className="pb-0">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="mb-1">
                {userList?.label || "Users"}{" "}
                {userList ? <Badge bg="primary">{nf.format(userList.total)}</Badge> : null}
              </h4>
              <p className="text-muted small mb-3">
                {report?.app?.name} · {report?.period?.label} — click a card above to
                switch which users are listed
              </p>
            </div>

            <div className="d-flex align-items-end gap-2 flex-wrap">
              <div>
                <Form.Label className="small mb-1">Search</Form.Label>
                <Form.Control
                  size="sm"
                  type="search"
                  placeholder="Name, phone or member ID"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ minWidth: 220 }}
                />
              </div>
              <div>
                <Form.Label className="small mb-1">Rows</Form.Label>
                <Form.Select
                  size="sm"
                  value={userLimit}
                  onChange={(e) => {
                    setUserLimit(Number(e.target.value));
                    setUserPage(1);
                  }}
                  style={{ width: 90 }}
                >
                  {[20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Form.Select>
              </div>
              {isUsersLoading && <Spinner animation="border" size="sm" className="mb-2" />}
            </div>
          </div>
        </Card.Body>

        <Table responsive hover className="text-nowrap mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Member ID</th>
              <th>Verified</th>
              <th className="text-end">Coin Balance</th>
              {segment === "deposited" && <th className="text-end">Deposits</th>}
              {segment === "deposited" && <th className="text-end">Amount</th>}
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {isUsersLoading && !userList?.data?.length ? (
              <tr>
                <td colSpan={segment === "deposited" ? 9 : 7} className="text-center py-4 text-muted">
                  Loading users...
                </td>
              </tr>
            ) : !userList?.data?.length ? (
              <tr>
                <td colSpan={segment === "deposited" ? 9 : 7} className="text-center py-4 text-muted">
                  No users found for this selection.
                </td>
              </tr>
            ) : (
              userList.data.map((user, index) => (
                <tr key={user._id}>
                  <td className="text-muted">
                    {(userList.page - 1) * userList.limit + index + 1}
                  </td>
                  <td className="fw-semibold">{user.name || "-"}</td>
                  <td>{user.phone || "-"}</td>
                  <td className="text-muted small">{user.memberID || "-"}</td>
                  <td>
                    <Badge bg={user.isVerified ? "success" : "secondary"}>
                      {user.isVerified ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="text-end">{nf.format(user.coinBalance)}</td>
                  {segment === "deposited" && (
                    <td className="text-end">{nf.format(user.depositsInPeriod)}</td>
                  )}
                  {segment === "deposited" && (
                    <td className="text-end">{money(user.depositAmountInPeriod)}</td>
                  )}
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString("en-GB", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {userList?.totalPages > 1 && (
          <TablePagination
            currentPage={userList.page}
            totalPages={userList.totalPages}
            onPageChange={(page) => setUserPage(page)}
          />
        )}
      </Card>

      {/* ---------------- Comparison ---------------- */}
      {compare && (
        <Card className="shadow-sm">
          <Card.Body className="d-flex align-items-center justify-content-between pb-0">
            <div>
              <h4 className="mb-1">All Applications</h4>
              <p className="text-muted small mb-3">
                Same period, every registered app{isSummaryLoading ? " · loading..." : ""}
              </p>
            </div>
            <Button size="sm" variant="outline-secondary" onClick={loadSummary} disabled={isSummaryLoading}>
              {isSummaryLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </Card.Body>
          <Table responsive className="text-nowrap mb-0 align-middle">
            <thead className="table-light">
              <tr>
                {COLUMNS.map(([label], i) => (
                  <th key={label} className={i === 0 ? "" : "text-end"}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isSummaryLoading && !summary ? (
                <tr><td colSpan={COLUMNS.length} className="text-center py-4">Building comparison...</td></tr>
              ) : !summary?.data?.length ? (
                <tr><td colSpan={COLUMNS.length} className="text-center py-4">No data</td></tr>
              ) : (
                summary.data.map((row) => (
                  <tr
                    key={row.app.id}
                    className={row.app.id === appName ? "table-active" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => setAppName(row.app.id)}
                  >
                    {COLUMNS.map(([label, get], i) => (
                      <td key={label} className={i === 0 ? "fw-semibold" : "text-end"}>{get(row)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {summary?.totals && (
              <tfoot className="table-light fw-bold">
                <tr>
                  <td>All apps</td>
                  <td className="text-end">{nf.format(summary.totals.joinedUsers)}</td>
                  <td className="text-end">{nf.format(summary.totals.joinedVerifiedUsers)}</td>
                  <td className="text-end">{nf.format(summary.totals.depositUsers)}</td>
                  <td className="text-end">{nf.format(summary.totals.deposits)}</td>
                  <td className="text-end">{money(summary.totals.depositAmount)}</td>
                  <td className="text-end">{nf.format(summary.totals.callingUsers)}</td>
                  <td className="text-end">{nf.format(summary.totals.freeCallUsers)}</td>
                  <td className="text-end">{nf.format(summary.totals.totalUsers)}</td>
                </tr>
              </tfoot>
            )}
          </Table>
        </Card>
      )}
        </>
      )}

      {view === "staff" && (
        <>
      {/* ---------------- Staff report (global) ---------------- */}
      <div className="d-flex align-items-center gap-2 mb-3 mt-5">
        <h3 className="mb-0 text-white">Staff Report</h3>
        <Badge bg="secondary">All apps</Badge>
        {isStaffLoading && <Spinner animation="border" size="sm" />}
      </div>
      <p className="text-muted small">
        Staff and withdrawals are shared across every application, so these figures do
        not change with the Application selector above. Period filter still applies.
      </p>

      <Row className="g-3 mb-4">
        {staffCards.map((card) => {
          const active = card.segment === staffSegment;
          return (
            <Col key={card.label} xs={6} md={4} xl={2}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{ cursor: "pointer", outline: active ? "2px solid var(--bs-primary)" : "none" }}
                onClick={() => setStaffSegment(card.segment)}
                title="Click to list these rows"
              >
                <Card.Body className="py-3">
                  <div className="text-muted small">{card.label}</div>
                  <div className="fs-3 fw-bold d-flex align-items-center gap-2">
                    {isStaffLoading ? <Spinner animation="border" size="sm" /> : card.value}
                  </div>
                  <div className="text-muted small">{card.hint}</div>
                  <div className="small text-primary mt-1">
                    {active ? "Showing below" : "View list"}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body className="pb-0">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="mb-1">
                {staffRows?.label || "Staff"}{" "}
                {staffRows ? <Badge bg="primary">{nf.format(staffRows.total)}</Badge> : null}
              </h4>
              <p className="text-muted small mb-3">{report?.period?.label}</p>
            </div>
            <div className="d-flex align-items-end gap-2 flex-wrap">
              <div>
                <Form.Label className="small mb-1">Search</Form.Label>
                <Form.Control
                  size="sm"
                  type="search"
                  placeholder="Name, phone or member ID"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{ minWidth: 220 }}
                />
              </div>
              <div>
                <Form.Label className="small mb-1">Rows</Form.Label>
                <Form.Select
                  size="sm"
                  value={staffLimit}
                  onChange={(e) => { setStaffLimit(Number(e.target.value)); setStaffPage(1); }}
                  style={{ width: 90 }}
                >
                  {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
              </div>
              {isStaffRowsLoading && <Spinner animation="border" size="sm" className="mb-2" />}
            </div>
          </div>
        </Card.Body>

        <Table responsive hover className="text-nowrap mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Member ID</th>
              {staffRows?.kind === "withdrawals" ? (
                <>
                  <th className="text-end">Requested</th>
                  <th className="text-end">Payout</th>
                  <th>Status</th>
                </>
              ) : (
                <>
                  <th>Verified</th>
                  <th>Approval</th>
                  <th className="text-end">Pending Balance</th>
                </>
              )}
              <th>{staffRows?.kind === "withdrawals" ? "Requested On" : "Registered"}</th>
            </tr>
          </thead>
          <tbody>
            {isStaffRowsLoading && !staffRows?.data?.length ? (
              <tr><td colSpan={8} className="text-center py-4 text-muted">Loading...</td></tr>
            ) : !staffRows?.data?.length ? (
              <tr><td colSpan={8} className="text-center py-4 text-muted">Nothing found for this selection.</td></tr>
            ) : (
              staffRows.data.map((row, index) => (
                <tr key={row._id}>
                  <td className="text-muted">{(staffRows.page - 1) * staffRows.limit + index + 1}</td>
                  <td className="fw-semibold">{row.name || "-"}</td>
                  <td>{row.phone || "-"}</td>
                  <td className="text-muted small">{row.memberID || "-"}</td>
                  {staffRows.kind === "withdrawals" ? (
                    <>
                      <td className="text-end">{money(row.requestedAmount)}</td>
                      <td className="text-end">{money(row.amount)}</td>
                      <td>
                        <Badge bg={row.status === "1" ? "success" : row.status === "2" ? "danger" : "warning"} text={row.status === "0" ? "dark" : undefined}>
                          {row.status === "1" ? "Paid" : row.status === "2" ? "Rejected" : "Pending"}
                        </Badge>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <Badge bg={row.isVerified ? "success" : "secondary"}>
                          {row.isVerified ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={row.isApproved === "1" ? "success" : row.isApproved === "2" ? "danger" : "warning"} text={row.isApproved === "0" ? "dark" : undefined}>
                          {row.isApproved === "1" ? "Approved" : row.isApproved === "2" ? "Rejected" : "Pending"}
                        </Badge>
                      </td>
                      <td className="text-end">{money(row.pendingBalance)}</td>
                    </>
                  )}
                  <td>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString("en-GB", {
                          timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
                          year: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {staffRows?.totalPages > 1 && (
          <TablePagination
            currentPage={staffRows.page}
            totalPages={staffRows.totalPages}
            onPageChange={(page) => setStaffPage(page)}
          />
        )}
      </Card>

        </>
      )}

    </Container>
  );
};

export default AppReportsPage;
