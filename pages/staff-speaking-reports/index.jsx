import { PageHeading } from "@/widgets";
import Link from "next/link";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import {
  GetStaffListApi,
  GetSingleStaffApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
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
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";

const FETCH_LIMIT = 10000;
const PAGE_LIMIT = 10;

const DEFAULT_FILTERS = {
  callType: "all",
  staffMemberID: "",
  fromDate: "",
  toDate: "",
};

const formatAmount = (value) => ` ${(Number(value) || 0).toFixed(2)}`;

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

const getStaffKey = (call) =>
  call?.staffId || call?.staffMemberID || call?.staffPhone || "unknown";

const getDateRange = (fromDate, toDate) => {
  const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

  return { from, to };
};

const isCallInRange = (call, fromDate, toDate) => {
  const createdAt = new Date(call?.createdAt || call?.startedAt || "");

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const { from, to } = getDateRange(fromDate, toDate);

  if (from && createdAt < from) {
    return false;
  }

  if (to && createdAt > to) {
    return false;
  }

  return true;
};

const matchesCallType = (call, callType) =>
  callType === "all" ||
  String(call?.callType || "").toLowerCase() === callType;

const calculateStaffEarning = (call) => {
  const duration = Number(call?.callDuration) || 0;
  const minimumDuration = duration > 0 ? Math.max(duration, 60) : 0;
  const callType = String(call?.callType || "").toLowerCase();

  if (callType === "audio") {
    return (minimumDuration / 60) * 5;
  }

  if (callType === "video") {
    return (minimumDuration / 60) * 10;
  }

  if (callType === "chat") {
    return 1.5;
  }

  return 0;
};

const buildStaffSpeakingRows = (history) => {
  const staffMap = new Map();

  history.forEach((call) => {
    const key = getStaffKey(call);
    const previous = staffMap.get(key) || {
      staffId: call?.staffId || "",
      staffName: call?.staffName || "Unknown",
      staffPhone: call?.staffPhone || "-",
      staffEmail: call?.staffEmail || "-",
      staffImage: call?.staffImage || "",
      staffMemberID: call?.staffMemberID || "-",
      totalCalls: 0,
      totalDuration: 0,
      chat: 0,
      audio: 0,
      video: 0,
      staffEarned: 0,
    };

    const callType = String(call?.callType || "").toLowerCase();
    const duration = Number(call?.callDuration) || 0;

    previous.totalCalls += 1;
    previous.totalDuration += duration;
    previous.staffEarned += Number(call?.staffEarned) || 0;

    if (callType === "chat") previous.chat += 1;
    if (callType === "audio") previous.audio += 1;
    if (callType === "video") previous.video += 1;

    staffMap.set(key, previous);
  });

  return Array.from(staffMap.values()).sort(
    (a, b) => b.totalDuration - a.totalDuration || b.totalCalls - a.totalCalls
  );
};

const StaffSpeakingReportsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [history, setHistory] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    chat: 0,
    audio: 0,
    video: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [sortConfig, setSortConfig] = useState({
    key: "totalDuration",
    direction: "desc",
  });

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
        staffMemberID: filters.staffMemberID.trim(),
      };

      setDebouncedFilters((previousFilters) =>
        previousFilters.callType === nextFilters.callType &&
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

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    const activeFilters = debouncedFilters;

    await dispatch(
      GetStaffListApi(
        {
          page: 1,
          limit: FETCH_LIMIT,
          search: debouncedSearch,
        },
        async (resp) => {
        const isSuccess = Boolean(resp?.success ?? resp?.status);

        if (isSuccess) {
          const staffList = Array.isArray(resp?.data) ? resp.data : [];
          const memberFilter = activeFilters.staffMemberID.toLowerCase();
          const filteredStaffList = memberFilter
            ? staffList.filter((staff) =>
                String(staff?.memberID || "").toLowerCase().includes(memberFilter)
              )
            : staffList;

          const detailResults = await Promise.all(
            filteredStaffList.map(async (staff) => {
              const staffId = staff?._id;

              if (!staffId) {
                return null;
              }

                const detailResp = await dispatch(
                  GetSingleStaffApi(staffId, () => {})
                );

                if (!detailResp?.status) {
                  return null;
                }

                const callHistory = Array.isArray(detailResp?.callHistory)
                  ? detailResp.callHistory
                  : [];
                const filteredCalls = callHistory
                  .filter((call) =>
                    isCallInRange(call, activeFilters.fromDate, activeFilters.toDate)
                  )
                  .filter((call) => matchesCallType(call, activeFilters.callType))
                  .map((call) => ({
                    ...call,
                    staffId,
                    staffName: detailResp?.data?.name || staff?.name || "Unknown",
                    staffPhone: detailResp?.data?.phone || staff?.phone || "-",
                    staffEmail: detailResp?.data?.email || staff?.email || "-",
                    staffImage: detailResp?.data?.image || staff?.image || "",
                    staffMemberID:
                      detailResp?.data?.memberID || staff?.memberID || "-",
                    staffEarned:
                      Number(
                        call?.staffEarned ??
                          call?.calculatedEarned ??
                          call?.staffEarnedAmount
                      ) || calculateStaffEarning(call),
                  }));
                const isFullStaffRange =
                  activeFilters.callType === "all" &&
                  filteredCalls.length === callHistory.length;

                return {
                  staffId,
                  calls: isFullStaffRange
                    ? filteredCalls.map((call, index) => ({
                        ...call,
                        staffEarned:
                          index === 0
                            ? Number(detailResp?.data?.staffEarned) || 0
                            : 0,
                      }))
                    : filteredCalls,
                };
              })
            );

          const nextHistory = detailResults.flatMap((detail) =>
            Array.isArray(detail?.calls) ? detail.calls : []
          );
          const nextCounts = nextHistory.reduce(
            (acc, call) => {
              const callType = String(call?.callType || "").toLowerCase();

              acc.total += 1;
              if (callType === "chat") acc.chat += 1;
              if (callType === "audio") acc.audio += 1;
              if (callType === "video") acc.video += 1;

              return acc;
            },
            { total: 0, chat: 0, audio: 0, video: 0 }
          );

          setHistory(nextHistory);
          setCounts(nextCounts);
        } else {
          setHistory([]);
          setCounts({ total: 0, chat: 0, audio: 0, video: 0 });
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch staff speaking reports"
          );
        }

        setIsLoading(false);
      }
      )
    );
  }, [debouncedFilters, debouncedSearch, dispatch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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

  const speakingRows = useMemo(() => buildStaffSpeakingRows(history), [history]);

  const sortedRows = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => index + 1,
      staffName: (staff) => staff.staffName || "",
      staffMemberID: (staff) => staff.staffMemberID || "",
      totalCalls: (staff) => staff.totalCalls || 0,
      totalDuration: (staff) => staff.totalDuration || 0,
      chat: (staff) => staff.chat || 0,
      audio: (staff) => staff.audio || 0,
      video: (staff) => staff.video || 0,
      staffEarned: (staff) => staff.staffEarned || 0,
    };

    return sortRows(
      speakingRows.map((staff, index) => ({ ...staff, __index: index })),
      {
        ...sortConfig,
        getValue: (staff) =>
          getValue[sortConfig.key]?.(staff, staff.__index) ?? "",
      }
    );
  }, [speakingRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_LIMIT));
  const pageStart = (currentPage - 1) * PAGE_LIMIT;
  const paginatedRows = sortedRows.slice(pageStart, pageStart + PAGE_LIMIT);

  const topStaff = sortedRows[0];
  const totalDuration = speakingRows.reduce(
    (total, staff) => total + staff.totalDuration,
    0
  );

  const statCards = [
    {
      label: "Total Calls",
      value: counts.total,
      subtext: "Matching current filters",
    },
    {
      label: "Speaking Time",
      value: formatDuration(totalDuration),
      subtext: "Loaded staff duration",
    },
    {
      label: "Active Staff",
      value: speakingRows.length,
      subtext: "Staff with call activity",
    },
    {
      label: "Top Staff",
      value: topStaff?.staffName || "-",
      subtext: topStaff ? formatDuration(topStaff.totalDuration) : "No data",
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
                placeholder="Staff name, phone, member ID"
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
            <Button variant="outline-primary" onClick={fetchReport}>
              Refresh
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Body className="pb-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">Highest Speaking List</h4>
                  <p className="text-muted mb-0">
                    Showing page {currentPage} of {totalPages},{" "}
                    {sortedRows.length} staff
                  </p>
                </div>
                <Badge bg="secondary">Fetched limit: {FETCH_LIMIT}</Badge>
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
                      label="Staff"
                      sortKey="staffName"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Member ID"
                      sortKey="staffMemberID"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Total Calls"
                      sortKey="totalCalls"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Speaking Time"
                      sortKey="totalDuration"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Chat"
                      sortKey="chat"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Audio"
                      sortKey="audio"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Video"
                      sortKey="video"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Earned"
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
                    <td colSpan="9" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading staff speaking reports...
                    </td>
                  </tr>
                ) : paginatedRows.length > 0 ? (
                  paginatedRows.map((staff, index) => (
                    <tr key={staff.staffId || staff.staffMemberID || index}>
                      <td>{pageStart + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Image
                            src={staff.staffImage || "/images/avatar/avatar.jpg"}
                            alt={staff.staffName}
                            roundedCircle
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                            }}
                          />
                          <div className="support-ticket-summary">
                            {staff.staffId ? (
                              <Link
                                href={`/staff-management/${staff.staffId}`}
                                className="text-decoration-none fw-semibold"
                              >
                                {staff.staffName}
                              </Link>
                            ) : (
                              <strong>{staff.staffName}</strong>
                            )}
                            <span className="text-muted small">
                              {staff.staffPhone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{staff.staffMemberID}</td>
                      <td>{staff.totalCalls}</td>
                      <td>{formatDuration(staff.totalDuration)}</td>
                      <td>{staff.chat}</td>
                      <td>{staff.audio}</td>
                      <td>{staff.video}</td>
                      <td className="text-success">
                        {formatAmount(staff.staffEarned)}
                      </td>
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

export default StaffSpeakingReportsPage;
