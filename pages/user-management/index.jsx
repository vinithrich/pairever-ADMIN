import { PageHeading } from "@/widgets";
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
import { sortRows } from "@/helper/tableSort";

import Notiflix from "notiflix";
import {
  DeleteUserApi,
  GetUserListApi,
  SendUserPushApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
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


  const getUserDetails = useCallback(async () => {
    const queryParams = {
      search: searchQuery,
      page: currentPage,
      limit: leadsPerPage,
    };

    await dispatch(
      GetUserListApi(queryParams, (resp) => {
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
    getUserDetails();
  }, [getUserDetails]);

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

  const handleDeleteUser = useCallback(
    async (userId) => {
      if (!userId || deletingUserId) {
        return;
      }

      const isConfirmed = window.confirm(
        "Are you sure you want to delete this user?"
      );

      if (!isConfirmed) {
        return;
      }

      setDeletingUserId(userId);

      try {
        const resp = await dispatch(DeleteUserApi({ userId }));

        if (resp?.status) {
          Notiflix.Notify.success(resp?.message || "User deleted successfully");

          if (userList.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          } else {
            await getUserDetails();
          }
        } else {
          Notiflix.Notify.failure(resp?.message || "Failed to delete user");
        }
      } finally {
        setDeletingUserId("");
      }
    },
    [currentPage, deletingUserId, dispatch, getUserDetails, userList.length]
  );

  const openNotifyModal = (user) => {
    setSelectedUser(user);
    setNotificationForm({
      title: "Someone is waiting for you",
      body: "Someone is waiting for you. Open Pair Ever now and connect.",
    });
    setShowNotifyModal(true);
  };

  const closeNotifyModal = (forceClose = false) => {
    if (isSendingNotification && !forceClose) return;

    setShowNotifyModal(false);
    setSelectedUser(null);
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

    if (!selectedUser?._id) {
      Notiflix.Notify.failure("Please select a user");
      return;
    }

    if (!title || !body) {
      Notiflix.Notify.failure("Please enter notification title and message");
      return;
    }

    setIsSendingNotification(true);

    await dispatch(
      SendUserPushApi(
        {
          title,
          body,
          roleTarget: "user",
          userId: selectedUser._id,
          targetUserId: selectedUser._id,
          memberID: selectedUser.memberID,
          coinBalance: selectedUser.coinBalance ?? 0,
          screen: "user_home",
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
      name: (user) => user.name || "",
      phone: (user) => user.phone || "",
      gender: (user) => user.gender || "",
      DOB: (user) => user.DOB || "",
      Language: (user) => user.Language || "",
      coinBalance: (user) => user.coinBalance ?? 0,
      role: (user) => user.role || "",
      status: (user) => (user.isLogin ? "Online" : "Offline"),
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
        <PageHeading heading="User Management" />
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
                  <th><SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Gender" sortKey="gender" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="DOB" sortKey="DOB" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Language" sortKey="Language" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Coins" sortKey="coinBalance" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} /></th>
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
                      <td>{user.name || "-"}</td>
                      <td>{user.phone || "-"}</td>
                      <td>{user.gender || "-"}</td>
                      <td>{user.DOB || "-"}</td>
                      <td>{user.Language || "-"}</td>
                      <td>{user.coinBalance ?? 0}</td>
                      <td>{user.role || "-"}</td>
                      <td>
                        {user.isLogin ? (
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
                            onClick={() => router.push(`/user-management/${user._id}`)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openNotifyModal(user)}
                          >
                            Notify
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={deletingUserId === user._id}
                          >
                            {deletingUserId === user._id ? "Deleting..." : "Delete"}
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
          <Modal.Title>Send User Notification</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="text-muted mb-3">
            Sending to: <b>{selectedUser?.name || selectedUser?.phone || "-"}</b>
            {" "}({selectedUser?.coinBalance ?? 0} coins)
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
                placeholder="Type message for this user"
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
    </Container>
  );
};

export default ManageInvoice;
