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
import {
  getSingleWithdrawhistoryApi,
  UpdateStaffApprovalApi,
  updateWithdrawStatusApi, // reuse or rename if you want
} from "@/helper/Redux/ReduxThunk/Homepage";

const WithdrawDetail = () => {
  const router = useRouter();
  const { userId } = router.query;
  const dispatch = useDispatch();

  const [withdraw, setWithdraw] = useState(null);
console.log("userId",userId)
  const fetchWithdraw = async () => {
    if (!userId) return;

    await dispatch(
      getSingleWithdrawhistoryApi(userId, (resp) => {
        if (resp?.status) {
          setWithdraw(resp.data);
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch withdraw details"
          );
        }
      })
    );
  };

  useEffect(() => {
    fetchWithdraw();
  }, [userId]);

  if (!userId || !withdraw) {
    return (
      <Container fluid className="p-6">
        <PageHeading heading="Withdraw Details" />
        <p>Loading withdraw details...</p>
      </Container>
    );
  }

  /* ================= STATUS MAP ================= */
  const statusText =
    withdraw.status === "0"
      ? "Pending"
      : withdraw.status === "1"
      ? "Approved"
      : withdraw.status === "2"
      ? "Rejected"
      : "-";

  const statusBadge =
    withdraw.status === "0"
      ? "warning"
      : withdraw.status === "1"
      ? "success"
      : withdraw.status === "2"
      ? "danger"
      : "secondary";

  /* ================= ACTIONS ================= */
  const handleApprove = async () => {
    await dispatch(
      updateWithdrawStatusApi(
        { withdrawId: withdraw._id, status: "1" },
        (resp) => {
          if (resp?.status) {
            Notiflix.Notify.success("Withdraw approved");
            setWithdraw((prev) => ({ ...prev, status: "1" }));
          } else {
            Notiflix.Notify.failure(resp?.message || "Approval failed");
          }
        }
      )
    );
  };

  const handleReject = async () => {
    await dispatch(
      updateWithdrawStatusApi(
        { withdrawId: withdraw._id, status: "2" },
        (resp) => {
          if (resp?.status) {
            Notiflix.Notify.success("Withdraw rejected");
            setWithdraw((prev) => ({ ...prev, status: "2" }));
          } else {
            Notiflix.Notify.failure(resp?.message || "Rejection failed");
          }
        }
      )
    );
  };

  return (
    <Container fluid className="p-6">
      <Button variant="secondary" onClick={() => router.back()}>
        ← Back
      </Button>

      <PageHeading heading="Withdraw Details" />

      {/* ================= USER SUMMARY ================= */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2}>
              <img
                src={withdraw.image || "/avatar.png"}
                alt="profile"
                className="img-fluid rounded"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                }}
              />
            </Col>

            <Col md={6}>
              <h4 className="mb-1">{withdraw.name}</h4>
              <p className="mb-1 text-muted">
                Member ID: <b>{withdraw.memberID}</b>
              </p>
              <p className="mb-0">
                Phone: <b>{withdraw.phone}</b>
              </p>
            </Col>

            <Col md={4} className="text-md-end">
              <Badge bg={statusBadge} className="mb-2">
                {statusText}
              </Badge>

              <div className="mt-2">
                {withdraw.status === "0" && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      className="me-2"
                      onClick={handleApprove}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {withdraw.status === "1" && (
                  <Button size="sm" variant="success" disabled>
                    Approved
                  </Button>
                )}

                {withdraw.status === "2" && (
                  <Button size="sm" variant="danger" disabled>
                    Rejected
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ================= WITHDRAW DETAILS ================= */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Withdraw Information</h5>
        </Card.Header>

        <Table bordered responsive className="mb-0">
          <tbody>
            <tr>
              <th>Email</th>
              <td>{withdraw.email}</td>
            </tr>
            <tr>
              <th>Requested Amount</th>
              <td className="fw-bold text-primary">
                ₹{withdraw.amount}
              </td>
            </tr>
            <tr>
              <th>UPI ID</th>
              <td>{withdraw.UPI || "-"}</td>
            </tr>
            <tr>
              <th>Bank Holder Name</th>
              <td>{withdraw.bankHolderName || "-"}</td>
            </tr>
            <tr>
              <th>Bank Name</th>
              <td>{withdraw.bankNamee || "-"}</td>
            </tr>
            <tr>
              <th>Account Number</th>
              <td>{withdraw.accountNumber || "-"}</td>
            </tr>
            <tr>
              <th>IFSC</th>
              <td>{withdraw.IFSC || "-"}</td>
            </tr>
            <tr>
              <th>Requested At</th>
              <td>
                {new Date(withdraw.createdAt).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default WithdrawDetail;
