import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import TablePagination from "@/components/TablePagination";
import {
  GetSupportTicketByIdApi,
  GetSupportTicketDashboardApi,
  GetSupportTicketListApi,
  UpdateSupportTicketApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const DEFAULT_DASHBOARD = {
  totalTickets: 0,
  activeTickets: 0,
  resolvedTickets: 0,
  latestTicket: null,
};

const getStatusBadgeClass = (status) => {
  if (status === "resolved") {
    return "success";
  }

  return "warning text-dark";
};

const SupportPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "active",
    adminNote: "",
  });

  const limit = 10;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchDashboard = useCallback(async () => {
    setIsDashboardLoading(true);

    await dispatch(
      GetSupportTicketDashboardApi((resp) => {
        const isSuccess = resp?.status === true || resp?.success === true;

        if (isSuccess) {
          setDashboard({
            totalTickets: resp?.data?.totalTickets ?? 0,
            activeTickets: resp?.data?.activeTickets ?? 0,
            resolvedTickets: resp?.data?.resolvedTickets ?? 0,
            latestTicket: resp?.data?.latestTicket ?? null,
          });
        } else {
          setDashboard(DEFAULT_DASHBOARD);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch support dashboard"
          );
        }

        setIsDashboardLoading(false);
      })
    );
  }, [dispatch]);

  const fetchTickets = useCallback(async () => {
    setIsListLoading(true);

    await dispatch(
      GetSupportTicketListApi(
        {
          status: statusFilter,
          page: currentPage,
          limit,
          search: debouncedSearch,
        },
        (resp) => {
          const isSuccess = resp?.status === true || resp?.success === true;

          if (isSuccess) {
            setTickets(Array.isArray(resp?.data) ? resp.data : []);
            setTotalPages(resp?.pagination?.totalPages || 1);
          } else {
            setTickets([]);
            setTotalPages(1);
            Notiflix.Notify.failure(
              resp?.message || "Failed to fetch support tickets"
            );
          }

          setIsListLoading(false);
        }
      )
    );
  }, [currentPage, debouncedSearch, dispatch, statusFilter]);

  const fetchTicketDetail = useCallback(
    async (ticketId, shouldOpenModal = true) => {
      if (!ticketId) {
        return;
      }

      setIsDetailLoading(true);
      setSelectedTicket(null);

      if (shouldOpenModal) {
        setShowModal(true);
      }

      await dispatch(
        GetSupportTicketByIdApi(ticketId, (resp) => {
          const isSuccess = resp?.status === true || resp?.success === true;

          if (isSuccess) {
            const ticket = resp?.data || null;
            setSelectedTicket(ticket);
            setUpdateForm({
              status: ticket?.status || "active",
              adminNote: ticket?.adminNote || "",
            });
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to fetch support ticket"
            );
          }

          setIsDetailLoading(false);
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const latestTicketSummary = useMemo(() => {
    if (!dashboard?.latestTicket) {
      return "No latest ticket available";
    }

    const latestTicket = dashboard.latestTicket;
    return `#${latestTicket.ticketId || "-"} | ${
      latestTicket.createdDateLabel || "Recently created"
    }`;
  }, [dashboard]);

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    if (!selectedTicket?.ticketId) {
      return;
    }

    if (!updateForm.adminNote.trim()) {
      Notiflix.Notify.failure("Please enter an admin note");
      return;
    }

    setIsUpdateLoading(true);

    await dispatch(
      UpdateSupportTicketApi(
        {
          ticketId: selectedTicket.ticketId,
          status: updateForm.status,
          adminNote: updateForm.adminNote.trim(),
        },
        async (resp) => {
          const isSuccess = resp?.status === true || resp?.success === true;

          if (isSuccess) {
            Notiflix.Notify.success(
              resp?.message || "Support ticket updated successfully"
            );
            await Promise.all([
              fetchDashboard(),
              fetchTickets(),
              fetchTicketDetail(selectedTicket.ticketId, false),
            ]);
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to update support ticket"
            );
          }

          setIsUpdateLoading(false);
        }
      )
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Support Tickets" />
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <div className="support-stats-grid">
            <Card className="support-stat-card">
              <p className="support-stat-label">Total Tickets</p>
              <h3 className="support-stat-value">
                {isDashboardLoading ? "-" : dashboard.totalTickets}
              </h3>
              <p className="support-stat-subtext">All support requests</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Active Tickets</p>
              <h3 className="support-stat-value">
                {isDashboardLoading ? "-" : dashboard.activeTickets}
              </h3>
              <p className="support-stat-subtext">Needs admin attention</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Resolved Tickets</p>
              <h3 className="support-stat-value">
                {isDashboardLoading ? "-" : dashboard.resolvedTickets}
              </h3>
              <p className="support-stat-subtext">Closed successfully</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Latest Ticket</p>
              <h3 className="support-stat-value">
                {isDashboardLoading
                  ? "-"
                  : `#${dashboard?.latestTicket?.ticketId || "-"}`}
              </h3>
              <p className="support-stat-subtext">{latestTicketSummary}</p>
            </Card>
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-4">
        <Form className="d-flex gap-3 flex-wrap">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Ticket ID, description, note, user fields"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Status</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </Form.Select>
          </div>
        </Form>

        <Button
          variant="outline-light"
          onClick={() => {
            fetchDashboard();
            fetchTickets();
          }}
        >
          Refresh
        </Button>
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <Card>
            <Card.Body className="pb-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">Support Ticket List</h4>
                  <p className="text-muted mb-0">
                    Review issues, inspect user details, and resolve tickets.
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
                  <th>Ticket</th>
                  <th>User</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isListLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading support tickets...
                    </td>
                  </tr>
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket?._id || ticket?.ticketId}>
                      <td>
                        <div className="support-ticket-summary">
                          <strong>#{ticket?.ticketId || "-"}</strong>
                          <span className="text-muted small">
                            {ticket?.resolvedAt
                              ? `Resolved: ${ticket.resolvedAt}`
                              : "Not resolved yet"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="support-ticket-summary">
                          <strong>{ticket?.user?.name || "-"}</strong>
                          <span className="text-muted small">
                            {ticket?.user?.email || ticket?.user?.phone || "-"}
                          </span>
                          <span className="text-muted small">
                            Member ID: {ticket?.user?.memberID || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="support-ticket-description">
                        {ticket?.description || "-"}
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusBadgeClass(
                            ticket?.status
                          )}`}
                        >
                          {ticket?.status || "-"}
                        </span>
                      </td>
                      <td className="support-ticket-description">
                        {ticket?.adminNote || "-"}
                      </td>
                      <td>{ticket?.createdDateLabel || "-"}</td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() => fetchTicketDetail(ticket?.ticketId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      No support tickets found
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

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Support Ticket{" "}
            {selectedTicket?.ticketId ? `#${selectedTicket.ticketId}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDetailLoading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading ticket details...
            </div>
          ) : selectedTicket ? (
            <div className="d-flex flex-column gap-4">
              <div className="support-detail-grid">
                <div className="support-detail-block">
                  <h6>Ticket Information</h6>
                  <p>
                    <strong>Ticket ID:</strong> #{selectedTicket?.ticketId || "-"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge bg-${getStatusBadgeClass(
                        selectedTicket?.status
                      )}`}
                    >
                      {selectedTicket?.status || "-"}
                    </span>
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {selectedTicket?.createdDateLabel || "-"}
                  </p>
                  <p>
                    <strong>Resolved At:</strong>{" "}
                    {selectedTicket?.resolvedAt || "-"}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {selectedTicket?.description || "-"}
                  </p>
                </div>

                <div className="support-detail-block">
                  <h6>User Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedTicket?.user?.name || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedTicket?.user?.email || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedTicket?.user?.phone || "-"}
                  </p>
                  <p>
                    <strong>Member ID:</strong>{" "}
                    {selectedTicket?.user?.memberID || "-"}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedTicket?.user?._id || "-"}
                  </p>
                </div>
              </div>

              <div className="support-detail-block">
                <h6>Attached Images</h6>
                {selectedTicket?.images?.length > 0 ? (
                  <div className="support-image-grid">
                    {selectedTicket.images.map((imageUrl, index) => (
                      <a
                        key={`${imageUrl}-${index}`}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {/* Remote attachment URLs are provided by the API. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`Support attachment ${index + 1}`}
                          className="support-image-thumb"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0 text-muted">No images attached</p>
                )}
              </div>

              <Card>
                <Card.Body>
                  <h5 className="mb-3">Update Ticket</h5>
                  <Form onSubmit={handleUpdateSubmit}>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Status</Form.Label>
                          <Form.Select
                            value={updateForm.status}
                            disabled={isUpdateLoading}
                            onChange={(event) =>
                              setUpdateForm((prev) => ({
                                ...prev,
                                status: event.target.value,
                              }))
                            }
                          >
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Admin Note</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Add an admin note"
                            value={updateForm.adminNote}
                            disabled={isUpdateLoading}
                            onChange={(event) =>
                              setUpdateForm((prev) => ({
                                ...prev,
                                adminNote: event.target.value,
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdateLoading}
                        onClick={() => {
                          setUpdateForm({
                            status: selectedTicket?.status || "active",
                            adminNote: selectedTicket?.adminNote || "",
                          });
                        }}
                      >
                        Reset
                      </Button>
                      <Button type="submit" disabled={isUpdateLoading}>
                        {isUpdateLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          ) : (
            <div className="py-4 text-center text-muted">
              Select a ticket to review its details.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SupportPage;
