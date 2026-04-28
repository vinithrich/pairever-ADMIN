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
  GetStaffReportByIdApi,
  GetStaffReportListApi,
  SendStaffWarningPushApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const getStatusBadgeClass = (status) => {
  if (status === "reviewed") {
    return "success";
  }

  return "warning text-dark";
};

const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const buildWarningMessage = (report) => {
  const ratingLabel = report?.rating ? ` Rating received: ${report.rating}.` : "";
  const commentLabel = report?.comment ? ` User comment: ${report.comment}` : "";

  return `A user has reported an issue with your recent call.
We have received feedback regarding your service. Please review and ensure compliance with Pair Ever service guidelines..
      ⭐ ${ratingLabel}
      💬 ${commentLabel} `;
};

const StaffReportsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isWarningSending, setIsWarningSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReport, setWarningReport] = useState(null);
  const [warningForm, setWarningForm] = useState({
    title: "Service Warning",
    body: "",
  });

  const limit = 10;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchReports = useCallback(async () => {
    setIsListLoading(true);

    await dispatch(
      GetStaffReportListApi(
        {
          status: statusFilter,
          page: currentPage,
          limit,
          search: debouncedSearch,
        },
        (resp) => {
          const isSuccess = resp?.status === true || resp?.success === true;

          if (isSuccess) {
            setReports(Array.isArray(resp?.data) ? resp.data : []);
            setTotalPages(resp?.pagination?.totalPages || 1);
          } else {
            setReports([]);
            setTotalPages(1);
            Notiflix.Notify.failure(
              resp?.message || "Failed to fetch staff reports"
            );
          }

          setIsListLoading(false);
        }
      )
    );
  }, [currentPage, debouncedSearch, dispatch, statusFilter]);

  const fetchReportDetail = useCallback(
    async (reportId) => {
      if (!reportId) {
        return;
      }

      setIsDetailLoading(true);
      setSelectedReport(null);
      setShowModal(true);

      await dispatch(
        GetStaffReportByIdApi(reportId, (resp) => {
          const isSuccess = resp?.status === true || resp?.success === true;

          if (isSuccess) {
            setSelectedReport(resp?.data || null);
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to fetch report details"
            );
          }

          setIsDetailLoading(false);
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const reportSummary = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((report) => report?.status === "pending").length;
    const reviewed = reports.filter((report) => report?.status === "reviewed").length;

    return { total, pending, reviewed };
  }, [reports]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const openWarningModal = (report) => {
    if (!report?.staff?._id) {
      Notiflix.Notify.failure("Staff ID is missing for this report");
      return;
    }

    setWarningReport(report);
    setWarningForm({
      title: "⚠️ Avoiding negative staff reaction",
      body: buildWarningMessage(report),
    });
    setShowWarningModal(true);
  };

  const handleSendWarning = async (event) => {
    event.preventDefault();

    const staffId = warningReport?.staff?._id;
    const title = warningForm.title.trim();
    const body = warningForm.body.trim();

    if (!staffId) {
      Notiflix.Notify.failure("Staff ID is missing for this report");
      return;
    }

    if (!title || !body) {
      Notiflix.Notify.failure("Please enter warning title and message");
      return;
    }

    setIsWarningSending(true);

    await dispatch(
      SendStaffWarningPushApi(
        {
          title,
          body,
          roleTarget: "staff",
          targetRole: "staff",
          targetUserId: staffId,
          userId: staffId,
          staffId,
          receiverId: staffId,
          reportId: warningReport?._id,
          type: "staff_warning",
          screen: "staff_reports",
        },
        (resp) => {
          const isSuccess = Boolean(resp?.success ?? resp?.status);

          if (isSuccess) {
            Notiflix.Notify.success(resp?.message || "Warning sent to staff");
            setShowWarningModal(false);
            setWarningReport(null);
          } else {
            Notiflix.Notify.failure(resp?.message || "Failed to send warning");
          }

          setIsWarningSending(false);
        }
      )
    );
  };

  const renderPersonSummary = (person, fallbackLabel) => (
    <div className="support-ticket-summary">
      <strong>{person?.name || fallbackLabel}</strong>
      <span className="text-muted small">
        {person?.email || person?.phone || "-"}
      </span>
      <span className="text-muted small">
        Member ID: {person?.memberID || "-"}
      </span>
    </div>
  );

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Staff Reports" />
      </div>

      <Row className="mt-4">
        <Col xs={12}>
          <div className="support-stats-grid">
            <Card className="support-stat-card">
              <p className="support-stat-label">Visible Reports</p>
              <h3 className="support-stat-value">
                {isListLoading ? "-" : reportSummary.total}
              </h3>
              <p className="support-stat-subtext">Current filtered page count</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Pending</p>
              <h3 className="support-stat-value">
                {isListLoading ? "-" : reportSummary.pending}
              </h3>
              <p className="support-stat-subtext">Awaiting review</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Reviewed</p>
              <h3 className="support-stat-value">
                {isListLoading ? "-" : reportSummary.reviewed}
              </h3>
              <p className="support-stat-subtext">Marked as reviewed</p>
            </Card>

            <Card className="support-stat-card">
              <p className="support-stat-label">Active Filter</p>
              <h3 className="support-stat-value text-capitalize">
                {statusFilter}
              </h3>
              <p className="support-stat-subtext">Search updates automatically</p>
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
              placeholder="Search user, staff, phone, member ID, comment"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Status</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
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
                  <h4 className="mb-1">Staff Report List</h4>
                  <p className="text-muted mb-0">
                    Review complaints submitted by users against staff members.
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
                  <th>User</th>
                  <th>Staff</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isListLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading staff reports...
                    </td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report?._id}>
                      <td>{renderPersonSummary(report?.user, "Unknown User")}</td>
                      <td>{renderPersonSummary(report?.staff, "Unknown Staff")}</td>
                      <td>{report?.rating ?? "-"}</td>
                      <td className="support-ticket-description">
                        {report?.comment || "-"}
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusBadgeClass(
                            report?.status
                          )}`}
                        >
                          {report?.status || "-"}
                        </span>
                      </td>
                      <td>{formatDateLabel(report?.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => fetchReportDetail(report?._id)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="warning"
                            className="text-dark"
                            onClick={() => openWarningModal(report)}
                            disabled={!report?.staff?._id || isWarningSending}
                          >
                            Warning
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      No staff reports found
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
        show={showWarningModal}
        onHide={() => {
          if (!isWarningSending) {
            setShowWarningModal(false);
          }
        }}
        centered
      >
        <Form onSubmit={handleSendWarning}>
          <Modal.Header closeButton={!isWarningSending}>
            <Modal.Title>Send Staff Warning</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <p className="mb-1">
                <strong>Staff:</strong> {warningReport?.staff?.name || "-"}
              </p>
              <p className="text-muted small mb-0">
                Member ID: {warningReport?.staff?.memberID || "-"}
              </p>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Title</Form.Label>
              <Form.Control
                type="text"
                value={warningForm.title}
                onChange={(event) =>
                  setWarningForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                disabled={isWarningSending}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={warningForm.body}
                onChange={(event) =>
                  setWarningForm((prev) => ({
                    ...prev,
                    body: event.target.value,
                  }))
                }
                disabled={isWarningSending}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowWarningModal(false)}
              disabled={isWarningSending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="warning" disabled={isWarningSending}>
              {isWarningSending ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                "Send Warning"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Staff Report Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDetailLoading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading report details...
            </div>
          ) : selectedReport ? (
            <div className="d-flex flex-column gap-4">
              <div className="support-detail-grid">
                <div className="support-detail-block">
                  <h6>Report Information</h6>
                  <p>
                    <strong>Report ID:</strong> {selectedReport?._id || "-"}
                  </p>
                  <p>
                    <strong>Rating:</strong> {selectedReport?.rating ?? "-"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge bg-${getStatusBadgeClass(
                        selectedReport?.status
                      )}`}
                    >
                      {selectedReport?.status || "-"}
                    </span>
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {formatDateLabel(selectedReport?.createdAt)}
                  </p>
                  <p>
                    <strong>Updated:</strong>{" "}
                    {formatDateLabel(selectedReport?.updatedAt)}
                  </p>
                  <p>
                    <strong>Comment:</strong> {selectedReport?.comment || "-"}
                  </p>
                </div>

                <div className="support-detail-block">
                  <h6>Reported User</h6>
                  <p>
                    <strong>Name:</strong> {selectedReport?.user?.name || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedReport?.user?.email || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedReport?.user?.phone || "-"}
                  </p>
                  <p>
                    <strong>Member ID:</strong>{" "}
                    {selectedReport?.user?.memberID || "-"}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedReport?.user?._id || "-"}
                  </p>
                </div>
              </div>

              <div className="support-detail-grid">
                <div className="support-detail-block">
                  <h6>Staff Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedReport?.staff?.name || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedReport?.staff?.email || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedReport?.staff?.phone || "-"}
                  </p>
                  <p>
                    <strong>Member ID:</strong>{" "}
                    {selectedReport?.staff?.memberID || "-"}
                  </p>
                  <p>
                    <strong>Staff ID:</strong> {selectedReport?.staff?._id || "-"}
                  </p>
                </div>

                <div className="support-detail-block">
                  <h6>Staff Status</h6>
                  <p>
                    <strong>Approval:</strong>{" "}
                    {selectedReport?.staff?.isApproved === "1"
                      ? "Approved"
                      : selectedReport?.staff?.isApproved === "0"
                        ? "Pending"
                        : selectedReport?.staff?.isApproved === "2"
                          ? "Rejected"
                          : "-"}
                  </p>
                  <p>
                    <strong>Online:</strong>{" "}
                    {selectedReport?.staff?.isOnline ? "Online" : "Offline"}
                  </p>
                  <p>
                    <strong>Staff Image:</strong>{" "}
                    {selectedReport?.staff?.image ? (
                      <a
                        href={selectedReport.staff.image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                  <p>
                    <strong>User Image:</strong>{" "}
                    {selectedReport?.user?.image ? (
                      <a
                        href={selectedReport.user.image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted">
              Select a report to review its details.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StaffReportsPage;
