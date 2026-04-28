import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Button,
  Table,
  Pagination,
  Modal,
  Form,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";
import {
  GetSingleStaffApi,
  GetStaffWithdrawHistoryApi,
  UpdateStaffApi,
  UpdateStaffApprovalApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const StaffDetail = () => {
  const HISTORY_PAGE_SIZE = 10;
  const router = useRouter();
  const { userId, mode } = router.query;
  const dispatch = useDispatch();

  const [staff, setStaff] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [callSortConfig, setCallSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [withdrawSortConfig, setWithdrawSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [callCurrentPage, setCallCurrentPage] = useState(1);
  const [withdrawCurrentPage, setWithdrawCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    email: "",
    phone: "",
    dob: "",
    role: "",
    isBusy: false,
    IDtype: "",
    IDnumber: "",
    formStatus: "",
    image: "",
    imageFile: null,
  });

  const buildFormData = (staffData) => ({
    name: staffData?.name || "",
    bio: staffData?.bio || "",
    email: staffData?.email || "",
    phone: staffData?.phone || "",
    dob: staffData?.dob || "",
    role: staffData?.role || "",
    isBusy: Boolean(staffData?.isBusy),
    IDtype: staffData?.IDtype || "",
    IDnumber: staffData?.IDnumber || "",
    formStatus: staffData?.formStatus || "",
    image: staffData?.image || "",
    imageFile: null,
  });
// ✅ NEW: earning calculation function
  const calculateStaffEarning = (call) => {
    const duration = Number(call.callDuration) || 0;
    const minimumDuration = duration > 0 ? Math.max(duration, 60) : 0;

    if (call.callType === "audio") {
      return ((minimumDuration / 60) * 5).toFixed(2);
    } else if (call.callType === "video") {
      return ((minimumDuration / 60) * 10).toFixed(2);
    } else if (call.callType === "chat") {
      return "1.50";
    }

    return "0.00";
  };

  const formatDuration = (totalSeconds) => {
    const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    const parts = [];

    if (hours) parts.push(`${hours}h`);
    if (minutes || hours) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  const formatAmount = (value) => {
    return (Number(value) || 0).toFixed(2);
  };

  const fetchStaff = useCallback(async () => {
    if (!userId) return;

    await dispatch(
      GetSingleStaffApi(userId, (resp) => {
        if (resp?.status) {
          setStaff(resp.data);
             // ✅ MODIFY: inject calculated earning into callHistory
          const updatedHistory = (resp.callHistory || []).map((call) => ({
            ...call,
            calculatedEarned: calculateStaffEarning(call),
          }));
          setCallHistory(updatedHistory);
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch staff details"
          );
        }
      })
    );
  }, [dispatch, userId]);

  const fetchWithdrawHistory = useCallback(async () => {
    if (!userId) return;

    await dispatch(
      GetStaffWithdrawHistoryApi(userId, (resp) => {
        if (resp?.status) {
          setWithdrawHistory(resp.data || []);
        } else {
          setWithdrawHistory([]);
        }
      })
    );
  }, [dispatch, userId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchWithdrawHistory();
  }, [fetchWithdrawHistory]);

  useEffect(() => {
    if (staff && mode === "edit" && !showEditModal) {
      setFormData(buildFormData(staff));
      setShowEditModal(true);
    }
  }, [staff, mode, showEditModal]);

  const closeEditModal = () => {
    setShowEditModal(false);

    if (mode === "edit" && userId) {
      router.replace(`/staff-management/${userId}`, undefined, {
        shallow: true,
      });
    }
  };

  const openEditModal = () => {
    setFormData(buildFormData(staff));
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      image: file ? URL.createObjectURL(file) : prev.image,
    }));
  };

  const handleUpdateStaff = async () => {
    if (!staff?._id) return;

    if (!formData.name.trim()) {
      Notiflix.Notify.failure("Staff name is required");
      return;
    }

    if (!formData.phone.trim()) {
      Notiflix.Notify.failure("Staff phone is required");
      return;
    }

    const payload = new FormData();
    payload.append("userId", staff._id);
    payload.append("staffId", staff._id);
    payload.append("name", formData.name);
    payload.append("bio", formData.bio);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    payload.append("dob", formData.dob);
    payload.append("role", formData.role);
    payload.append("isBusy", formData.isBusy ? "true" : "false");
    payload.append("IDtype", formData.IDtype);
    payload.append("IDnumber", formData.IDnumber);
    payload.append("formStatus", formData.formStatus);

    if (formData.imageFile) {
      payload.append("image", formData.imageFile);
    } else if (formData.image) {
      payload.append("image", formData.image);
    }

    setIsUpdating(true);

    await dispatch(
      UpdateStaffApi(payload, (resp) => {
        if (resp?.status) {
          Notiflix.Notify.success("Staff updated successfully");
          setStaff((prev) => ({
            ...prev,
            ...formData,
            ...(resp?.data || {}),
          }));
          closeEditModal();
          fetchStaff();
        } else {
          Notiflix.Notify.failure(resp?.message || "Update failed");
        }
      })
    );

    setIsUpdating(false);
  };

  const handleApprove = async () => {
    await dispatch(
      UpdateStaffApprovalApi(
        { staffId: staff._id, status: "1" },
        (resp) => {
          if (resp?.status) {
            Notiflix.Notify.success("Staff approved successfully");
            setStaff((prev) => ({ ...prev, isApproved: "1" }));
          } else {
            Notiflix.Notify.failure(resp?.message || "Approval failed");
          }
        }
      )
    );
  };

  const handleReject = async () => {
    await dispatch(
      UpdateStaffApprovalApi(
        { staffId: staff._id, status: "2" },
        (resp) => {
          if (resp?.status) {
            Notiflix.Notify.success("Staff rejected successfully");
            setStaff((prev) => ({ ...prev, isApproved: "2" }));
          } else {
            Notiflix.Notify.failure(resp?.message || "Rejection failed");
          }
        }
      )
    );
  };

  const handleCallSort = (key) => {
    setCallSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleWithdrawSort = (key) => {
    setWithdrawSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedCallHistory = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => index + 1,
      createdAt: (call) => call.createdAt || "",
      callType: (call) => call.callType || "",
      callDuration: (call) => call.callDuration ?? 0,
      userName: (call) => call.userName || "",
      userPhone: (call) => call.userPhone || "",
      userSpentAmount: (call) => call.userSpentAmount ?? 0,
      calculatedEarned: (call) => call.calculatedEarned ?? 0,
    };

    return sortRows(
      callHistory.map((call, index) => ({ ...call, __index: index })),
      {
        ...callSortConfig,
        getValue: (call) =>
          getValue[callSortConfig.key]?.(call, call.__index) ?? "",
      }
    );
  }, [callHistory, callSortConfig]);

  const sortedWithdrawHistory = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => index + 1,
      createdAt: (withdraw) => withdraw.createdAt || "",
      amount: (withdraw) => withdraw.amount ?? 0,
      statusLabel: (withdraw) => withdraw.statusLabel || "",
      UPI: (withdraw) => withdraw.UPI || "",
      bankHolderName: (withdraw) => withdraw.bankHolderName || "",
      accountNumber: (withdraw) => withdraw.accountNumber || "",
      IFSC: (withdraw) => withdraw.IFSC || "",
    };

    return sortRows(
      withdrawHistory.map((withdraw, index) => ({ ...withdraw, __index: index })),
      {
        ...withdrawSortConfig,
        getValue: (withdraw) =>
          getValue[withdrawSortConfig.key]?.(withdraw, withdraw.__index) ?? "",
      }
    );
  }, [withdrawHistory, withdrawSortConfig]);

  const totalCallPages = Math.max(
    1,
    Math.ceil(sortedCallHistory.length / HISTORY_PAGE_SIZE)
  );
  const totalWithdrawPages = Math.max(
    1,
    Math.ceil(sortedWithdrawHistory.length / HISTORY_PAGE_SIZE)
  );

  const callPageStart = (callCurrentPage - 1) * HISTORY_PAGE_SIZE;
  const withdrawPageStart = (withdrawCurrentPage - 1) * HISTORY_PAGE_SIZE;

  const paginatedCallHistory = useMemo(
    () =>
      sortedCallHistory.slice(
        callPageStart,
        callPageStart + HISTORY_PAGE_SIZE
      ),
    [sortedCallHistory, callPageStart]
  );

  const paginatedWithdrawHistory = useMemo(
    () =>
      sortedWithdrawHistory.slice(
        withdrawPageStart,
        withdrawPageStart + HISTORY_PAGE_SIZE
      ),
    [sortedWithdrawHistory, withdrawPageStart]
  );

  useEffect(() => {
    setCallCurrentPage(1);
  }, [callSortConfig, callHistory.length]);

  useEffect(() => {
    setWithdrawCurrentPage(1);
  }, [withdrawSortConfig, withdrawHistory.length]);

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;

    const items = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    for (let page = startPage; page <= endPage; page += 1) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-end px-3 py-3 border-top">
        <Pagination className="mb-0">
          <Pagination.Prev
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {startPage > 1 ? (
            <>
              <Pagination.Item onClick={() => onPageChange(1)}>
                1
              </Pagination.Item>
              {startPage > 2 ? <Pagination.Ellipsis disabled /> : null}
            </>
          ) : null}
          {items}
          {endPage < totalPages ? (
            <>
              {endPage < totalPages - 1 ? (
                <Pagination.Ellipsis disabled />
              ) : null}
              <Pagination.Item onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </Pagination.Item>
            </>
          ) : null}
          <Pagination.Next
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    );
  };

  if (!userId || !staff) {
    return (
      <Container fluid className="p-6">
        <PageHeading heading="Staff Details" />
        <p>Loading staff details...</p>
      </Container>
    );
  }

  const totalDurationSpent = callHistory.reduce(
    (total, call) => total + (Number(call.callDuration) || 0),
    0
  );

  const totalWithdrawHistory = (() => {
    const directValue =
      staff?.totalWithdrawHistory ??
      staff?.withdrawHistoryAmount ??
      staff?.totalWithdrawAmount ??
      staff?.withdrawAmount;

    if (directValue !== undefined && directValue !== null && directValue !== "") {
      return Number(directValue) || 0;
    }

    const totalEarned = Number(staff?.staffEarned) || 0;
    const pendingBalance = Number(staff?.pendingBalance) || 0;
    return Math.max(totalEarned - pendingBalance, 0);
  })();

  const approvalStatus =
    staff.isApproved === "0"
      ? "Pending"
      : staff.isApproved === "1"
      ? "Approved"
      : staff.isApproved === "2"
      ? "Rejected"
      : "-";

  const approvalBadge =
    staff.isApproved === "0"
      ? "warning"
      : staff.isApproved === "1"
      ? "success"
      : staff.isApproved === "2"
      ? "danger"
      : "secondary";

  return (
    <Container fluid className="p-6">
      <Button variant="secondary" onClick={() => router.back()}>
        Back
      </Button>

      <PageHeading heading="Staff Details" />

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2}>
              <img
                src={staff.image || "/avatar.png"}
                alt="profile"
                className="img-fluid rounded"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />
            </Col>
            <Col md={6}>
              <h4 className="mb-1">{staff.name}</h4>
              <p className="mb-1 text-muted">
                Member ID: <b>{staff.memberID}</b>
              </p>
              <Badge bg={staff.isOnline ? "success" : "secondary"}>
                {staff.isOnline ? "Online" : "Offline"}
              </Badge>
              <Badge bg={staff.isBusy ? "warning" : "success"} className="ms-2">
                {staff.isBusy ? "Busy" : "Available"}
              </Badge>
            </Col>
            <Col md={4} className="text-md-end">
              <Badge bg="primary" className="me-2">
                {staff.role}
              </Badge>
              <Badge bg={approvalBadge}>{approvalStatus}</Badge>

              <div className="mt-3">
                <Button
                  size="sm"
                  variant="warning"
                  className="me-2"
                  onClick={openEditModal}
                >
                  Edit Staff
                </Button>

                {staff.isApproved === "0" && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      className="me-2"
                      onClick={handleApprove}
                    >
                      Approve
                    </Button>

                    <Button size="sm" variant="danger" onClick={handleReject}>
                      Reject
                    </Button>
                  </>
                )}

                {staff.isApproved === "1" && (
                  <Button size="sm" variant="success" disabled>
                    Approved
                  </Button>
                )}

                {staff.isApproved === "2" && (
                  <Button size="sm" variant="danger" disabled>
                    Rejected
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>


      <Row>
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Basic Information</Card.Header>
            <Card.Body>
              <p><b>Name:</b> {staff.name}</p>
              <p><b>Email:</b> {staff.email}</p>
              <p><b>Phone:</b> {staff.phone}</p>
              <p><b>Date of Birth:</b> {staff.dob}</p>
              {/* <p><b>Date of Birth:</b> {staff.dob}</p> */}
                <p><b>City:</b> {staff.city}</p>
                <p><b>Language:</b> {staff.Language}</p>
                 
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>ID Verification</Card.Header>
            <Card.Body>
              <p><b>ID Type:</b> {staff.IDtype}</p>
              <p><b>ID Number:</b> {staff.IDnumber}</p>
              <p><b>Form Status:</b> {staff.formStatus}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Total Earnings</Card.Header>
            <Card.Body>
              <h5 className="text-success">Rs {formatAmount(staff.staffEarned)}</h5>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Pending Balance</Card.Header>
            <Card.Body>
              <h5 className="text-warning">Rs {formatAmount(staff.pendingBalance)}</h5>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Total Withdraw History</Card.Header>
            <Card.Body>
              <h5 className="text-info mb-0">Rs {formatAmount(totalWithdrawHistory)}</h5>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Total Duration Spent</Card.Header>
            <Card.Body>
              <h5 className="text-primary mb-0">
                {formatDuration(totalDurationSpent)}
              </h5>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Areas of Interest</Card.Header>
        <Card.Body>
          {staff.areaOfInterest?.length > 0 ? (
            staff.areaOfInterest.map((item, i) => (
              <Badge key={i} bg="info" className="me-2 mb-2">
                {item.title}
              </Badge>
            ))
          ) : (
            <p>No interests added</p>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Account Info</Card.Header>
        <Card.Body>
          <p>
            <b>Created At:</b> {new Date(staff.createdAt).toLocaleString()}
          </p>
          <p>
            <b>Last Updated:</b> {new Date(staff.updatedAt).toLocaleString()}
          </p>
          <p><b>IP Address:</b> {staff.ip}</p>
        </Card.Body>
      </Card>

      <Card className="mt-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Call History</h5>
        </Card.Header>

        <Card.Body className="p-0">
          {callHistory.length > 0 ? (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th><SortableHeader label="#" sortKey="serialNumber" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="Date" sortKey="createdAt" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="Call Type" sortKey="callType" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="Duration (sec)" sortKey="callDuration" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="User Name" sortKey="userName" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="User Phone" sortKey="userPhone" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="User Spent" sortKey="userSpentAmount" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                    <th><SortableHeader label="Staff Earned" sortKey="calculatedEarned" sortConfig={callSortConfig} onSort={handleCallSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCallHistory.map((call, index) => (
                    <tr key={call._id}>
                      <td>{callPageStart + index + 1}</td>
                      <td>{new Date(call.createdAt).toLocaleString()}</td>
                      <td>
                        <Badge bg="info">{call.callType}</Badge>
                      </td>
                      <td>{call.callDuration}</td>
                      <td>{call.userName}</td>
                      <td>{call.userPhone}</td>
                      <td className="text-danger">
                        Rs {formatAmount(call.userSpentAmount)}
                      </td>
                      <td className="text-success">
                        Rs {formatAmount(call.calculatedEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {renderPagination(
                callCurrentPage,
                totalCallPages,
                setCallCurrentPage
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted">
              No call history found
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Withdraw History</h5>
        </Card.Header>

        <Card.Body className="p-0">
          {withdrawHistory.length > 0 ? (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th><SortableHeader label="#" sortKey="serialNumber" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="Date" sortKey="createdAt" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="Amount" sortKey="amount" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="Status" sortKey="statusLabel" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="UPI" sortKey="UPI" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="Bank Holder" sortKey="bankHolderName" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="Account Number" sortKey="accountNumber" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                    <th><SortableHeader label="IFSC" sortKey="IFSC" sortConfig={withdrawSortConfig} onSort={handleWithdrawSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWithdrawHistory.map((withdraw, index) => {
                    const withdrawStatus = withdraw.statusLabel || "-";
                    const withdrawBadge =
                      withdraw.statusCode === "0"
                        ? "warning"
                        : withdraw.statusCode === "1"
                        ? "success"
                        : withdraw.statusCode === "2"
                        ? "danger"
                        : "secondary";

                    return (
                      <tr key={withdraw.id || `${withdraw.createdAt}-${index}`}>
                        <td>{withdrawPageStart + index + 1}</td>
                        <td>{withdraw.displayDate || "-"}</td>
                        <td className="text-primary">
                          Rs {formatAmount(withdraw.amount)}
                        </td>
                        <td>
                          <Badge bg={withdrawBadge}>{withdrawStatus}</Badge>
                        </td>
                        <td>{withdraw.UPI || "-"}</td>
                        <td>{withdraw.bankHolderName || "-"}</td>
                        <td>{withdraw.accountNumber || "-"}</td>
                        <td>{withdraw.IFSC || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {renderPagination(
                withdrawCurrentPage,
                totalWithdrawPages,
                setWithdrawCurrentPage
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted">
              No withdraw history found
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showEditModal} onHide={closeEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Staff</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              {formData.image ? (
                <div className="mb-2">
                  <img
                    src={formData.image}
                    alt="staff preview"
                    className="rounded"
                    style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  />
                </div>
              ) : null}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Check
              className="mb-3"
              type="checkbox"
              label="Busy Status"
              name="isBusy"
              checked={formData.isBusy}
              onChange={handleInputChange}
            />

            <Form.Group className="mb-3">
              <Form.Label>ID Type</Form.Label>
              <Form.Control
                name="IDtype"
                value={formData.IDtype}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>ID Number</Form.Label>
              <Form.Control
                name="IDnumber"
                value={formData.IDnumber}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Form Status</Form.Label>
              <Form.Control
                name="formStatus"
                value={formData.formStatus}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateStaff}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Staff"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StaffDetail;
