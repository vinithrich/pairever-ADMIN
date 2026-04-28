import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
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
import { getDepositHistoryApi } from "@/helper/Redux/ReduxThunk/Homepage";

const UserDepositDetail = () => {
  const router = useRouter();
  const { userId } = router.query;
  const dispatch = useDispatch();

  const [deposit, setDeposit] = useState(null);

  const fetchDeposit = async () => {
    if (!userId) return;

    await dispatch(
      getDepositHistoryApi(userId, (resp) => {
        if (resp?.status) {
          setDeposit(resp.data);
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch deposit details"
          );
        }
      })
    );
  };

  useEffect(() => {
    fetchDeposit();
  }, [userId]);

  if (!userId || !deposit) {
    return (
      <Container fluid className="p-6">
        <PageHeading heading="Deposit Details" />
        <p>Loading deposit details...</p>
      </Container>
    );
  }

  const paymentBadge =
    deposit.paymentStatus === "paid"
      ? "success"
      : deposit.paymentStatus === "failed"
      ? "danger"
      : "warning";

  return (
    <Container fluid className="p-6">
      <Button variant="secondary" onClick={() => router.back()}>
        ← Back
      </Button>

      <PageHeading heading="Deposit Details" />

      {/* ================= USER SUMMARY ================= */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2}>
              <img
                src={deposit.image || "/avatar.png"}
                alt="profile"
                className="img-fluid rounded"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            </Col>
            <Col md={6}>
              <h4 className="mb-1">{deposit.userName}</h4>
              <p className="mb-1 text-muted">
                Member ID: <b>{deposit.memberID}</b>
              </p>
              <p className="mb-0">
                Phone: <b>{deposit.userPhone}</b>
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Badge bg={paymentBadge} className="fs-6">
                {deposit.paymentStatus?.toUpperCase()}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ================= PAYMENT DETAILS ================= */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Payment Information</h5>
        </Card.Header>

        <Table bordered responsive className="mb-0">
          <tbody>
            <tr>
              <th>Order ID</th>
              <td>{deposit.razorpayOrderId}</td>
            </tr>
            <tr>
              <th>Payment ID</th>
              <td>{deposit.razorpayPaymentId}</td>
            </tr>
            <tr>
              <th>Amount</th>
              <td>
                ₹{deposit.totalAmount} {deposit.currency}
              </td>
            </tr>
            <tr>
              <th>Payment Status</th>
              <td>
                <Badge bg={paymentBadge}>
                  {deposit.paymentStatus}
                </Badge>
              </td>
            </tr>
            <tr>
              <th>Created At</th>
              <td>{new Date(deposit.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <th>Last Updated</th>
              <td>{new Date(deposit.updatedAt).toLocaleString()}</td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default UserDepositDetail;
