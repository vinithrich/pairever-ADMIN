import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table,
  Badge,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";

const PopupsManagementPage = () => {
  const router = useRouter();
  const [popups, setPopups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [currentPopupId, setCurrentPopupId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [enabled, setEnabled] = useState(true);
  const [isWelcome, setIsWelcome] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPopups = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await apiHelper.getRequest("popups");
      if (resp?.status) {
        setPopups(resp.data || []);
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to fetch popups");
      }
    } catch (err) {
      console.error("Fetch popups error:", err);
      Notiflix.Notify.failure("An error occurred while fetching popups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setCurrentPopupId(null);
    setTitle("");
    setDescription("");
    setImage("");
    setImageFile(null);
    setImagePreview("");
    setTargetRole("all");
    setEnabled(true);
    setIsWelcome(false);
    setShowModal(true);
  };

  const handleOpenEdit = (popup) => {
    setModalMode("edit");
    setCurrentPopupId(popup._id);
    setTitle(popup.title || "");
    setDescription(popup.description || "");
    setImage(popup.image || "");
    setImageFile(null);
    setImagePreview(popup.image || "");
    setTargetRole(popup.targetRole || "all");
    setEnabled(popup.enabled !== undefined ? popup.enabled : true);
    setIsWelcome(popup.isWelcome !== undefined ? popup.isWelcome : false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSavePopup = async (event) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      Notiflix.Notify.failure("Title and Description are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("targetRole", targetRole);
      formData.append("enabled", enabled);
      formData.append("isWelcome", isWelcome);

      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("image", image);
      }

      if (modalMode === "edit") {
        formData.append("popupId", currentPopupId);
      }

      const resp = await apiHelper.postRequest("popups", formData, true);
      if (resp?.status) {
        Notiflix.Notify.success(resp.message || "Popup saved successfully");
        setShowModal(false);
        fetchPopups();
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to save popup");
      }
    } catch (err) {
      console.error("Save popup error:", err);
      Notiflix.Notify.failure("An error occurred while saving the popup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePopup = (popupId) => {
    Notiflix.Confirm.show(
      "Confirm Delete",
      "Are you sure you want to delete this popup? This will also remove read history for all users.",
      "Yes, Delete",
      "Cancel",
      async () => {
        try {
          const resp = await apiHelper.postRequest("popups/delete", { popupId });
          if (resp?.status) {
            Notiflix.Notify.success("Popup deleted successfully");
            fetchPopups();
          } else {
            Notiflix.Notify.failure(resp?.message || "Failed to delete popup");
          }
        } catch (err) {
          console.error("Delete popup error:", err);
          Notiflix.Notify.failure("An error occurred while deleting the popup");
        }
      }
    );
  };

  const handleToggleStatus = async (popup) => {
    try {
      const payload = {
        popupId: popup._id,
        title: popup.title,
        description: popup.description,
        image: popup.image,
        targetRole: popup.targetRole,
        enabled: !popup.enabled,
        isWelcome: popup.isWelcome,
      };
      const resp = await apiHelper.postRequest("popups", payload);
      if (resp?.status) {
        Notiflix.Notify.success("Popup status updated");
        fetchPopups();
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Toggle popup status error:", err);
      Notiflix.Notify.failure("An error occurred");
    }
  };

  return (
    <Container fluid className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="go_back d-flex align-items-center">
          <i
            className="nav-icon fe fe-arrow-left-circle me-3 text-white fs-3 cursor-pointer"
            onClick={() => router.back()}
            style={{ cursor: "pointer" }}
          />
          <PageHeading heading="Popups Management" />
        </div>
        <Button variant="primary" className="text-white fw-bold px-4" onClick={handleOpenCreate}>
          Create Popup
        </Button>
      </div>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body className="p-0">
              <Table responsive hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="py-3">Title</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Target Role</th>
                    <th className="py-3">Welcome Popup</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        Loading popups...
                      </td>
                    </tr>
                  ) : popups.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No popups configured. Click "Create Popup" to add one.
                      </td>
                    </tr>
                  ) : (
                    popups.map((popup) => (
                      <tr key={popup._id}>
                        <td className="px-4">
                          {popup.image ? (
                            <img
                              src={popup.image}
                              alt={popup.title}
                              style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "4px",
                                background: "#4a4a4a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                color: "#ccc"
                              }}
                            >
                              No Img
                            </div>
                          )}
                        </td>
                        <td className="fw-semibold text-white">{popup.title}</td>
                        <td className="text-break" style={{ maxWidth: "350px" }}>
                          {popup.description}
                        </td>
                        <td>
                          <Badge
                            bg={
                              popup.targetRole === "staff"
                                ? "info"
                                : popup.targetRole === "user"
                                ? "primary"
                                : "secondary"
                            }
                            className="text-capitalize"
                          >
                            {popup.targetRole}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={popup.isWelcome ? "success" : "secondary"}>
                            {popup.isWelcome ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td>
                          <Form.Check
                            type="switch"
                            id={`popup-status-${popup._id}`}
                            checked={popup.enabled}
                            onChange={() => handleToggleStatus(popup)}
                          />
                        </td>
                        <td className="text-end px-4">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleOpenEdit(popup)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeletePopup(popup._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create / Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {modalMode === "create" ? "Create Popup" : "Edit Popup"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSavePopup}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Popup Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter popup title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter detailed description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Popup Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2 text-center border p-2 rounded bg-light">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxHeight: "150px", maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Target Audience Role</Form.Label>
              <Form.Select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="all">All Users & Staff</option>
                <option value="user">Users Only</option>
                <option value="staff">Staff Only</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="popup-enabled-checkbox"
                label="Enabled (Show to target role)"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="popup-welcome-checkbox"
                label="Is Welcome Popup (New users only)"
                checked={isWelcome}
                onChange={(e) => setIsWelcome(e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              Close
            </Button>
            <Button variant="primary" className="text-white" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Popup"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PopupsManagementPage;
