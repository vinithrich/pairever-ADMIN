import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import {
  DeleteStaffGiftApi,
  GetStaffGiftsApi,
  SaveStaffGiftApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const emptyGiftForm = {
  giftId: "",
  title: "",
  shortDescription: "",
  detail: "",
  category: "Popular",
  coins: "",
  buttonText: "Claim Gift",
  badgeText: "Popular",
  displayOrder: "",
  isActive: true,
};

const sampleGifts = [
  {
    id: "sample-1",
    title: "Weekly Star Bonus",
    shortDescription: "Reward high-performing staff with bonus coins.",
    detail:
      "Use this gift for weekly performance rewards, attendance streaks, or campaign achievements.",
    category: "Popular",
    coins: 250,
    badgeText: "Popular",
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sample-2",
    title: "Festival Gift Pack",
    shortDescription: "A seasonal reward card for staff celebrations.",
    detail:
      "Good for Diwali, New Year, birthday rewards, and special internal offers.",
    category: "Festival",
    coins: 500,
    badgeText: "Featured",
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80",
  },
];

const normalizeGift = (gift, index) => ({
  ...gift,
  id: gift?._id || gift?.id || gift?.giftId || `gift-${index + 1}`,
  title: gift?.title || gift?.name || "",
  shortDescription:
    gift?.shortDescription || gift?.short_description || gift?.description || "",
  detail: gift?.detail || gift?.details || gift?.longDescription || "",
  category: gift?.category || "Popular",
  coins: gift?.coins ?? gift?.coin ?? "",
  buttonText: gift?.buttonText || gift?.button_text || "Claim Gift",
  badgeText: gift?.badgeText || gift?.badge_text || "",
  displayOrder: gift?.displayOrder ?? gift?.display_order ?? "",
  isActive: gift?.isActive ?? gift?.is_active ?? gift?.status !== "inactive",
  image: gift?.image || gift?.bannerImage || gift?.banner_image || "",
});

const getGiftRows = (response) =>
  response?.data?.docs ||
  response?.data?.items ||
  response?.data?.gifts ||
  response?.data ||
  response?.gifts ||
  [];

const StaffGiftsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [gifts, setGifts] = useState([]);
  const [giftForm, setGiftForm] = useState(emptyGiftForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingGiftId, setDeletingGiftId] = useState("");

  const visibleGifts = gifts.length ? gifts : sampleGifts;

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const loadStaffGifts = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetStaffGiftsApi((resp) => {
        if (resp?.status || resp?.success) {
          const rows = getGiftRows(resp);
          setGifts(Array.isArray(rows) ? rows.map(normalizeGift) : []);
        } else {
          setGifts([]);
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    loadStaffGifts();
  }, [loadStaffGifts]);

  const activeCount = useMemo(
    () => gifts.filter((gift) => gift.isActive).length,
    [gifts]
  );

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setGiftForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      Notiflix.Notify.failure("Please select a valid banner image");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const clearForm = () => {
    setGiftForm(emptyGiftForm);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const editGift = (gift) => {
    setGiftForm({
      giftId: gift.id,
      title: gift.title,
      shortDescription: gift.shortDescription,
      detail: gift.detail,
      category: gift.category,
      coins: gift.coins,
      buttonText: gift.buttonText,
      badgeText: gift.badgeText,
      displayOrder: gift.displayOrder,
      isActive: Boolean(gift.isActive),
    });
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!giftForm.title.trim()) {
      Notiflix.Notify.failure("Please enter gift title");
      return;
    }

    if (!giftForm.shortDescription.trim()) {
      Notiflix.Notify.failure("Please enter short description");
      return;
    }

    if (!giftForm.detail.trim()) {
      Notiflix.Notify.failure("Please enter gift detail");
      return;
    }

    const payload = new FormData();
    payload.append("giftId", giftForm.giftId);
    payload.append("title", giftForm.title.trim());
    payload.append("shortDescription", giftForm.shortDescription.trim());
    payload.append("short_description", giftForm.shortDescription.trim());
    payload.append("detail", giftForm.detail.trim());
    payload.append("category", giftForm.category.trim());
    payload.append("coins", giftForm.coins);
    payload.append("buttonText", giftForm.buttonText.trim());
    payload.append("badgeText", giftForm.badgeText.trim());
    payload.append("displayOrder", giftForm.displayOrder);
    payload.append("isActive", giftForm.isActive);

    if (selectedFile) {
      payload.append("image", selectedFile);
      payload.append("bannerImage", selectedFile);
    }

    setIsSubmitting(true);

    await dispatch(
      SaveStaffGiftApi(payload, (resp) => {
        if (resp?.status || resp?.success) {
          Notiflix.Notify.success(resp?.message || "Staff gift saved");
          clearForm();
          loadStaffGifts();
        } else {
          Notiflix.Notify.failure(resp?.message || "Failed to save staff gift");
        }

        setIsSubmitting(false);
      })
    );
  };

  const handleDelete = async (gift) => {
    if (!gift?.id || deletingGiftId) {
      return;
    }

    const confirmed = window.confirm(`Delete ${gift.title || "this gift"}?`);

    if (!confirmed) {
      return;
    }

    setDeletingGiftId(gift.id);

    await dispatch(
      DeleteStaffGiftApi(
        {
          giftId: gift.id,
          id: gift.id,
        },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(resp?.message || "Staff gift deleted");
            loadStaffGifts();
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to delete staff gift"
            );
          }

          setDeletingGiftId("");
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
        <PageHeading heading="Staff Gifts" />
      </div>

      <Row className="mt-4">
        <Col xl={4} lg={5} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h4 className="mb-1">Gift Content</h4>
                  <p className="text-muted mb-0">
                    Create staff reward cards for the app.
                  </p>
                </div>
                <Badge bg={giftForm.isActive ? "success" : "secondary"}>
                  {giftForm.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Banner Image</Form.Label>
                  <div
                    className="border rounded d-flex align-items-center justify-content-center overflow-hidden mb-2"
                    style={{
                      minHeight: "160px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Staff gift banner preview"
                        className="img-fluid w-100"
                        style={{ maxHeight: "240px", objectFit: "cover" }}
                      />
                    ) : (
                      <span className="text-muted">Upload banner image</span>
                    )}
                  </div>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={giftForm.title}
                    onChange={handleChange}
                    placeholder="Weekly Star Bonus"
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Short Description</Form.Label>
                  <Form.Control
                    name="shortDescription"
                    value={giftForm.shortDescription}
                    onChange={handleChange}
                    placeholder="Reward high-performing staff"
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Detail</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="detail"
                    value={giftForm.detail}
                    onChange={handleChange}
                    placeholder="Explain who can claim this gift and when it applies"
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={giftForm.category}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="Popular">Popular</option>
                        <option value="Festival">Festival</option>
                        <option value="Performance">Performance</option>
                        <option value="Milestone">Milestone</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Coins</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        name="coins"
                        value={giftForm.coins}
                        onChange={handleChange}
                        placeholder="250"
                        disabled={isSubmitting}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Badge</Form.Label>
                      <Form.Control
                        name="badgeText"
                        value={giftForm.badgeText}
                        onChange={handleChange}
                        placeholder="Popular"
                        disabled={isSubmitting}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Order</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        name="displayOrder"
                        value={giftForm.displayOrder}
                        onChange={handleChange}
                        placeholder="1"
                        disabled={isSubmitting}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="switch"
                    id="staff-gift-active-switch"
                    name="isActive"
                    label={giftForm.isActive ? "Visible in app" : "Hidden from app"}
                    checked={giftForm.isActive}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Gift"}
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
                  <div className="text-muted small">Total gifts</div>
                  <div className="fs-3 fw-bold">{gifts.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Active gifts</div>
                  <div className="fs-3 fw-bold">{activeCount}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Preview mode</div>
                  <div className="fs-5 fw-bold">
                    {gifts.length ? "Live data" : "Sample ideas"}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <h4 className="mb-0">Popular Gifts Preview</h4>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={loadStaffGifts}
                  disabled={isLoading}
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <Row>
                {visibleGifts.slice(0, 4).map((gift) => (
                  <Col xl={6} className="mb-3" key={gift.id}>
                    <Card className="h-100 overflow-hidden">
                      <div
                        className="position-relative"
                        style={{
                          aspectRatio: "16 / 8",
                          backgroundColor: "#f1f3f5",
                        }}
                      >
                        {gift.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={gift.image}
                            alt={gift.title}
                            className="w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null}
                        {gift.badgeText ? (
                          <Badge
                            bg="warning"
                            text="dark"
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {gift.badgeText}
                          </Badge>
                        ) : null}
                      </div>
                      <Card.Body>
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div>
                            <h5 className="mb-1">{gift.title || "-"}</h5>
                            <div className="text-muted small">
                              {gift.category}
                            </div>
                          </div>
                          <Badge bg={gift.isActive ? "success" : "secondary"}>
                            {gift.isActive ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                        <p className="text-muted mt-3 mb-3">
                          {gift.shortDescription || "-"}
                        </p>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="fw-bold">
                            {gift.coins || 0} coins
                          </div>
                          <Button size="sm" variant="outline-primary">
                            {gift.buttonText || "Claim Gift"}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Coins</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Loading staff gifts...
                    </td>
                  </tr>
                ) : gifts.length > 0 ? (
                  gifts.map((gift, index) => (
                    <tr key={gift.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{gift.title}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: "320px" }}>
                          {gift.shortDescription}
                        </div>
                      </td>
                      <td>{gift.category}</td>
                      <td>{gift.coins || 0}</td>
                      <td>
                        <Badge bg={gift.isActive ? "success" : "secondary"}>
                          {gift.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => editGift(gift)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingGiftId === gift.id}
                            onClick={() => handleDelete(gift)}
                          >
                            {deletingGiftId === gift.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No staff gifts found. Sample preview is shown above.
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

export default StaffGiftsPage;
