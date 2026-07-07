import { PageHeading } from "@/widgets";
import Link from "next/link";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { GetOverallCallHistoryApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { sortRows } from "@/helper/tableSort";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";

const DEFAULT_LIMIT = 10;

const DEFAULT_FILTERS = {
  callType: "all",
  userMemberID: "",
  staffMemberID: "",
  fromDate: "",
  toDate: "",
};

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

const formatAmount = (value) => ` ${(Number(value) || 0).toFixed(2)}`;

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

const formatCountLabel = (entry) =>
  entry?.date ||
  entry?.day ||
  entry?._id ||
  entry?.month ||
  entry?.label ||
  "-";

const getPersonName = (call, role) =>
  call?.[`${role}Name`] ||
  call?.[role]?.name ||
  call?.[`${role}Id`]?.name ||
  "Unknown";

const getPersonMeta = (call, role) =>
  call?.[`${role}Phone`] ||
  call?.[role]?.phone ||
  call?.[`${role}Id`]?.phone ||
  call?.[role]?.memberID ||
  call?.[`${role}Id`]?.memberID ||
  "-";

const getPersonDetailId = (call, role) => {
  const direct = call?.[`${role}Id`];

  if (direct && typeof direct === "object") {
    return direct?._id || direct?.id || "";
  }

  return (
    call?.[role]?._id ||
    call?.[role]?.id ||
    (typeof direct === "string" ? direct : "") ||
    ""
  );
};

const renderPersonLink = (call, role) => {
  const name = getPersonName(call, role);
  const id = getPersonDetailId(call, role);
  const href =
    role === "staff" ? `/staff-management/${id}` : `/user-management/${id}`;

  return id ? (
    <Link href={href} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    <strong>{name}</strong>
  );
};

const getCallBadge = (type) => {
  if (type === "audio") return "primary";
  if (type === "video") return "danger";
  if (type === "chat") return "success";
  return "secondary";
};

const OverallCallHistoryPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [history, setHistory] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    chat: 0,
    audio: 0,
    video: 0,
  });
  const [dayWiseCounts, setDayWiseCounts] = useState([]);
  const [monthWiseCounts, setMonthWiseCounts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput, setCurrentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextFilters = {
        ...filters,
        userMemberID: filters.userMemberID.trim(),
        staffMemberID: filters.staffMemberID.trim(),
      };

      setDebouncedFilters((previousFilters) =>
        previousFilters.callType === nextFilters.callType &&
        previousFilters.userMemberID === nextFilters.userMemberID &&
        previousFilters.staffMemberID === nextFilters.staffMemberID &&
        previousFilters.fromDate === nextFilters.fromDate &&
        previousFilters.toDate === nextFilters.toDate
          ? previousFilters
          : nextFilters
      );
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [filters, setCurrentPage]);

  const fetchCallHistory = useCallback(async () => {
    setIsLoading(true);
    const activeFilters = debouncedFilters;

    const params = {
      page: currentPage,
      limit: DEFAULT_LIMIT,
      timezone,
      callType: activeFilters.callType,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (activeFilters.userMemberID) {
      params.userMemberID = activeFilters.userMemberID;
    }
    if (activeFilters.staffMemberID) {
      params.staffMemberID = activeFilters.staffMemberID;
    }
    if (activeFilters.fromDate) {
      params.fromDate = activeFilters.fromDate;
      params.startDate = activeFilters.fromDate;
    }
    if (activeFilters.toDate) {
      params.toDate = activeFilters.toDate;
      params.endDate = activeFilters.toDate;
    }

    await dispatch(
      GetOverallCallHistoryApi(params, (resp) => {
        const isSuccess = Boolean(resp?.success ?? resp?.status);
        const payload = resp || {};
        const list = Array.isArray(payload?.data)
          ? payload.data
          : getNestedValue(
              payload,
              ["data.history", "history", "list", "callHistory", "calls"],
              []
            );
        const nextCounts = getNestedValue(payload, ["counts", "data.counts"], {});
        const nextPagination = getNestedValue(
          payload,
          ["pagination", "data.pagination", "meta", "data.meta"],
          {}
        );

        if (isSuccess) {
          setHistory(Array.isArray(list) ? list : []);
          setCounts({
            total: nextCounts?.total ?? payload?.total ?? 0,
            chat: nextCounts?.chat ?? 0,
            audio: nextCounts?.audio ?? 0,
            video: nextCounts?.video ?? 0,
          });
          setDayWiseCounts(
            getNestedValue(
              payload,
              ["dayWiseCounts", "data.dayWiseCounts", "dailyCounts"],
              []
            )
          );
          setMonthWiseCounts(
            getNestedValue(
              payload,
              ["monthWiseCounts", "data.monthWiseCounts", "monthlyCounts"],
              []
            )
          );
          setPagination({
            page: nextPagination?.page ?? currentPage,
            limit: nextPagination?.limit ?? DEFAULT_LIMIT,
            totalPages:
              nextPagination?.totalPages ??
              nextPagination?.pages ??
              payload?.totalPages ??
              1,
            total:
              nextPagination?.total ??
              nextPagination?.totalRecords ??
              nextCounts?.total ??
              0,
          });
        } else {
          setHistory([]);
          setCounts({ total: 0, chat: 0, audio: 0, video: 0 });
          setDayWiseCounts([]);
          setMonthWiseCounts([]);
          setPagination({
            page: 1,
            limit: DEFAULT_LIMIT,
            totalPages: 1,
            total: 0,
          });
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch overall call history"
          );
        }

        setIsLoading(false);
      })
    );
  }, [currentPage, debouncedFilters, debouncedSearch, dispatch, timezone]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setDebouncedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  const sortedHistory = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) =>
        (currentPage - 1) * DEFAULT_LIMIT + index + 1,
      createdAt: (call) => call?.createdAt || call?.startedAt || "",
      callType: (call) => call?.callType || call?.type || "",
      callDuration: (call) => call?.callDuration ?? call?.duration ?? 0,
      userName: (call) => getPersonName(call, "user"),
      staffName: (call) => getPersonName(call, "staff"),
      userSpentAmount: (call) => call?.userSpentAmount ?? call?.userSpent ?? 0,
      staffEarned: (call) => call?.staffEarned ?? call?.staffEarnedAmount ?? 0,
    };

    return sortRows(
      history.map((call, index) => ({ ...call, __index: index })),
      {
        ...sortConfig,
        getValue: (call) =>
          getValue[sortConfig.key]?.(call, call.__index) ?? "",
      }
    );
  }, [currentPage, history, sortConfig]);

  const statCards = [
    { label: "Total Calls", value: counts.total, subtext: "All call types" },
    { label: "Chat", value: counts.chat, subtext: "Chat sessions" },
    { label: "Audio", value: counts.audio, subtext: "Audio calls" },
    { label: "Video", value: counts.video, subtext: "Video calls" },
  ];

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Overall Call History" />
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <div className="support-stats-grid">
            {statCards.map((stat) => (
              <Card className="support-stat-card" key={stat.label}>
                <p className="support-stat-label">{stat.label}</p>
                <h3 className="support-stat-value">
                  {isLoading ? "-" : stat.value}
                </h3>
                <p className="support-stat-subtext">{stat.subtext}</p>
              </Card>
            ))}
          </div>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <Form className="d-flex flex-wrap align-items-end gap-3">
            <div>
              <Form.Label className="fw-bold">Search</Form.Label>
              <Form.Control
                type="search"
                placeholder="Name, phone, member ID"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div>
              <Form.Label className="fw-bold">Call Type</Form.Label>
              <ButtonGroup className="d-flex">
                {["all", "chat", "audio", "video"].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={
                      filters.callType === type ? "primary" : "outline-primary"
                    }
                    className="text-capitalize"
                    onClick={() => handleFilterChange("callType", type)}
                  >
                    {type}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            <div>
              <Form.Label className="fw-bold">User Member ID</Form.Label>
              <Form.Control
                placeholder="EVER000..."
                value={filters.userMemberID}
                onChange={(event) =>
                  handleFilterChange("userMemberID", event.target.value)
                }
              />
            </div>

            <div>
              <Form.Label className="fw-bold">Staff Member ID</Form.Label>
              <Form.Control
                placeholder="EVER000..."
                value={filters.staffMemberID}
                onChange={(event) =>
                  handleFilterChange("staffMemberID", event.target.value)
                }
              />
            </div>

            <div>
              <Form.Label className="fw-bold">From</Form.Label>
              <Form.Control
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  handleFilterChange("fromDate", event.target.value)
                }
              />
            </div>

            <div>
              <Form.Label className="fw-bold">To</Form.Label>
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
            <Button variant="outline-primary" onClick={fetchCallHistory}>
              Refresh
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col xl={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Day Wise Counts</h5>
            </Card.Header>
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Day</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Chat</th>
                  <th className="text-end">Audio</th>
                  <th className="text-end">Video</th>
                </tr>
              </thead>
              <tbody>
                {dayWiseCounts.length > 0 ? (
                  dayWiseCounts.map((entry, index) => (
                    <tr key={`${formatCountLabel(entry)}-${index}`}>
                      <td>{formatCountLabel(entry)}</td>
                      <td className="text-end">{entry?.total ?? 0}</td>
                      <td className="text-end">{entry?.chat ?? 0}</td>
                      <td className="text-end">{entry?.audio ?? 0}</td>
                      <td className="text-end">{entry?.video ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No day wise counts found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col xl={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Month Wise Counts</h5>
            </Card.Header>
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Month</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Chat</th>
                  <th className="text-end">Audio</th>
                  <th className="text-end">Video</th>
                </tr>
              </thead>
              <tbody>
                {monthWiseCounts.length > 0 ? (
                  monthWiseCounts.map((entry, index) => (
                    <tr key={`${formatCountLabel(entry)}-${index}`}>
                      <td>{formatCountLabel(entry)}</td>
                      <td className="text-end">{entry?.total ?? 0}</td>
                      <td className="text-end">{entry?.chat ?? 0}</td>
                      <td className="text-end">{entry?.audio ?? 0}</td>
                      <td className="text-end">{entry?.video ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No month wise counts found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Body className="pb-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">Call History List</h4>
                  <p className="text-muted mb-0">
                    Showing page {currentPage} of {totalPages}
                    {pagination.total ? `, ${pagination.total} records` : ""}
                  </p>
                </div>
              </div>
            </Card.Body>

            <Table responsive hover className="text-nowrap mb-0 mt-3">
              <thead className="table-light">
                <tr>
                  <th>
                    <SortableHeader
                      label="#"
                      sortKey="serialNumber"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Date"
                      sortKey="createdAt"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Type"
                      sortKey="callType"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Duration"
                      sortKey="callDuration"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="User"
                      sortKey="userName"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Staff"
                      sortKey="staffName"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="User Spent"
                      sortKey="userSpentAmount"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Staff Earned"
                      sortKey="staffEarned"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading call history...
                    </td>
                  </tr>
                ) : sortedHistory.length > 0 ? (
                  sortedHistory.map((call, index) => {
                    const callType = call?.callType || call?.type || "-";

                    return (
                      <tr key={call?._id || `${call?.createdAt}-${index}`}>
                        <td>{(currentPage - 1) * DEFAULT_LIMIT + index + 1}</td>
                        <td>{formatDateTime(call?.createdAt || call?.startedAt)}</td>
                        <td>
                          <Badge bg={getCallBadge(callType)}>{callType}</Badge>
                        </td>
                        <td>
                          {formatDuration(call?.callDuration ?? call?.duration)}
                        </td>
                        <td>
                          <div className="support-ticket-summary">
                            {renderPersonLink(call, "user")}
                            <span className="text-muted small">
                              {getPersonMeta(call, "user")}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="support-ticket-summary">
                            {renderPersonLink(call, "staff")}
                            <span className="text-muted small">
                              {getPersonMeta(call, "staff")}
                            </span>
                          </div>
                        </td>
                        <td className="text-danger">
                          {formatAmount(
                            call?.userSpentAmount ?? call?.userSpent
                          )}
                        </td>
                        <td className="text-success">
                          {formatAmount(
                            call?.staffEarned ?? call?.staffEarnedAmount
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      No call history found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                if (page < 1 || page > totalPages || page === currentPage) {
                  return;
                }

                setCurrentPage(page);
              }}
            />
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OverallCallHistoryPage;
