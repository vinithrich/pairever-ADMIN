import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
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
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";
import TablePagination from "@/components/TablePagination";


const defaultRuleForm = {
  ruleName: "",
  startTime: "00:00",
  endTime: "03:00",
  minOnlineMinutes: 180,
  minAttendedCalls: 20,
  rewardType: "amount",
  rewardValue: 500,
  giftTitle: "",
  giftImage: "",
  isActive: true,
};

const ShiftRewardManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultRuleForm);
  const [submitting, setSubmitting] = useState(false);

  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimPage, setClaimPage] = useState(1);
  const [claimTotalPages, setClaimTotalPages] = useState(1);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiHelper.getRequest("shift-reward-rules");
      if (response && response.status !== false && Array.isArray(response.data)) {
        setRules(response.data);
      } else if (Array.isArray(response)) {
        setRules(response);
      } else {
        setRules(response?.data?.rules || response?.data?.docs || []);
      }
    } catch (err) {
      console.error("Fetch shift rules error:", err);
      Notiflix.Notify.failure(err.message || "Failed to load shift reward rules");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async (page = 1) => {
    setLoadingClaims(true);
    try {
      const response = await apiHelper.getRequest(`shift-reward-claims?page=${page}&limit=10`);
      if (response && response.status !== false) {
        setClaims(response.data || []);
        if (response.pagination) {
          setClaimPage(response.pagination.page || page);
          setClaimTotalPages(response.pagination.totalPages || 1);
        }
      } else if (Array.isArray(response)) {
        setClaims(response);
      }
    } catch (err) {
      console.error("Fetch shift reward claims error:", err);
    } finally {
      setLoadingClaims(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchClaims(1);
  }, [fetchRules, fetchClaims]);



  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(defaultRuleForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingId(rule._id);
    setFormData({
      ruleName: rule.ruleName || "",
      startTime: rule.startTime || "00:00",
      endTime: rule.endTime || "03:00",
      minOnlineMinutes: rule.minOnlineMinutes || 180,
      minAttendedCalls: rule.minAttendedCalls || 20,
      rewardType: rule.rewardType || "amount",
      rewardValue: rule.rewardValue || 0,
      giftTitle: rule.giftTitle || "",
      giftImage: rule.giftImage || "",
      isActive: rule.isActive !== undefined ? rule.isActive : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ruleName || !formData.startTime || !formData.endTime) {
      Notiflix.Notify.warning("Please fill in Rule Name, Start Time, and End Time");
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await apiHelper.postRequest(
          `shift-reward-rules/update/${editingId}`,
          formData
        );
      } else {
        res = await apiHelper.postRequest(
          "shift-reward-rules",
          formData
        );
      }

      if (res && res.status !== false) {
        Notiflix.Notify.success(
          editingId
            ? "Shift reward rule updated successfully"
            : "Shift reward rule created successfully"
        );
        setShowModal(false);
        fetchRules();
      } else {
        Notiflix.Notify.failure(res?.message || "Failed to save rule");
      }
    } catch (err) {
      console.error("Submit shift rule error:", err);
      Notiflix.Notify.failure(err.message || "Error saving shift reward rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Notiflix.Confirm.show(
      "Confirm Delete",
      "Are you sure you want to delete this shift reward rule?",
      "Yes, Delete",
      "Cancel",
      async () => {
        try {
          const res = await apiHelper.postRequest(
            `shift-reward-rules/delete/${id}`,
            {}
          );
          if (res && res.status !== false) {
            Notiflix.Notify.success("Shift reward rule deleted");
            fetchRules();
          } else {
            Notiflix.Notify.failure(res?.message || "Failed to delete rule");
          }
        } catch (err) {
          console.error("Delete rule error:", err);
          Notiflix.Notify.failure(err.message || "Failed to delete shift rule");
        }
      }
    );
  };

  const handleToggleStatus = async (rule) => {
    try {
      const res = await apiHelper.postRequest(
        `shift-reward-rules/update/${rule._id}`,
        { isActive: !rule.isActive }
      );
      if (res && res.status !== false) {
        Notiflix.Notify.success(
          `Rule ${!rule.isActive ? "activated" : "deactivated"} successfully`
        );
        fetchRules();
      }
    } catch (err) {
      Notiflix.Notify.failure(err.message || "Failed to toggle status");
    }
  };


  return (
    <Container fluid className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <PageHeading heading="Shift Incentive & Reward Management" />
          <p className="text-muted mb-0">
            Configure shift time windows, online duration targets, call counts, and cash/gift rewards.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          + Create New Shift Rule
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-dark py-3">
          <h5 className="mb-0">Configured Shift Rules</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading shift rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No shift reward rules configured yet. Click <strong>+ Create New Shift Rule</strong> to add one.
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Rule Name</th>
                  <th>Shift Time Window</th>
                  <th>Required Online Time</th>
                  <th>Required Calls</th>
                  <th>Reward Type</th>
                  <th>Reward Value</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr key={rule._id || idx}>
                    <td>{idx + 1}</td>
                    <td className="fw-semibold">{rule.ruleName}</td>
                    <td>
                      <Badge bg="info" className="text-dark fs-6 font-monospace">
                        {rule.startTime} - {rule.endTime}
                      </Badge>
                    </td>
                    <td>
                      {rule.minOnlineMinutes} mins ({Number((rule.minOnlineMinutes / 60).toFixed(1))} hrs)
                    </td>
                    <td>{rule.minAttendedCalls} calls</td>
                    <td>
                      <Badge bg={rule.rewardType === "gift" ? "purple" : "success"}>
                        {rule.rewardType === "gift" ? "Gift Item" : "Cash Amount"}
                      </Badge>
                    </td>
                    <td className="fw-bold">
                      {rule.rewardType === "amount"
                        ? `₹${rule.rewardValue}`
                        : `${rule.giftTitle || "Gift"} (Val: ${rule.rewardValue})`}
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`status-switch-${rule._id}`}
                        checked={Boolean(rule.isActive)}
                        onChange={() => handleToggleStatus(rule)}
                        label={rule.isActive ? "Active" : "Inactive"}
                      />
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenEditModal(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(rule._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Staff Shift Reward Claims History Card */}
      <Card className="shadow-sm mt-5">
        <Card.Header className="bg-dark py-3">
          <h5 className="mb-0 text-white">Staff Shift Reward Claims History</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loadingClaims ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading claim history...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No shift reward claims recorded yet.
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Staff Member</th>
                  <th>Shift Rule</th>
                  <th>Shift Date</th>
                  <th>Online Duration</th>
                  <th>Attended Calls</th>
                  <th>Reward</th>
                  <th>Claim Status</th>
                  <th>Claimed Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, idx) => (
                  <tr key={claim._id || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-semibold">
                        {claim.staffId?.name || "Staff Member"}
                      </div>
                      <small className="text-muted font-monospace">
                        ID: {claim.memberID || claim.staffId?.memberID || "N/A"}
                      </small>
                    </td>
                    <td>
                      <div className="fw-semibold">
                        {claim.ruleId?.ruleName || "Shift Rule"}
                      </div>
                      {claim.ruleId?.startTime && claim.ruleId?.endTime && (
                        <small className="text-muted font-monospace">
                          ({claim.ruleId.startTime} - {claim.ruleId.endTime})
                        </small>
                      )}
                    </td>
                    <td>
                      <Badge bg="secondary" className="font-monospace">
                        {claim.shiftDate}
                      </Badge>
                    </td>
                    <td>{claim.achievedOnlineMinutes || 0} mins</td>
                    <td>{claim.achievedCallCount || 0} calls</td>
                    <td className="fw-bold">
                      {claim.rewardType === "amount"
                        ? `₹${claim.rewardValue}`
                        : `${claim.ruleId?.giftTitle || claim.giftTitle || "Gift"} (₹${claim.rewardValue})`}
                    </td>
                    <td>
                      <Badge bg="success">Claimed</Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(claim.claimedAt || claim.createdAt).toLocaleString()}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        <Card.Footer className="bg-white py-2">
          <TablePagination
            currentPage={claimPage}
            totalPages={claimTotalPages}
            onPageChange={(p) => fetchClaims(p)}
          />
        </Card.Footer>
      </Card>



      {/* Modal Create / Edit Rule */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Edit Shift Reward Rule" : "Create Shift Reward Rule"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Rule Name / Shift Title *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Night Shift Incentive (12 AM - 3 AM)"
                    value={formData.ruleName}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Time (24h format) *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Time (24h format) *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Required Online Duration (Minutes) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="180"
                    value={formData.minOnlineMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOnlineMinutes: Number(e.target.value),
                      })
                    }
                    required
                  />
                  <Form.Text className="text-muted">
                    180 minutes = 3 hours required online in shift.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Required Attended Calls Count *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="20"
                    value={formData.minAttendedCalls}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minAttendedCalls: Number(e.target.value),
                      })
                    }
                    required
                  />
                  <Form.Text className="text-muted">
                    Minimum completed audio/video calls during the shift.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Reward Type *</Form.Label>
                  <Form.Select
                    value={formData.rewardType}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardType: e.target.value })
                    }
                  >
                    <option value="amount">Cash / Withdrawal Amount</option>
                    <option value="gift">Gift Item Bonus</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {formData.rewardType === "amount"
                      ? "Reward Amount (₹) *"
                      : "Gift Value / Coin Value *"}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formData.rewardValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardValue: Number(e.target.value),
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>

              {formData.rewardType === "gift" && (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gift Title</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Golden Crown / Special Watch"
                        value={formData.giftTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, giftTitle: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gift Image URL</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="https://..."
                        value={formData.giftImage}
                        onChange={(e) =>
                          setFormData({ ...formData, giftImage: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="modal-is-active"
                  label="Enable Rule immediately (Active)"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Shift Rule"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ShiftRewardManagement;
