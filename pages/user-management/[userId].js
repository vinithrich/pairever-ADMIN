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
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import { GetSingleUserApi } from "@/helper/Redux/ReduxThunk/Homepage";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";

const formatAmount = (value) => (Number(value) || 0).toFixed(2);

const UserDetail = () => {
  const router = useRouter();
  const { userId } = router.query;
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
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
            <Card.Header>Coins & Activity</Card.Header>
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
    </Container>
  );
};

export default UserDetail;
