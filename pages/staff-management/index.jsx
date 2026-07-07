import { PageHeading } from "@/widgets";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Col,
  Row,
  Container,
  Form,
  Card,
  Table,
  Modal,
  Button,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { sortRows } from "@/helper/tableSort";

import Notiflix from "notiflix";
import {
  ConvertStaffToUserApi,
  DeleteStaffApi,
  GetStaffListApi,
  SendStaffWarningPushApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const formatAmount = (value) => (Number(value) || 0).toFixed(2);

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [searchQuery, setSearchQuery] = useState("");
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingStaffId, setDeletingStaffId] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [convertStaff, setConvertStaff] = useState(null);
  const [convertPreview, setConvertPreview] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConvertDryRunLoading, setIsConvertDryRunLoading] = useState(false);
  const [isConvertingStaff, setIsConvertingStaff] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    body: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();


  const GetStaffDetails = useCallback(async () => {
    const queryParams = {
      search: searchQuery,
      page: currentPage,
      limit: leadsPerPage,
    };

    await dispatch(
      GetStaffListApi(queryParams, (resp) => {
        if (resp?.status) {
          setUserList(resp.data || []);
          setTotalPages(resp.pagination?.totalPages || 1);
        } else {
          setUserList([]);
          setTotalPages(1);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch users");
        }
      })
    );
  }, [currentPage, dispatch, leadsPerPage, searchQuery]);

  useEffect(() => {
    GetStaffDetails();
  }, [GetStaffDetails]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
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

  const handleDeleteStaff = useCallback(
    async (staffId) => {
      if (!staffId || deletingStaffId) {
        return;
      }

      const isConfirmed = window.confirm(
        "Are you sure you want to delete this staff member?"
      );

      if (!isConfirmed) {
        return;
      }

      setDeletingStaffId(staffId);

      try {
        const resp = await dispatch(DeleteStaffApi({ staffId }));

        if (resp?.status) {
          Notiflix.Notify.success(resp?.message || "Staff deleted successfully");

          if (userList.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          } else {
            await GetStaffDetails();
          }
        } else {
          Notiflix.Notify.failure(resp?.message || "Failed to delete staff");
        }
      } finally {
        setDeletingStaffId("");
      }
    },
    [currentPage, deletingStaffId, dispatch, GetStaffDetails, setCurrentPage, userList.length]
  );

  const openAuditReport = (staff) => {
    const identifier = staff?.memberID || staff?.phone || staff?._id;

    if (!identifier) {
      Notiflix.Notify.failure("Staff audit identifier not found");
      return;
    }

    router.push(`/staff-audit-report/${encodeURIComponent(identifier)}`);
  };

  const canConvertStaffToUser = (staff) =>
    staff?.isApproved === "0" && staff?.convertedToUser !== true;

  const openConvertModal = async (staff) => {
    if (!staff?._id) {
      Notiflix.Notify.failure("Valid staffId is required");
      return;
    }

    setConvertStaff(staff);
    setConvertPreview(null);
    setShowConvertModal(true);
    setIsConvertDryRunLoading(true);

    const resp = await dispatch(
      ConvertStaffToUserApi({
        staffId: staff._id,
        dryRun: true,
      })
    );

    if (resp?.status || resp?.success) {
      setConvertPreview(resp?.data || {});
    } else {
      Notiflix.Notify.failure(resp?.message || "Failed to prepare conversion");
      setShowConvertModal(false);
      setConvertStaff(null);
    }

    setIsConvertDryRunLoading(false);
  };

  const closeConvertModal = () => {
    if (isConvertDryRunLoading || isConvertingStaff) return;

    setShowConvertModal(false);
    setConvertStaff(null);
    setConvertPreview(null);
  };

  const handleConvertStaffToUser = async () => {
    if (!convertStaff?._id || isConvertingStaff) {
      return;
    }

    setIsConvertingStaff(true);

    const resp = await dispatch(
      ConvertStaffToUserApi({
        staffId: convertStaff._id,
        reason: "Wrongly registered in staff login",
      })
    );

    if (resp?.status || resp?.success) {
      Notiflix.Notify.success("Staff converted to user successfully");
      setShowConvertModal(false);
      setConvertStaff(null);
      setConvertPreview(null);

      if (userList.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await GetStaffDetails();
      }
    } else {
      Notiflix.Notify.failure(resp?.message || "Failed to convert staff to user");
    }

    setIsConvertingStaff(false);
  };

  const openNotifyModal = (staff) => {
    setSelectedStaff(staff);
    setNotificationForm({
      title: "Reminder",
      body: "",
    });
    setShowNotifyModal(true);
  };

  const closeNotifyModal = (forceClose = false) => {
    if (isSendingNotification && !forceClose) return;

    setShowNotifyModal(false);
    setSelectedStaff(null);
    setNotificationForm({
      title: "",
      body: "",
    });
  };

  const handleNotificationChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendNotification = async () => {
    const title = notificationForm.title.trim();
    const body = notificationForm.body.trim();

    if (!selectedStaff?._id) {
      Notiflix.Notify.failure("Please select a staff member");
      return;
    }

    if (!title || !body) {
      Notiflix.Notify.failure("Please enter notification title and message");
      return;
    }

    setIsSendingNotification(true);

    await dispatch(
      SendStaffWarningPushApi(
        {
          title,
          body,
          roleTarget: "staff",
          userId: selectedStaff._id,
          staffId: selectedStaff._id,
          targetUserId: selectedStaff._id,
          memberID: selectedStaff.memberID,
          screen: "staff_message",
        },
        (resp) => {
          const isSuccess = Boolean(resp?.success ?? resp?.status);

          if (isSuccess) {
            Notiflix.Notify.success(resp?.message || "Notification sent");
            setIsSendingNotification(false);
            closeNotifyModal(true);
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to send notification"
            );
            setIsSendingNotification(false);
          }
        }
      )
    );
  };

  const sortedUsers = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => (currentPage - 1) * leadsPerPage + index + 1,
      memberID: (user) => user.memberID || "",
      name: (user) => user.name || "",
      phone: (user) => user.phone || "",
      dob: (user) => user.dob || "",
      staffEarned: (user) => user.staffEarned ?? 0,
      role: (user) => user.role || "",
      isApproved: (user) => user.isApproved || "",
      status: (user) => (user.isOnline ? "Online" : "Offline"),
      createdAt: (user) => user.createdAt || "",
    };

    return sortRows(
      userList.map((user, index) => ({ ...user, __index: index })),
      {
        ...sortConfig,
        getValue: (user) =>
          getValue[sortConfig.key]?.(user, user.__index) ?? "",
      }
    );
  }, [currentPage, leadsPerPage, sortConfig, userList]);

  return (
    <Container fluid className="p-6">

      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
        ></i>
        <PageHeading heading="Staff Management" />
      </div>


      <div className="d-flex justify-content-between w-100">
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
        </Form>
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
                  <th><SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="is Verified" sortKey="isApproved" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Created At" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user, i) => (
                    <tr key={user._id}>
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
                      <td>{formatAmount(user.staffEarned)}</td>
                      <td>{user.role || "-"}</td>
                      <td>
                        {user.isApproved === "0" && (
                          <span className="badge bg-warning text-dark">Pending</span>
                        )}
                        {user.isApproved === "1" && (
                          <span className="badge bg-success">Approved</span>
                        )}
                        {user.isApproved === "2" && (
                          <span className="badge bg-danger">Rejected</span>
                        )}
                        {!["0", "1", "2"].includes(user.isApproved) && "-"}
                      </td>
                      <td>
                        {user.isOnline ? (
                          <span className="badge bg-success">Online</span>
                        ) : (
                          <span className="badge bg-secondary">Offline</span>
                        )}
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => router.push(`/staff-management/${user._id}`)}
                          >
                            View
                          </button>
                          {/* <button
                            className="btn btn-sm btn-warning"
                            onClick={() => router.push(`/staff-management/${user._id}?mode=edit`)}
                          >
                            Edit
                          </button> */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openAuditReport(user)}
                          >
                            Audit Report
                          </button>
                          {canConvertStaffToUser(user) ? (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => openConvertModal(user)}
                              disabled={isConvertingStaff}
                            >
                              Convert to User
                            </button>
                          ) : null}
                          {/* <button
                            className="btn btn-sm btn-info"
                            onClick={() => openNotifyModal(user)}
                          >
                            Notify
                          </button>*/}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteStaff(user._id)}
                            disabled={deletingStaffId === user._id}
                          >
                            {deletingStaffId === user._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
                      No Users Found
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

      <Modal show={showNotifyModal} onHide={closeNotifyModal} centered>
        <Modal.Header closeButton={!isSendingNotification}>
          <Modal.Title>Send Staff Notification</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="text-muted mb-3">
            Sending to: <b>{selectedStaff?.name || selectedStaff?.phone || "-"}</b>
          </p>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={notificationForm.title}
                onChange={handleNotificationChange}
                disabled={isSendingNotification}
                placeholder="Notification title"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="body"
                value={notificationForm.body}
                onChange={handleNotificationChange}
                disabled={isSendingNotification}
                placeholder="Type message for this staff"
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeNotifyModal}
            disabled={isSendingNotification}
          >
            Cancel
          </Button>
          <Button onClick={handleSendNotification} disabled={isSendingNotification}>
            {isSendingNotification ? "Sending..." : "Send Notification"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConvertModal} onHide={closeConvertModal} centered>
        <Modal.Header closeButton={!isConvertDryRunLoading && !isConvertingStaff}>
          <Modal.Title>Convert Staff to User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isConvertDryRunLoading ? (
            <div className="py-4 text-center">
              Preparing conversion preview...
            </div>
          ) : (
            <>
              <p className="text-muted mb-3">
                After confirmation, this staff record will be deleted and a new
                user account will be created.
              </p>

              <Table bordered responsive className="mb-0">
                <tbody>
                  <tr>
                    <th>Staff Name</th>
                    <td>{convertStaff?.name || "-"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{convertStaff?.phone || "-"}</td>
                  </tr>
                  <tr>
                    <th>Current Staff Member ID</th>
                    <td>{convertStaff?.memberID || "-"}</td>
                  </tr>
                  <tr>
                    <th>New User Member ID</th>
                    <td>{convertPreview?.user?.memberID || "-"}</td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeConvertModal}
            disabled={isConvertDryRunLoading || isConvertingStaff}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleConvertStaffToUser}
            disabled={isConvertDryRunLoading || isConvertingStaff || !convertPreview}
          >
            {isConvertingStaff ? "Converting..." : "Confirm Convert"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageInvoice;
