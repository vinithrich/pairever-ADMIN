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



const TASK_TYPE_OPTIONS = [
  { key: "min_call_duration", label: "Paid Calls Duration (e.g. Spoke > 5 mins)" },
  { key: "daily_online_hours", label: "Daily Online Hours (e.g. Online > 3 hours)" },
  { key: "slot_audio_online", label: "Audio Slot Online (e.g. Audio online 8PM-12AM)" },
  { key: "slot_video_online", label: "Video Slot Online (e.g. Video online 8PM-12AM)" },
];

const defaultTaskItem = {
  taskId: `task_${Date.now()}_1`,
  taskType: "min_call_duration",
  title: "Paid calls where you spoke more than 5 minutes",
  minCallMinutes: 5,
  minDailyOnlineHours: 3,
  slotStartTime: "20:00",
  slotEndTime: "00:00",
  slotMinMinutes: 30,
  targetCount: 10,
  tipsText: "Tips",
};

const defaultCampaignForm = {
  title: "Complete 4 simple tasks and earn more money",
  videoUrl: "",
  startDate: new Date().toISOString().substring(0, 10),
  endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
  rewardType: "amount",
  rewardValue: 500,
  giftTitle: "",
  giftImage: "",
  tasks: [
    {
      taskId: "task_1",
      taskType: "min_call_duration",
      title: "Paid calls where you spoke more than 5 minutes",
      minCallMinutes: 5,
      targetCount: 10,
      tipsText: "Tips",
    },
    {
      taskId: "task_2",
      taskType: "daily_online_hours",
      title: "Days when you were online for over 3 hours",
      minDailyOnlineHours: 3,
      targetCount: 4,
      tipsText: "Tips",
    },
    {
      taskId: "task_3",
      taskType: "slot_audio_online",
      title: "Days when you were Audio online for 30 mins between 8PM to 12AM",
      slotStartTime: "20:00",
      slotEndTime: "00:00",
      slotMinMinutes: 30,
      targetCount: 4,
      tipsText: "Tips",
    },
    {
      taskId: "task_4",
      taskType: "slot_video_online",
      title: "Days when you were Video online for 15 mins between 8PM to 12AM",
      slotStartTime: "20:00",
      slotEndTime: "00:00",
      slotMinMinutes: 15,
      targetCount: 4,
      tipsText: "Tips",
    },
  ],
  isActive: true,
};

const TaskCampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultCampaignForm);
  const [submitting, setSubmitting] = useState(false);

  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimPage, setClaimPage] = useState(1);
  const [claimTotalPages, setClaimTotalPages] = useState(1);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiHelper.getRequest("task-campaigns");
      if (response && response.status !== false && Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else if (Array.isArray(response)) {
        setCampaigns(response);
      } else {
        setCampaigns(response?.data?.campaigns || response?.data?.docs || []);
      }
    } catch (err) {
      console.error("Fetch campaigns error:", err);
      Notiflix.Notify.failure(err.message || "Failed to load task campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async (page = 1) => {
    setLoadingClaims(true);
    try {
      const response = await apiHelper.getRequest(`task-campaign-claims?page=${page}&limit=10`);
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
      console.error("Fetch task campaign claims error:", err);
    } finally {
      setLoadingClaims(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchClaims(1);
  }, [fetchCampaigns, fetchClaims]);



  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(defaultCampaignForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (campaign) => {
    setEditingId(campaign._id);
    setFormData({
      title: campaign.title || "",
      videoUrl: campaign.videoUrl || "",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().substring(0, 10) : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().substring(0, 10) : "",
      rewardType: campaign.rewardType || "amount",
      rewardValue: campaign.rewardValue || 0,
      giftTitle: campaign.giftTitle || "",
      giftImage: campaign.giftImage || "",
      tasks: campaign.tasks || [],
      isActive: campaign.isActive !== undefined ? campaign.isActive : true,
    });
    setShowModal(true);
  };

  const handleAddTask = () => {
    const newTask = {
      ...defaultTaskItem,
      taskId: `task_${Date.now()}_${formData.tasks.length + 1}`,
    };
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
  };

  const handleRemoveTask = (index) => {
    const updatedTasks = formData.tasks.filter((_, idx) => idx !== index);
    setFormData({ ...formData, tasks: updatedTasks });
  };

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...formData.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setFormData({ ...formData, tasks: updatedTasks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.endDate) {
      Notiflix.Notify.warning("Please fill in Campaign Title and End Date");
      return;
    }
    if (formData.tasks.length === 0) {
      Notiflix.Notify.warning("Please add at least 1 task to the campaign");
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await apiHelper.postRequest(`task-campaigns/update/${editingId}`, formData);
      } else {
        res = await apiHelper.postRequest("task-campaigns", formData);
      }

      if (res && res.status !== false) {
        Notiflix.Notify.success(
          editingId
            ? "Task campaign updated successfully"
            : "Task campaign created successfully"
        );
        setShowModal(false);
        fetchCampaigns();
      } else {
        Notiflix.Notify.failure(res?.message || "Failed to save campaign");
      }
    } catch (err) {
      console.error("Submit campaign error:", err);
      Notiflix.Notify.failure(err.message || "Error saving task campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Notiflix.Confirm.show(
      "Confirm Delete",
      "Are you sure you want to delete this task campaign?",
      "Yes, Delete",
      "Cancel",
      async () => {
        try {
          const res = await apiHelper.postRequest(`task-campaigns/delete/${id}`, {});
          if (res && res.status !== false) {
            Notiflix.Notify.success("Task campaign deleted");
            fetchCampaigns();
          } else {
            Notiflix.Notify.failure(res?.message || "Failed to delete campaign");
          }
        } catch (err) {
          console.error("Delete campaign error:", err);
          Notiflix.Notify.failure(err.message || "Failed to delete campaign");
        }
      }
    );
  };

  const handleToggleStatus = async (campaign) => {
    try {
      const res = await apiHelper.postRequest(`task-campaigns/update/${campaign._id}`, {
        isActive: !campaign.isActive,
      });
      if (res && res.status !== false) {
        Notiflix.Notify.success(
          `Campaign ${!campaign.isActive ? "activated" : "deactivated"} successfully`
        );
        fetchCampaigns();
      }
    } catch (err) {
      Notiflix.Notify.failure(err.message || "Failed to toggle status");
    }
  };

  return (
    <Container fluid className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <PageHeading heading="Task Campaigns & Rewards Management" />
          <p className="text-muted mb-0">
            Create, edit, and manage multi-task staff campaigns with custom tasks, expiry dates, and cash/gift rewards.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          + Create Task Campaign
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-dark py-3">
          <h5 className="mb-0">Active & Configured Campaigns</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No task campaigns configured yet. Click <strong>+ Create Task Campaign</strong> to add one.
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Campaign Title</th>
                  <th>Date Range</th>
                  <th>Tasks Count</th>
                  <th>Reward Type</th>
                  <th>Reward Value</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, idx) => (
                  <tr key={c._id || idx}>
                    <td>{idx + 1}</td>
                    <td className="fw-semibold">{c.title}</td>
                    <td>
                      <small className="text-muted">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <Badge bg="secondary">{c.tasks?.length || 0} Tasks</Badge>
                    </td>
                    <td>
                      <Badge bg={c.rewardType === "gift" ? "purple" : "success"}>
                        {c.rewardType === "gift" ? "Gift Item" : "Cash Amount"}
                      </Badge>
                    </td>
                    <td className="fw-bold">
                      {c.rewardType === "amount"
                        ? `₹${c.rewardValue}`
                        : `${c.giftTitle || "Gift"} (Val: ${c.rewardValue})`}
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`campaign-status-${c._id}`}
                        checked={Boolean(c.isActive)}
                        onChange={() => handleToggleStatus(c)}
                        label={c.isActive ? "Active" : "Inactive"}
                      />
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenEditModal(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(c._id)}
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

      {/* Staff Task Campaign Claims History Card */}
      <Card className="shadow-sm mt-5">
        <Card.Header className="bg-dark py-3">
          <h5 className="mb-0 text-white">Staff Task Campaign Claims History</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loadingClaims ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading campaign claims history...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No task campaign claims recorded yet.
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Staff Member</th>
                  <th>Campaign Title</th>
                  <th>Task Progress</th>
                  <th>Reward</th>
                  <th>Claim Status</th>
                  <th>Claimed Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, idx) => {
                  const completedTasksCount = (claim.taskProgress || []).filter(
                    (t) => t.isCompleted
                  ).length;
                  const totalTasksCount = claim.taskProgress?.length || 0;

                  return (
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
                          {claim.campaignId?.title || "Task Campaign"}
                        </div>
                        {claim.campaignId?.startDate && claim.campaignId?.endDate && (
                          <small className="text-muted">
                            ({new Date(claim.campaignId.startDate).toLocaleDateString()} -{" "}
                            {new Date(claim.campaignId.endDate).toLocaleDateString()})
                          </small>
                        )}
                      </td>
                      <td>
                        <Badge bg="info" className="text-dark">
                          {completedTasksCount} / {totalTasksCount} Tasks Completed
                        </Badge>
                      </td>
                      <td className="fw-bold">
                        {claim.rewardType === "amount"
                          ? `₹${claim.rewardValue}`
                          : `${claim.campaignId?.giftTitle || claim.giftTitle || "Gift"} (₹${claim.rewardValue})`}
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
                  );
                })}
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




      {/* Create / Edit Campaign Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Edit Task Campaign" : "Create Task Campaign"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>
            <Row className="g-3 mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Campaign Title *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Complete 4 simple tasks and earn more money"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Watch Video URL (Optional Tutorial Link)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://youtube.com/..."
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Reward Type *</Form.Label>
                  <Form.Select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                  >
                    <option value="amount">Cash Amount (₹ / Coins)</option>
                    <option value="gift">Gift Item Bonus</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {formData.rewardType === "amount" ? "Reward Amount (₹) *" : "Gift Value *"}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({ ...formData, rewardValue: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Campaign Task List ({formData.tasks.length})</h5>
              <Button variant="outline-success" size="sm" onClick={handleAddTask}>
                + Add Task Card
              </Button>
            </div>

            {formData.tasks.map((task, idx) => (
              <Card key={idx} className="mb-3 border-light bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary">Task #{idx + 1}</span>
                    {formData.tasks.length > 1 && (
                      <Button
                        variant="link"
                        className="text-danger p-0 text-decoration-none"
                        onClick={() => handleRemoveTask(idx)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Task Type</Form.Label>
                        <Form.Select
                          size="sm"
                          value={task.taskType}
                          onChange={(e) => handleTaskChange(idx, "taskType", e.target.value)}
                        >
                          {TASK_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Task Title Text</Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={task.title}
                          onChange={(e) => handleTaskChange(idx, "title", e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {task.taskType === "min_call_duration" && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small mb-1">Min Call Duration (Minutes)</Form.Label>
                          <Form.Control
                            size="sm"
                            type="number"
                            value={task.minCallMinutes || 5}
                            onChange={(e) =>
                              handleTaskChange(idx, "minCallMinutes", Number(e.target.value))
                            }
                          />
                        </Form.Group>
                      </Col>
                    )}

                    {task.taskType === "daily_online_hours" && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small mb-1">Min Daily Hours Online</Form.Label>
                          <Form.Control
                            size="sm"
                            type="number"
                            value={task.minDailyOnlineHours || 3}
                            onChange={(e) =>
                              handleTaskChange(idx, "minDailyOnlineHours", Number(e.target.value))
                            }
                          />
                        </Form.Group>
                      </Col>
                    )}

                    {(task.taskType === "slot_audio_online" || task.taskType === "slot_video_online") && (
                      <>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="small mb-1">Slot Start</Form.Label>
                            <Form.Control
                              size="sm"
                              type="time"
                              value={task.slotStartTime || "20:00"}
                              onChange={(e) => handleTaskChange(idx, "slotStartTime", e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="small mb-1">Slot End</Form.Label>
                            <Form.Control
                              size="sm"
                              type="time"
                              value={task.slotEndTime || "00:00"}
                              onChange={(e) => handleTaskChange(idx, "slotEndTime", e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small mb-1">Slot Min Mins</Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              value={task.slotMinMinutes || 15}
                              onChange={(e) =>
                                handleTaskChange(idx, "slotMinMinutes", Number(e.target.value))
                              }
                            />
                          </Form.Group>
                        </Col>
                      </>
                    )}

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Target Count (Calls / Days)</Form.Label>
                        <Form.Control
                          size="sm"
                          type="number"
                          value={task.targetCount || 10}
                          onChange={(e) =>
                            handleTaskChange(idx, "targetCount", Number(e.target.value))
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Campaign" : "Create Campaign"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default TaskCampaignManagement;
