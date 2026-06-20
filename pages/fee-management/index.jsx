import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import {
  DeleteFeeManagementApi,
  GetFeeManagementApi,
  SaveFeeManagementApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const FEE_TYPES = [
  { key: "withdraw_fee", label: "Withdraw Fee", unit: "percent" },
  { key: "platform_fee", label: "Platform Fee", unit: "percent" },
  { key: "gst", label: "GST", unit: "percent" },
  { key: "audio_call_amount", label: "Audio Call Amount", unit: "amount" },
  { key: "video_call_amount", label: "Video Call Amount", unit: "amount" },
  { key: "message_amount", label: "Message Amount", unit: "amount" },
];

const emptyFeeForm = {
  feeId: "",
  feeType: FEE_TYPES[0].key,
  amount: "",
  unit: FEE_TYPES[0].unit,
  status: true,
  description: "",
};

const getFeeTypeMeta = (feeType) =>
  FEE_TYPES.find((item) => item.key === feeType) || FEE_TYPES[0];

const toTitle = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getFeeRows = (response) =>
  response?.data?.docs ||
  response?.data?.fees ||
  response?.data?.items ||
  response?.data ||
  response?.fees ||
  [];

const normalizeFee = (fee, index) => {
  const feeType =
    fee?.feeType ||
    fee?.fee_type ||
    fee?.type ||
    fee?.key ||
    FEE_TYPES[index]?.key ||
    "";
  const meta = getFeeTypeMeta(feeType);

  return {
    ...fee,
    id: fee?._id || fee?.id || fee?.feeId || `${feeType || "fee"}-${index + 1}`,
    feeType,
    title: fee?.title || fee?.name || meta.label || toTitle(feeType),
    amount: fee?.amount ?? fee?.value ?? fee?.fee ?? "",
    unit: fee?.unit || fee?.feeUnit || meta.unit || "amount",
    status: fee?.status ?? fee?.isActive ?? fee?.active ?? true,
    description: fee?.description || fee?.notes || "",
    updatedAt: fee?.updatedAt || fee?.createdAt || "",
  };
};

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

const formatFeeValue = (fee) => {
  if (fee.amount === "" || fee.amount === null || fee.amount === undefined) {
    return "-";
  }

  return fee.unit === "percent" ? `${fee.amount}%` : `₹${fee.amount}`;
};

const FeeManagementPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [fees, setFees] = useState([]);
  const [feeForm, setFeeForm] = useState(emptyFeeForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState("");

  const loadFees = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetFeeManagementApi((resp) => {
        if (resp?.status || resp?.success) {
          const rows = getFeeRows(resp);
          setFees(Array.isArray(rows) ? rows.map(normalizeFee) : []);
        } else {
          setFees([]);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch fees");
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const activeCount = useMemo(
    () => fees.filter((fee) => Boolean(fee.status)).length,
    [fees]
  );

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    if (name === "feeType") {
      const meta = getFeeTypeMeta(value);
      setFeeForm((prev) => ({
        ...prev,
        feeType: value,
        unit: meta.unit,
      }));
      return;
    }

    setFeeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearForm = () => {
    setFeeForm(emptyFeeForm);
  };

  const editFee = (fee) => {
    setFeeForm({
      feeId: fee.id,
      feeType: fee.feeType,
      amount: fee.amount,
      unit: fee.unit,
      status: Boolean(fee.status),
      description: fee.description,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (feeForm.amount === "" || Number(feeForm.amount) < 0) {
      Notiflix.Notify.failure("Please enter a valid fee amount");
      return;
    }

    const feeMeta = getFeeTypeMeta(feeForm.feeType);

    setIsSubmitting(true);

    await dispatch(
      SaveFeeManagementApi(
        {
          feeId: feeForm.feeId,
          id: feeForm.feeId,
          feeType: feeForm.feeType,
          fee_type: feeForm.feeType,
          title: feeMeta.label,
          amount: Number(feeForm.amount),
          value: Number(feeForm.amount),
          unit: feeForm.unit,
          status: Boolean(feeForm.status),
          isActive: Boolean(feeForm.status),
          description: feeForm.description.trim(),
        },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(resp?.message || "Fee saved successfully");
            clearForm();
            loadFees();
          } else {
            Notiflix.Notify.failure(resp?.message || "Failed to save fee");
          }

          setIsSubmitting(false);
        }
      )
    );
  };

  const handleDelete = async (fee) => {
    if (!fee?.id || deletingFeeId) {
      return;
    }

    const confirmed = window.confirm(`Delete ${fee.title || "this fee"}?`);

    if (!confirmed) {
      return;
    }

    setDeletingFeeId(fee.id);

    await dispatch(
      DeleteFeeManagementApi(
        {
          feeId: fee.id,
          id: fee.id,
          feeType: fee.feeType,
        },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(resp?.message || "Fee deleted successfully");
            loadFees();
          } else {
            Notiflix.Notify.failure(resp?.message || "Failed to delete fee");
          }

          setDeletingFeeId("");
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
        <PageHeading heading="Fee Management" />
      </div>

      <Row className="mt-4">
        <Col xl={4} lg={5} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h4 className="mb-1">Fee Details</h4>
                  <p className="text-muted mb-0">
                    Manage charges used across withdrawals and communication.
                  </p>
                </div>
                <Badge bg={feeForm.status ? "success" : "secondary"}>
                  {feeForm.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fee Type</Form.Label>
                  <Form.Select
                    name="feeType"
                    value={feeForm.feeType}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {FEE_TYPES.map((feeType) => (
                      <option key={feeType.key} value={feeType.key}>
                        {feeType.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Amount</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        name="amount"
                        value={feeForm.amount}
                        onChange={handleChange}
                        placeholder={
                          feeForm.unit === "percent" ? "Example: 18" : "Example: 5"
                        }
                        disabled={isSubmitting}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Unit</Form.Label>
                      <Form.Select
                        name="unit"
                        value={feeForm.unit}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={feeForm.description}
                    onChange={handleChange}
                    placeholder="Add notes for admin reference"
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="switch"
                    id="fee-status-switch"
                    name="status"
                    label={feeForm.status ? "Active fee" : "Inactive fee"}
                    checked={feeForm.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Fee"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearForm}
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8} lg={7}>
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Configured fees</div>
                  <div className="fs-3 fw-bold">{fees.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Active fees</div>
                  <div className="fs-3 fw-bold">{activeCount}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Required types</div>
                  <div className="fs-3 fw-bold">{FEE_TYPES.length}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Header className="d-flex align-items-center justify-content-between gap-3 bg-white">
              <h4 className="mb-0">All Fees</h4>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={loadFees}
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </Card.Header>

            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Fee Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Updated At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <Spinner animation="border" size="sm" />
                        <span>Loading fees...</span>
                      </div>
                    </td>
                  </tr>
                ) : fees.length > 0 ? (
                  fees.map((fee, index) => (
                    <tr key={fee.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{fee.title}</div>
                        <div
                          className="text-muted small text-truncate"
                          style={{ maxWidth: "320px" }}
                        >
                          {fee.description || fee.feeType}
                        </div>
                      </td>
                      <td className="fw-semibold">{formatFeeValue(fee)}</td>
                      <td>
                        <Badge bg={fee.status ? "success" : "secondary"}>
                          {fee.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td>{formatDateTime(fee.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => editFee(fee)}
                            disabled={isSubmitting}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingFeeId === fee.id}
                            onClick={() => handleDelete(fee)}
                          >
                            {deletingFeeId === fee.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No fees found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FeeManagementPage;
