import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Button,
  Table,
  Modal,
  Form,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import {
  GetSingleUserApi,
  SendUserPushApi,
  UpdateUserBalanceApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";

const formatAmount = (value) => (Number(value) || 0).toFixed(2);

const UserDetail = () => {
  const router = useRouter();
  const { userId } = router.query;
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [notificationForm, setNotificationForm] = useState({
    title: "Someone is waiting for you",
    body: "Someone is waiting for you. Open Pair Ever now and connect.",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const fetchUser = async () => {
    if (!userId) return;

    await dispatch(
      GetSingleUserApi(userId, (resp) => {
        if (resp?.status) {
          setUser(resp.data);
          setCallHistory(resp.callHistory || []);
        } else {
          Notiflix.Notify.failure("Failed to fetch user details");
        }
      })
    );
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openBalanceModal = () => {
    setBalanceAmount("");
    setShowBalanceModal(true);
  };

  const closeBalanceModal = (forceClose = false) => {
    if (isUpdatingBalance && !forceClose) return;

    setShowBalanceModal(false);
    setBalanceAmount("");
  };

  const handleUpdateBalance = async () => {
    if (!user?._id) return;

    const amount = Number(balanceAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      Notiflix.Notify.failure("Please enter a valid balance amount");
      return;
    }

    const currentBalance = Number(user?.coinBalance) || 0;
    const nextBalance = currentBalance + amount;

    setIsUpdatingBalance(true);

    await dispatch(
      UpdateUserBalanceApi(
        {
          userId: user._id,
          amount,
          coinBalance: nextBalance,
        },
        async (resp) => {
          const isSuccess = Boolean(resp?.success ?? resp?.status);

          if (isSuccess) {
            Notiflix.Notify.success(resp?.message || "Balance updated");
            setUser((prev) => ({
              ...prev,
              coinBalance: resp?.data?.coinBalance ?? nextBalance,
            }));
            await fetchUser();
            setIsUpdatingBalance(false);
            closeBalanceModal(true);
          } else {
            Notiflix.Notify.failure(resp?.message || "Failed to update balance");
            setIsUpdatingBalance(false);
          }
        }
      )
    );
  };

  const openNotifyModal = () => {
    setNotificationForm({
      title: "Someone is waiting for you",
      body: "Someone is waiting for you. Open Pair Ever now and connect.",
    });
    setShowNotifyModal(true);
  };

  const closeNotifyModal = (forceClose = false) => {
    if (isSendingNotification && !forceClose) return;

    setShowNotifyModal(false);
    setNotificationForm({
      title: "Someone is waiting for you",
      body: "Someone is waiting for you. Open Pair Ever now and connect.",
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
    if (!user?._id) return;

    const title = notificationForm.title.trim();
    const body = notificationForm.body.trim();

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
          userId: user._id,
          targetUserId: user._id,
          memberID: user.memberID,
          coinBalance: user.coinBalance ?? 0,
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

  const sortedCallHistory = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => index + 1,
      createdAt: (call) => call?.createdAt || "",
      callType: (call) => call?.callType || "",
      callDuration: (call) => call?.callDuration ?? 0,
      staffName: (call) => call?.staffName || "",
      staffPhone: (call) => call?.staffPhone || "",
      userSpentAmount: (call) => call?.userSpentAmount ?? 0,
      staffEarned: (call) => call?.staffEarned ?? 0,
    };

    return sortRows(
      callHistory.map((call, index) => ({ ...call, __index: index })),
      {
        ...sortConfig,
        getValue: (call) =>
          getValue[sortConfig.key]?.(call, call.__index) ?? "",
      }
    );
  }, [callHistory, sortConfig]);

  if (!userId) return null;

  return (
    <Container fluid className="p-6">
      <Button variant="secondary" onClick={() => router.back()}>
        Back
      </Button>

      <PageHeading heading="User Details" />

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={1}>
              <img
                src={user?.image || "/avatar.png"}
                alt="profile"
                className="img-fluid"
              />
            </Col>
            <Col md={6}>
              <h4 className="mb-1">{user?.name}</h4>
              <p className="mb-1 text-muted">
                Member ID: <b>{user?.memberID}</b>
              </p>
              <Badge bg={user?.isLogin ? "success" : "secondary"}>
                {user?.isLogin ? "Online" : "Offline"}
              </Badge>
            </Col>
            <Col md={4} className="text-md-end">
              <Badge bg="primary">{user?.role}</Badge>
              <div className="mt-3">
                <Button size="sm" variant="info" onClick={openNotifyModal}>
                  Send Notification
                </Button>
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
              <p><b>Phone:</b> {user?.phone}</p>
              <p><b>Gender:</b> {user?.gender}</p>
              <p><b>Date of Birth:</b> {user?.DOB}</p>
              <p><b>Language:</b> {user?.Language}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Coins & Activity</span>
              <Button size="sm" variant="info" onClick={openBalanceModal}>
                Add Balance
              </Button>
            </Card.Header>
            <Card.Body>
              <p><b>Coin Balance:</b> {user?.coinBalance}</p>
              <p><b>Total Purchase Amount:</b> Rs {formatAmount(user?.totalPurchaseAmount)}</p>
              <p><b>Total Coins Earned:</b> {user?.totalCoinBalance}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Areas of Interest</Card.Header>
        <Card.Body>
          {user?.areaOfInterest?.length > 0 ? (
            user?.areaOfInterest.map((item, i) => (
              <Badge key={i} bg="info" className="me-2">
                {item.title}
              </Badge>
            ))
          ) : (
            <p>No interests added</p>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>About</Card.Header>
        <Card.Body>
          <p>{user?.bio || "No bio available"}</p>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header>Account Info</Card.Header>
        <Card.Body>
          <p>
            <b>Created At:</b>{" "}
            {new Date(user?.createdAt).toLocaleString()}
          </p>
          <p>
            <b>Last Updated:</b>{" "}
            {new Date(user?.updatedAt).toLocaleString()}
          </p>
          <p><b>IP Address:</b> {user?.ip}</p>
        </Card.Body>
      </Card>

      <Card className="mt-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Call History</h5>
        </Card.Header>

        <Card.Body className="p-0">
          {callHistory && callHistory.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th><SortableHeader label="#" sortKey="serialNumber" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Call Type" sortKey="callType" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Duration (sec)" sortKey="callDuration" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Staff" sortKey="staffName" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Staff Phone" sortKey="staffPhone" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="User Spent" sortKey="userSpentAmount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Staff Earned" sortKey="staffEarned" sortConfig={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {sortedCallHistory.map((call, index) => (
                  <tr key={call?._id}>
                    <td>{index + 1}</td>
                    <td>{new Date(call?.createdAt).toLocaleString()}</td>
                    <td>
                      <Badge bg="info">{call?.callType}</Badge>
                    </td>
                    <td>{call?.callDuration}</td>
                    <td>{call?.staffName}</td>
                    <td>{call?.staffPhone}</td>
                    <td className="text-danger">
                      Rs {formatAmount(call?.userSpentAmount)}
                    </td>
                    <td className="text-success">
                      Rs {formatAmount(call?.staffEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-4 text-center text-muted">
              No call history found
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showBalanceModal} onHide={closeBalanceModal} centered>
        <Modal.Header closeButton={!isUpdatingBalance}>
          <Modal.Title>Add User Balance</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="text-muted mb-3">
            Current balance: <b>{user?.coinBalance ?? 0}</b> coins
          </p>

          <Form>
            <Form.Group>
              <Form.Label>Coins to Add</Form.Label>
              <Form.Control
                type="number"
                min="1"
                step="1"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                disabled={isUpdatingBalance}
                placeholder="Enter coin amount"
              />
              <Form.Text>
                New balance:{" "}
                {(Number(user?.coinBalance) || 0) + (Number(balanceAmount) || 0)} coins
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeBalanceModal}
            disabled={isUpdatingBalance}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateBalance} disabled={isUpdatingBalance}>
            {isUpdatingBalance ? "Updating..." : "Add Balance"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showNotifyModal} onHide={closeNotifyModal} centered>
        <Modal.Header closeButton={!isSendingNotification}>
          <Modal.Title>Send User Notification</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="text-muted mb-3">
            Sending to: <b>{user?.name || user?.phone || "-"}</b>
            {" "}({user?.coinBalance ?? 0} coins)
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

export default UserDetail;
