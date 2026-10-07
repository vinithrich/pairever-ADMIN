import { PageHeading } from "@/widgets";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Col, Row, Container, Form, Card, Table, Button } from "react-bootstrap";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { sortRows } from "@/helper/tableSort";
import { getSocket } from "@/helper/socket";
import { getRequest, postRequest } from "@/helper/apiHelper";
import { errorToast, successToast } from "@/components/custom-toast";

// Helper function to format the staff's earnings cleanly to two decimal places.
const formatAmount = (value) => (Number(value) || 0).toFixed(2);

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

const OnlineStaffPage = () => {
  const router = useRouter();

  // State containing the complete list of staff returned by the presence service.
  const [rawStaffList, setRawStaffList] = useState([]);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [searchQuery, setSearchQuery] = useState("");
  // all | available | busy. The roster already carries isBusy, so this filters the
  // in-memory list — no refetch, and it stays correct as the socket pushes updates.
  const [availability, setAvailability] = useState("all");
  // memberID -> { staffEarned, pendingBalance }. Fetched separately because the
  // socket roster is broadcast to users too, so it must not carry staff earnings.
  const [earnings, setEarnings] = useState({});
  // Rows with a status change in flight, so a switch cannot be double-clicked.
  const [pendingIds, setPendingIds] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [leadsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();

  // Force a staff online/offline.
  //
  // This calls setStaffOnlineStatus, NOT updateStaff. updateStaff only writes the
  // isOnline column, while the list is built from Redis presence — so the old call
  // changed nothing and the switch snapped back on the next broadcast.
  const handleToggleOnline = async (user) => {
    if (pendingIds.includes(user._id)) return;

    const nextOnline = !user.isOnline;
    setPendingIds((prev) => [...prev, user._id]);

    // Optimistic: the switch should move at once. The authoritative list arrives
    // moments later over the socket; on failure we put the row back as it was.
    setRawStaffList((prev) =>
      nextOnline
        ? prev.map((s) => (s._id === user._id ? { ...s, isOnline: true } : s))
        : prev.filter((s) => s._id !== user._id),
    );

    try {
      const resp = await postRequest("setStaffOnlineStatus", {
        staffId: user._id,
        isOnline: nextOnline,
      });

      if (resp && resp.status === true) {
        successToast(resp.message || "Staff status updated");
      } else {
        errorToast(resp?.message || "Failed to update staff status");
        if (!nextOnline) setRawStaffList((prev) => [{ ...user }, ...prev]);
      }
    } catch (err) {
      errorToast("Network error occurred while updating status");
      if (!nextOnline) setRawStaffList((prev) => [{ ...user }, ...prev]);
      console.error("[OnlineStaff] Toggle error:", err.message);
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== user._id));
    }
  };

  // Connect to the shared Socket.io service and request the live staff roster.
  // WHY: This handles establishing the event listeners and emitting the query on mount.
  // WHAT PROBLEM IT SOLVES: Establishes a persistent subscription to live online staff updates
  // from the backend Redis cache and handles automatic reconnect syncs.
  // HOW IT WORKS: Registers listeners for connection state and data events. Emits "get_all_staff"
  // to ask for the data payload. On unmount, only cleans up the registered event listeners
  // (leaving the socket connected as it's shared globally).
  useEffect(() => {
    const socket = getSocket();

    // Event listener for receiving the live staff data.
    const handleStaffData = (payload) => {
      console.log("[Socket.io] Received 'all_staff_data' payload:", payload);

      // Extract only the array from the payload before updating the React state.
      // WHY: The backend might return an object like { status: true, data: [...] } or { success: true, staff: [...] }
      // instead of a raw array.
      // WHAT PROBLEM IT SOLVES: Prevents the application from crashing if the payload isn't a flat array.
      // HOW IT WORKS: Checks if the payload itself is an array. If not, searches for array fields
      // like 'data' or 'staff', or auto-discovers any array property inside the payload object.
      let extractedArray = [];
      if (Array.isArray(payload)) {
        extractedArray = payload;
      } else if (payload && Array.isArray(payload.data)) {
        extractedArray = payload.data;
      } else if (payload && Array.isArray(payload.staff)) {
        extractedArray = payload.staff;
      } else if (payload && typeof payload === "object") {
        const arrayField = Object.values(payload).find((val) => Array.isArray(val));
        if (arrayField) {
          extractedArray = arrayField;
        }
      }

      // Log the first few objects of payload.data to inspect the raw data structure.
      console.log("[Socket.io] First few staff objects from backend:", extractedArray.slice(0, 5));

      // Filter the staff list to display ONLY online staff.
      // WHY: The backend event "get_all_staff" returns the complete list of all staff members (both online and offline).
      // WHAT PROBLEM IT SOLVES: Restricts the displayed items to only those who are actively online.
      // HOW IT WORKS: Filters the extracted array, keeping only objects where 'isOnline' is strictly true.
      const onlineStaff = extractedArray.filter((staff) => staff && staff.isOnline === true);
      setRawStaffList(onlineStaff);
      setLastUpdated(new Date());
      setIsConnected(true);
    };

    // Re-request the staff list if the socket reconnects.
    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("get_all_staff");
    };

    const handleDisconnect = () => setIsConnected(false);

    // Register active event listeners.
    socket.on("all_staff_data", handleStaffData);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Establish the connection. If already connected, immediately emit the data request.
    socket.connect();
    if (socket.connected) {
      socket.emit("get_all_staff");
    }

    // Clean up event listeners on unmount.
    // The shared socket remains connected so other pages are not broken.
    return () => {
      socket.off("all_staff_data", handleStaffData);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const loadEarnings = useCallback(async () => {
    const resp = await getRequest("online-staff-earnings");
    if (resp?.status) setEarnings(resp.data || {});
  }, []);

  // On mount, and again whenever the roster changes size — someone coming online
  // needs their figure too.
  useEffect(() => {
    loadEarnings();
  }, [loadEarnings, rawStaffList.length]);

  const earnedFor = (user) =>
    earnings[user?.memberID]?.staffEarned ?? user?.staffEarned ?? 0;

  const busyCount = rawStaffList.filter((s) => s.isBusy).length;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const selectAvailability = (value) => {
    setAvailability(value);
    // Page 3 of "all" is rarely page 3 of "busy".
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

  // Filter the raw staff list based on the search query.
  // WHY: Allows the administrator to find specific online staff members by name, phone, etc.
  // WHAT PROBLEM IT SOLVES: Enables client-side real-time filtering without sending REST requests.
  // HOW IT WORKS: Computes in-memory matches against Name, Phone, Gender, Language, and memberID.
  // Defensive check Array.isArray(...) ensures the component never crashes if the state is temporarily malformed.
  const filteredStaff = useMemo(() => {
    const list = Array.isArray(rawStaffList) ? rawStaffList : [];
    return list.filter((user) => {
      if (!user) return false;

      if (availability === "busy" && !user.isBusy) return false;
      if (availability === "available" && user.isBusy) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (user.name || "").toLowerCase();
        const phone = (user.phone || "").toLowerCase();
        const gender = (user.gender || "").toLowerCase();
        const language = (user.language || "").toLowerCase();
        const memberID = (user.memberID || "").toLowerCase();
        return (
          name.includes(query) ||
          phone.includes(query) ||
          gender.includes(query) ||
          language.includes(query) ||
          memberID.includes(query)
        );
      }
      return true;
    });
  }, [availability, rawStaffList, searchQuery]);

  // Sort the filtered staff roster based on the selected table headers.
  // WHY: Provides custom columns sorting capability.
  // WHAT PROBLEM IT SOLVES: Restores sorting control for the in-memory socket list.
  // HOW IT WORKS: Maps list attributes and delegates sorting to the tableSort helper.
  const sortedStaff = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => index + 1,
      memberID: (user) => user.memberID || "",
      name: (user) => user.name || "",
      phone: (user) => user.phone || "",
      dob: (user) => user.dob || "",
      staffEarned: (user) => earnedFor(user),
      isBusy: (user) => (user.isBusy ? 1 : 0),
      status: (user) => (user.isOnline ? 1 : 0),
      createdAt: (user) => user.createdAt || "",
    };

    return sortRows(
      filteredStaff.map((user, index) => ({ ...user, __index: index })),
      {
        ...sortConfig,
        getValue: (user) =>
          getValue[sortConfig.key]?.(user, user.__index) ?? "",
      }
    );
  }, [filteredStaff, sortConfig]);

  // Slice the sorted staff roster to display only the current page elements.
  // WHY: Handles pagination dynamically on the client-side.
  // WHAT PROBLEM IT SOLVES: Eliminates the need for API-based offset/limit calls.
  // HOW IT WORKS: Extracts slice indexes using currentPage and leadsPerPage constants.
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * leadsPerPage;
    return sortedStaff.slice(startIndex, startIndex + leadsPerPage);
  }, [sortedStaff, currentPage, leadsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredStaff.length / leadsPerPage) || 1;
  }, [filteredStaff.length, leadsPerPage]);

  // Adjust pagination current page if the list size shrinks below the current page offset.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
          style={{ cursor: "pointer" }}
        ></i>
        <PageHeading heading="Online Staff" />
      </div>

      {/* Live counts, straight from the socket roster. */}
      <Row className="g-3 mb-4">
        {[
          { key: "all", label: "Online now", value: rawStaffList.length, cls: "text-success" },
          { key: "busy", label: "On a call", value: busyCount, cls: "text-danger" },
          { key: "available", label: "Available", value: rawStaffList.length - busyCount, cls: "" },
        ].map((card) => {
          const isActive = availability === card.key;
          return (
            <Col key={card.key} xs={6} md={3}>
              {/* The cards already name the three states, so they are the filter —
                  one control instead of a card row plus a redundant dropdown. */}
              <Card
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => selectAvailability(card.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectAvailability(card.key);
                  }
                }}
                className={`shadow-sm h-100 ${isActive ? "border-primary" : "border-0"}`}
                style={{ cursor: "pointer", borderWidth: isActive ? 2 : undefined }}
              >
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="text-muted small">{card.label}</div>
                    {isActive && <Badge bg="primary">Showing</Badge>}
                  </div>
                  <div className={`fs-3 fw-bold ${card.cls}`}>{card.value}</div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <div className="d-flex justify-content-between w-100 align-items-end flex-wrap gap-3">
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

          <div>
            <Form.Label className="text-white fw-bold">Show</Form.Label>
            <Form.Select
              value={availability}
              onChange={(e) => selectAvailability(e.target.value)}
            >
              <option value="all">All online ({rawStaffList.length})</option>
              <option value="available">Available ({rawStaffList.length - busyCount})</option>
              <option value="busy">On a call ({busyCount})</option>
            </Form.Select>
          </div>
        </Form>

        {/* This list is pushed over a socket, so say plainly whether it is live. */}
        <div className="d-flex align-items-center gap-3">
          <span className={isConnected ? "text-success" : "text-warning"}>
            ● {isConnected ? "Live" : "Reconnecting..."}
          </span>
          {lastUpdated && (
            <span className="text-white-50 small">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              getSocket().emit("get_all_staff");
              loadEarnings();
            }}
          >
            Refresh
          </Button>
        </div>
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
                  <th><SortableHeader label="DOB" sortKey="dob" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Staff Earned" sortKey="staffEarned" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Busy" sortKey="isBusy" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Created At" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>

              <tbody>
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((user, i) => (
                    <tr key={user._id || i}>
                      <td>
                        {(currentPage - 1) * leadsPerPage + i + 1}
                      </td>
                      <td>{user.memberID || "-"}</td>
                      <td>
                        {user._id ? (
                          <Link
                             href={`/staff-management/${user._id}`}
                            className="text-decoration-none fw-semibold"
                          >
                            {user.name || "-"}
                          </Link>
                        ) : (
                          user.name || "-"
                        )}
                      </td>
                      <td>{user.phone || "-"}</td>
                      <td>{user.dob || "-"}</td>
                      <td>{formatAmount(earnedFor(user))}</td>
                      <td>
                        <span className={`badge ${user.isBusy ? "bg-danger" : "bg-success"}`}>
                          {user.isBusy ? "True" : "False"}
                        </span>
                      </td>
                      <td>
                        <Form.Check
                          type="switch"
                          id={`online-switch-${user._id}`}
                          checked={user.isOnline}
                          disabled={pendingIds.includes(user._id)}
                          title={
                            user.isOnline
                              ? "Set offline — removes them from the list users see"
                              : "Set online"
                          }
                          onChange={() => handleToggleOnline(user)}
                        />
                      </td>
                      <td>
                        {user.createdAt
                          ? formatDateTime(user.createdAt)
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No Online Staff Found
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

export default OnlineStaffPage;
