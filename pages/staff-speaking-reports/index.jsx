import { PageHeading } from "@/widgets";
import Link from "next/link";
import TablePagination from "@/components/TablePagination";
import useUrlPageState from "@/hooks/useUrlPageState";
import apiHelper from "@/helper/apiHelper";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";

const PAGE_LIMIT = 20;

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
  { key: "all", label: "All Time" },
];

const GRANULARITIES = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

const DEFAULT_FILTERS = {
  period: "today",
  callType: "all",
  staffMemberID: "",
  fromDate: "",
  toDate: "",
  granularity: "day",
};

const nf = new Intl.NumberFormat("en-IN");

const formatAmount = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

// Seconds -> "2h 43m 11s". Hours are shown only once there are any, so a short
// call does not read as "0h 0m 12s".
const formatDuration = (value) => {
  const total = Math.max(Math.round(Number(value) || 0), 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// "2026-W39" -> "Week 39, 2026"; "2026-09" -> "September 2026"; a date is left
// as a readable day.
const formatBucket = (bucket, granularity) => {
  const value = String(bucket || "");
  if (granularity === "week") {
    const [year, week] = value.split("-W");
    return `Week ${week}, ${year}`;
  }
  if (granularity === "month") {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
};

const StaffSpeakingReportsPage = () => {
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useUrlPageState();

  // Responses can land out of order when filters change quickly; only the newest
  // request is allowed to write state.
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setCurrentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters, setCurrentPage]);

  const fetchReport = useCallback(async () => {
    const active = debouncedFilters;
    const requestId = ++requestRef.current;
    setIsLoading(true);

    const params = new URLSearchParams({
      period: active.period,
      granularity: active.granularity,
      page: String(currentPage),
      limit: String(PAGE_LIMIT),
    });

    // A custom range is the only period that carries dates; sending them with a
    // preset would be ignored anyway and just muddies the cache key.
    if (active.period === "custom") {
      if (active.fromDate) params.set("from", active.fromDate);
      if (active.toDate) params.set("to", active.toDate);
    }
    if (active.callType && active.callType !== "all") params.set("callType", active.callType);
    if (active.staffMemberID) params.set("staffMemberID", active.staffMemberID.trim());
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const resp = await apiHelper.getRequest(`staff-speaking-report?${params.toString()}`);
      if (requestId !== requestRef.current) return;

      if (resp?.status) {
        setReport(resp.data || null);
      } else {
        setReport(null);
        Notiflix.Notify.failure(resp?.message || "Failed to fetch staff speaking reports");
      }
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [currentPage, debouncedFilters, debouncedSearch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Picking a date is what the Custom period is for, so choosing one selects
      // it rather than silently doing nothing.
      if ((key === "fromDate" || key === "toDate") && value) next.period = "custom";
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setDebouncedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const totals = report?.totals;
  const rows = report?.rows || [];
  const buckets = report?.buckets || [];
  const granularity = report?.granularity || filters.granularity;
  const totalPages = report?.pagination?.totalPages || 1;
  const topStaff = currentPage === 1 ? rows[0] : null;

  const statCards = [
    {
      label: "Total Calls",
      value: nf.format(totals?.calls || 0),
      subtext: report?.period?.label || "Matching current filters",
    },
    {
      label: "Speaking Time",
      value: formatDuration(totals?.seconds || 0),
      subtext: "Every matching call, not a sample",
    },
    {
      label: "Active Staff",
      value: nf.format(totals?.activeStaff || 0),
      subtext: `Avg ${formatDuration(totals?.averageSecondsPerStaff || 0)} each`,
    },
    {
      label: "Staff Earned",
      value: formatAmount(totals?.earned || 0),
      subtext: `${nf.format(totals?.audio?.calls || 0)} audio · ${nf.format(
        totals?.video?.calls || 0
      )} video · ${nf.format(totals?.chat?.calls || 0)} chat`,
    },
  ];

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Staff Speaking Reports" />
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <div className="support-stats-grid">
            {statCards.map((stat) => (
              <Card className="support-stat-card" key={stat.label}>
                <p className="support-stat-label">{stat.label}</p>
                <h3 className="support-stat-value">{isLoading && !report ? "-" : stat.value}</h3>
                <p className="support-stat-subtext">{stat.subtext}</p>
              </Card>
            ))}
          </div>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} lg={7}>
              <Form.Label className="fw-bold small mb-1">Period</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {PERIODS.map((period) => (
                  <Button
                    key={period.key}
                    size="sm"
                    variant={filters.period === period.key ? "primary" : "outline-primary"}
                    onClick={() => handleFilterChange("period", period.key)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </Col>

            <Col xs={12} lg={5}>
              <Form.Label className="fw-bold small mb-1">Breakdown</Form.Label>
              <ButtonGroup className="d-flex">
                {GRANULARITIES.map((item) => (
                  <Button
                    key={item.key}
                    size="sm"
                    variant={
                      filters.granularity === item.key ? "secondary" : "outline-secondary"
                    }
                    onClick={() => handleFilterChange("granularity", item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Form.Label className="fw-bold small mb-1">Search</Form.Label>
              <Form.Control
                type="search"
                placeholder="Staff name, phone, member ID"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Form.Label className="fw-bold small mb-1">Call Type</Form.Label>
              <ButtonGroup className="d-flex">
                {["all", "chat", "audio", "video"].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filters.callType === type ? "primary" : "outline-primary"}
                    className="text-capitalize"
                    onClick={() => handleFilterChange("callType", type)}
                  >
                    {type}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>

            <Col xs={6} md={4} lg={2}>
              <Form.Label className="fw-bold small mb-1">Staff Member ID</Form.Label>
              <Form.Control
                placeholder="EVER000..."
                value={filters.staffMemberID}
                onChange={(event) => handleFilterChange("staffMemberID", event.target.value)}
              />
            </Col>

            <Col xs={6} md={4} lg={2}>
              <Form.Label className="fw-bold small mb-1">From</Form.Label>
              <Form.Control
                type="date"
                value={filters.fromDate}
                max={filters.toDate || undefined}
                onChange={(event) => handleFilterChange("fromDate", event.target.value)}
              />
            </Col>

            <Col xs={6} md={4} lg={2}>
              <Form.Label className="fw-bold small mb-1">To</Form.Label>
              <Form.Control
                type="date"
                value={filters.toDate}
                min={filters.fromDate || undefined}
                onChange={(event) => handleFilterChange("toDate", event.target.value)}
              />
            </Col>

            <Col xs={12} className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="text-muted small">
                {report?.period?.label ? `Showing ${report.period.label}` : ""}
                {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
              </span>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="outline-primary" size="sm" onClick={fetchReport} disabled={isLoading}>
                  Refresh
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ---------------- Day / week / month breakdown ---------------- */}
      <Card className="mt-4">
        <Card.Body className="pb-0">
          <h4 className="mb-1">
            {GRANULARITIES.find((g) => g.key === granularity)?.label} breakdown
          </h4>
          <p className="text-muted mb-0">
            Every call in {report?.period?.label || "this period"}, grouped by{" "}
            {granularity}. Times are IST.
          </p>
        </Card.Body>

        <Table responsive hover className="text-nowrap mb-0 mt-3">
          <thead className="table-light">
            <tr>
              <th>{granularity === "day" ? "Date" : granularity === "week" ? "Week" : "Month"}</th>
              <th className="text-end">Calls</th>
              <th className="text-end">Speaking Time</th>
              <th className="text-end">Active Staff</th>
              <th className="text-end">Audio</th>
              <th className="text-end">Video</th>
              <th className="text-end">Chat</th>
              <th className="text-end">Earned</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !report ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Building breakdown...
                </td>
              </tr>
            ) : buckets.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No calls in this period
                </td>
              </tr>
            ) : (
              buckets.map((bucket) => (
                <tr key={bucket.bucket}>
                  <td className="fw-semibold">{formatBucket(bucket.bucket, granularity)}</td>
                  <td className="text-end">{nf.format(bucket.calls)}</td>
                  <td className="text-end">{formatDuration(bucket.seconds)}</td>
                  <td className="text-end">{nf.format(bucket.activeStaff)}</td>
                  <td className="text-end">{nf.format(bucket.audio.calls)}</td>
                  <td className="text-end">{nf.format(bucket.video.calls)}</td>
                  <td className="text-end">{nf.format(bucket.chat.calls)}</td>
                  <td className="text-end text-success">{formatAmount(bucket.earned)}</td>
                </tr>
              ))
            )}
          </tbody>
          {buckets.length > 0 && totals && (
            <tfoot className="table-light fw-bold">
              <tr>
                <td>Total</td>
                <td className="text-end">{nf.format(totals.calls)}</td>
                <td className="text-end">{formatDuration(totals.seconds)}</td>
                <td className="text-end">{nf.format(totals.activeStaff)}</td>
                <td className="text-end">{nf.format(totals.audio.calls)}</td>
                <td className="text-end">{nf.format(totals.video.calls)}</td>
                <td className="text-end">{nf.format(totals.chat.calls)}</td>
                <td className="text-end">{formatAmount(totals.earned)}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>

      {/* ---------------- Staff ranking ---------------- */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card>
            <Card.Body className="pb-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">Highest Speaking List</h4>
                  <p className="text-muted mb-0">
                    Page {currentPage} of {totalPages} · {nf.format(totals?.activeStaff || 0)} staff
                    with call activity
                  </p>
                </div>
                {topStaff && (
                  <Badge bg="success">
                    Top: {topStaff.name} — {formatDuration(topStaff.seconds)}
                  </Badge>
                )}
              </div>
            </Card.Body>

            <Table responsive hover className="text-nowrap mb-0 mt-3">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Staff</th>
                  <th>Member ID</th>
                  <th className="text-end">Total Calls</th>
                  <th className="text-end">Speaking Time</th>
                  <th className="text-end">Chat</th>
                  <th className="text-end">Audio</th>
                  <th className="text-end">Video</th>
                  <th className="text-end">Earned</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && !report ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading staff speaking reports...
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((staff) => (
                    <tr key={staff.staffId || staff.memberID}>
                      <td>{staff.rank}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Image
                            src={staff.image || "/images/avatar/avatar.jpg"}
                            alt={staff.name}
                            roundedCircle
                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                          />
                          <div className="support-ticket-summary">
                            {staff.staffId && staff.exists ? (
                              <Link
                                href={`/staff-management/${staff.staffId}`}
                                className="text-decoration-none fw-semibold"
                              >
                                {staff.name}
                              </Link>
                            ) : (
                              <strong>{staff.name}</strong>
                            )}
                            <span className="text-muted small">
                              {staff.phone || "-"}
                              {/* The calls and the earnings are real even when the
                                  staff record is gone, so the row stays. */}
                              {!staff.exists && (
                                <Badge bg="secondary" className="ms-2 fw-normal">
                                  removed
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{staff.memberID || "-"}</td>
                      <td className="text-end">{nf.format(staff.calls)}</td>
                      <td className="text-end">{formatDuration(staff.seconds)}</td>
                      <td className="text-end">{nf.format(staff.chat.calls)}</td>
                      <td className="text-end">{nf.format(staff.audio.calls)}</td>
                      <td className="text-end">{nf.format(staff.video.calls)}</td>
                      <td className="text-end text-success">{formatAmount(staff.earned)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      No staff speaking reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                if (page < 1 || page > totalPages || page === currentPage) return;
                setCurrentPage(page);
              }}
            />
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StaffSpeakingReportsPage;
