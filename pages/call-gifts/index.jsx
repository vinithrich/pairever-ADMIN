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
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";
import {
  DeleteCallGiftApi,
  GetCallGiftsApi,
  GetCallGiftTransactionsApi,
  SaveCallGiftApi,
  UpdateCallGiftPayoutStatusApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const emptyGiftForm = {
  giftId: "",
  name: "",
  coins: "",
  staffAmount: "",
  displayOrder: "",
  isActive: true,
};

const getRows = (response) =>
  response?.data?.docs || response?.data?.items || response?.data || [];

const normalizeGift = (gift, index) => ({
  ...gift,
  id: gift?._id || gift?.id || `call-gift-${index + 1}`,
  name: gift?.name || "",
  image: gift?.image || "",
  coins: gift?.coins ?? "",
  staffAmount: gift?.staffAmount ?? "",
  displayOrder: gift?.displayOrder ?? "",
  isActive: gift?.isActive !== false,
});

// Object URLs must be revoked or the tab leaks one per file picked.
const useImagePreview = (file) => {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return previewUrl;
};

// Shared by the create card and the edit modal so the two can never drift apart.
const GiftFormFields = ({
  form,
  onChange,
  onFileChange,
  fileInputRef,
  imageUrl,
  disabled,
  idPrefix,
}) => (
  <>
    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">Gift Image</Form.Label>
      <div
        className="border rounded d-flex align-items-center justify-content-center overflow-hidden mb-2"
        style={{ minHeight: "150px", backgroundColor: "#f8f9fa" }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Call gift preview"
            style={{ maxHeight: "150px", objectFit: "contain" }}
          />
        ) : (
          <span className="text-muted">Upload gift image</span>
        )}
      </div>
      <Form.Control
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        disabled={disabled}
      />
      {form.giftId ? (
        <Form.Text className="text-muted">
          Leave empty to keep the current image.
        </Form.Text>
      ) : null}
    </Form.Group>

    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">Gift Name</Form.Label>
      <Form.Control
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Rose"
        disabled={disabled}
      />
    </Form.Group>

    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Coins (user pays)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="1"
            name="coins"
            value={form.coins}
            onChange={onChange}
            placeholder="50"
            disabled={disabled}
          />
          <Form.Text className="text-muted">
            Deducted from the user&apos;s coin balance.
          </Form.Text>
        </Form.Group>
      </Col>

      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Staff Amount (₹)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            name="staffAmount"
            value={form.staffAmount}
            onChange={onChange}
            placeholder="5"
            disabled={disabled}
          />
          <Form.Text className="text-muted">
            Credited to the staff&apos;s earnings.
          </Form.Text>
        </Form.Group>
      </Col>
    </Row>

    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">Display Order</Form.Label>
      <Form.Control
        type="number"
        min="0"
        name="displayOrder"
        value={form.displayOrder}
        onChange={onChange}
        placeholder="1"
        disabled={disabled}
      />
    </Form.Group>

    <Form.Group className="mb-2">
      <Form.Check
        type="switch"
        id={`${idPrefix}-active-switch`}
        name="isActive"
        label={form.isActive ? "Visible in app" : "Hidden from app"}
        checked={form.isActive}
        onChange={onChange}
        disabled={disabled}
      />
    </Form.Group>
  </>
);

const CallGiftsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const createFileRef = useRef(null);
  const editFileRef = useRef(null);

  const [gifts, setGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingGiftId, setDeletingGiftId] = useState("");

  // Create (inline card)
  const [createForm, setCreateForm] = useState(emptyGiftForm);
  const [createFile, setCreateFile] = useState(null);
  const createPreview = useImagePreview(createFile);
  const [isCreating, setIsCreating] = useState(false);

  // Edit (modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(emptyGiftForm);
  const [editFile, setEditFile] = useState(null);
  const editPreview = useImagePreview(editFile);
  const [editExistingImage, setEditExistingImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txnSummary, setTxnSummary] = useState(null);
  const [isTxnLoading, setIsTxnLoading] = useState(true);
  const [txnStatusFilter, setTxnStatusFilter] = useState("all");
  const [updatingTxnId, setUpdatingTxnId] = useState("");

  // Shared confirm dialog: { title, body, confirmLabel, variant, onConfirm }.
  // Replaces window.confirm so confirmations match the rest of the panel.
  const [confirmModal, setConfirmModal] = useState(null);

  // Master switch for the whole gift feature. Stored in SystemSettings (shared with
  // the System Settings page), not on an individual gift.
  const [giftIconEnabled, setGiftIconEnabled] = useState(true);
  const [isTogglingFeature, setIsTogglingFeature] = useState(false);

  const loadGifts = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetCallGiftsApi((resp) => {
        if (resp?.status || resp?.success) {
          const rows = getRows(resp);
          setGifts(Array.isArray(rows) ? rows.map(normalizeGift) : []);
        } else {
          setGifts([]);
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  const loadFeatureFlag = useCallback(async () => {
    try {
      const resp = await apiHelper.getRequest("settings");
      if (resp?.status) {
        setGiftIconEnabled(resp.data?.giftIconEnabled !== false);
      }
    } catch (err) {
      console.error("Fetch gift feature flag error:", err);
    }
  }, []);

  const handleFeatureToggle = async (nextEnabled) => {
    setIsTogglingFeature(true);
    // Optimistic: the switch should respond immediately; reverted below on failure.
    setGiftIconEnabled(nextEnabled);

    try {
      const resp = await apiHelper.postRequest("settings", {
        giftIconEnabled: nextEnabled,
      });

      if (resp?.status) {
        setGiftIconEnabled(resp.data?.giftIconEnabled !== false);
        Notiflix.Notify.success(
          nextEnabled
            ? "Gift icon is now visible in the app"
            : "Gift icon is now hidden from the app"
        );
      } else {
        setGiftIconEnabled(!nextEnabled);
        Notiflix.Notify.failure(resp?.message || "Failed to update setting");
      }
    } catch (err) {
      setGiftIconEnabled(!nextEnabled);
      Notiflix.Notify.failure("An error occurred while updating the setting");
    } finally {
      setIsTogglingFeature(false);
    }
  };

  const loadTransactions = useCallback(async () => {
    setIsTxnLoading(true);

    const query =
      txnStatusFilter === "all"
        ? "limit=20"
        : `limit=20&payoutStatus=${txnStatusFilter}`;

    await dispatch(
      GetCallGiftTransactionsApi(query, (resp) => {
        if (resp?.status || resp?.success) {
          const rows = getRows(resp);
          setTransactions(Array.isArray(rows) ? rows : []);
          setTxnSummary(resp?.summary || null);
        } else {
          setTransactions([]);
          setTxnSummary(null);
        }

        setIsTxnLoading(false);
      })
    );
  }, [dispatch, txnStatusFilter]);

  useEffect(() => {
    loadGifts();
    loadTransactions();
    loadFeatureFlag();
  }, [loadGifts, loadTransactions, loadFeatureFlag]);

  const activeCount = useMemo(
    () => gifts.filter((gift) => gift.isActive).length,
    [gifts]
  );

  const makeChangeHandler = (setForm) => (event) => {
    const { name, type, checked, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const makeFileHandler = (setFile) => (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      Notiflix.Notify.failure("Please select a valid gift image");
      event.target.value = "";
      return;
    }

    setFile(file);
  };

  // Returns the FormData to POST, or null after reporting the first problem found.
  const buildPayload = (form, file) => {
    if (!form.name.trim()) {
      Notiflix.Notify.failure("Please enter the gift name");
      return null;
    }

    const coins = Number(form.coins);
    if (!Number.isFinite(coins) || coins < 0) {
      Notiflix.Notify.failure("Please enter a valid coin price");
      return null;
    }

    const staffAmount = Number(form.staffAmount);
    if (!Number.isFinite(staffAmount) || staffAmount < 0) {
      Notiflix.Notify.failure("Please enter a valid staff amount in rupees");
      return null;
    }

    // Only a new gift needs an image up front; an edit keeps the stored one.
    if (!form.giftId && !file) {
      Notiflix.Notify.failure("Please upload a gift image");
      return null;
    }

    const payload = new FormData();
    payload.append("giftId", form.giftId);
    payload.append("name", form.name.trim());
    payload.append("coins", coins);
    payload.append("staffAmount", staffAmount);
    payload.append("displayOrder", form.displayOrder || 0);
    payload.append("isActive", form.isActive);

    if (file) {
      payload.append("image", file);
    }

    return payload;
  };

  const clearCreateForm = () => {
    setCreateForm(emptyGiftForm);
    setCreateFile(null);

    if (createFileRef.current) {
      createFileRef.current.value = "";
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const payload = buildPayload(createForm, createFile);
    if (!payload) return;

    setIsCreating(true);

    await dispatch(
      SaveCallGiftApi(payload, (resp) => {
        if (resp?.status || resp?.success) {
          Notiflix.Notify.success(resp?.message || "Call gift created");
          clearCreateForm();
          loadGifts();
        } else {
          Notiflix.Notify.failure(resp?.message || "Failed to save call gift");
        }

        setIsCreating(false);
      })
    );
  };

  const openEditModal = (gift) => {
    setEditForm({
      giftId: gift.id,
      name: gift.name,
      coins: gift.coins,
      staffAmount: gift.staffAmount,
      displayOrder: gift.displayOrder,
      isActive: Boolean(gift.isActive),
    });
    setEditFile(null);
    setEditExistingImage(gift.image || "");

    if (editFileRef.current) {
      editFileRef.current.value = "";
    }

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (isSaving) return;

    setShowEditModal(false);
    setEditFile(null);
    setEditExistingImage("");

    if (editFileRef.current) {
      editFileRef.current.value = "";
    }
  };

  const handleEditSave = async (event) => {
    event.preventDefault();

    const payload = buildPayload(editForm, editFile);
    if (!payload) return;

    setIsSaving(true);

    await dispatch(
      SaveCallGiftApi(payload, (resp) => {
        setIsSaving(false);

        if (resp?.status || resp?.success) {
          Notiflix.Notify.success(resp?.message || "Call gift updated");
          setShowEditModal(false);
          setEditFile(null);
          setEditExistingImage("");
          loadGifts();
        } else {
          // Keep the modal open so the entered values aren't lost.
          Notiflix.Notify.failure(
            resp?.message || "Failed to update call gift"
          );
        }
      })
    );
  };

  // --- payout status -------------------------------------------------------
  const runPayoutStatus = async (txn, payoutStatus) => {
    setUpdatingTxnId(txn._id);

    await dispatch(
      UpdateCallGiftPayoutStatusApi(
        { transactionId: txn._id, payoutStatus },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(resp?.message || "Payout status updated");
            loadTransactions();
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to update payout status"
            );
          }

          setUpdatingTxnId("");
        }
      )
    );
  };

  const askPayoutStatus = (txn, payoutStatus) => {
    if (!txn?._id || updatingTxnId) return;

    const toPaid = payoutStatus === "paid";

    setConfirmModal({
      title: toPaid ? "Mark payout as paid" : "Move payout back to pending",
      variant: toPaid ? "success" : "secondary",
      confirmLabel: toPaid ? "Mark Paid" : "Move to Pending",
      body: (
        <>
          <p className="mb-2">
            <span className="fw-semibold">{txn.staffName || "Staff"}</span>
            {txn.staffMemberID ? (
              <span className="text-muted small"> ({txn.staffMemberID})</span>
            ) : null}
          </p>
          <p className="mb-3">
            <span className="fs-4 fw-bold">₹{txn.staffAmount || 0}</span>{" "}
            <span className="text-muted">
              for &quot;{txn.giftName || "gift"}&quot;
            </span>
          </p>
          <div className="alert alert-warning mb-0 py-2 px-3 small">
            This records your bookkeeping only — it does not transfer any money.
            The staff&apos;s earnings were credited when the gift was sent.
          </div>
        </>
      ),
      onConfirm: () => runPayoutStatus(txn, payoutStatus),
    });
  };

  // --- delete a gift -------------------------------------------------------
  const runDelete = async (gift) => {
    setDeletingGiftId(gift.id);

    await dispatch(
      DeleteCallGiftApi({ giftId: gift.id, id: gift.id }, (resp) => {
        if (resp?.status || resp?.success) {
          Notiflix.Notify.success(resp?.message || "Call gift deleted");
          loadGifts();
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Failed to delete call gift"
          );
        }

        setDeletingGiftId("");
      })
    );
  };

  const askDelete = (gift) => {
    if (!gift?.id || deletingGiftId) return;

    setConfirmModal({
      title: "Delete gift",
      variant: "danger",
      confirmLabel: "Delete",
      body: (
        <>
          <p className="mb-2">
            Delete{" "}
            <span className="fw-semibold">{gift.name || "this gift"}</span>?
          </p>
          <div className="alert alert-warning mb-0 py-2 px-3 small">
            Users will no longer see it in the call gift tray. Gifts already sent
            keep their history and payouts.
          </div>
        </>
      ),
      onConfirm: () => runDelete(gift),
    });
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Call Gifts" />
      </div>

      <Row className="mt-4">
        <Col xs={12} className="mb-4">
          <Card
            className="shadow-sm"
            border={giftIconEnabled ? "success" : "warning"}
          >
            <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-3 py-3">
              <div>
                <h5 className="mb-1">
                  Gift Icon in App{" "}
                  <Badge bg={giftIconEnabled ? "success" : "warning"} text={giftIconEnabled ? undefined : "dark"}>
                    {giftIconEnabled ? "Visible" : "Hidden"}
                  </Badge>
                </h5>
                <p className="text-muted mb-0">
                  {giftIconEnabled
                    ? "Users see the gift icon during calls and can send gifts."
                    : "The gift icon is hidden, the gift list returns empty, and sending a gift is rejected."}
                </p>
              </div>
              <Form.Check
                type="switch"
                id="gift-feature-switch"
                className="fs-4 mb-0"
                checked={giftIconEnabled}
                disabled={isTogglingFeature}
                onChange={(e) => handleFeatureToggle(e.target.checked)}
                label={isTogglingFeature ? "Saving..." : ""}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4} lg={5} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h4 className="mb-1">Create Gift</h4>
                  <p className="text-muted mb-0">
                    Gifts users send to staff during a call.
                  </p>
                </div>
                <Badge bg={createForm.isActive ? "success" : "secondary"}>
                  {createForm.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>

              <Form onSubmit={handleCreate}>
                <GiftFormFields
                  form={createForm}
                  onChange={makeChangeHandler(setCreateForm)}
                  onFileChange={makeFileHandler(setCreateFile)}
                  fileInputRef={createFileRef}
                  imageUrl={createPreview}
                  disabled={isCreating}
                  idPrefix="create-call-gift"
                />

                <div className="d-flex gap-2 mt-3">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Saving..." : "Create Gift"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearCreateForm}
                    disabled={isCreating}
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
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Total gifts</div>
                  <div className="fs-3 fw-bold">{gifts.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Active gifts</div>
                  <div className="fs-3 fw-bold">{activeCount}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Coins collected</div>
                  <div className="fs-3 fw-bold">
                    {txnSummary?.totalCoins ?? 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-muted small">Pending payout</div>
                  <div className="fs-3 fw-bold text-warning">
                    ₹{txnSummary?.pendingAmount ?? 0}
                  </div>
                  <div className="text-muted small">
                    ₹{txnSummary?.paidAmount ?? 0} already paid
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Body className="d-flex align-items-center justify-content-between gap-3 pb-0">
              <h4 className="mb-3">Gift Catalog</h4>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={loadGifts}
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </Card.Body>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Image</th>
                  <th>Gift Name</th>
                  <th>Coins (user pays)</th>
                  <th>Staff Amount (₹)</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      Loading call gifts...
                    </td>
                  </tr>
                ) : gifts.length > 0 ? (
                  gifts.map((gift, index) => (
                    <tr key={gift.id}>
                      <td>{index + 1}</td>
                      <td>
                        {gift.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={gift.image}
                            alt={gift.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="fw-semibold">{gift.name}</td>
                      <td>{gift.coins || 0}</td>
                      <td>₹{gift.staffAmount || 0}</td>
                      <td>{gift.displayOrder || 0}</td>
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
                            onClick={() => openEditModal(gift)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingGiftId === gift.id}
                            onClick={() => askDelete(gift)}
                          >
                            {deletingGiftId === gift.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No call gifts yet. Create one on the left.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>

          <Card>
            <Card.Body className="d-flex align-items-center justify-content-between gap-3 pb-0">
              <h4 className="mb-3">Gifts Sent &amp; Payouts</h4>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Form.Select
                  size="sm"
                  style={{ width: "150px" }}
                  value={txnStatusFilter}
                  onChange={(e) => setTxnStatusFilter(e.target.value)}
                  disabled={isTxnLoading}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending only</option>
                  <option value="paid">Paid only</option>
                </Form.Select>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={loadTransactions}
                  disabled={isTxnLoading}
                >
                  {isTxnLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </Card.Body>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Gift</th>
                  <th>From (User)</th>
                  <th>To (Staff)</th>
                  <th>Coins</th>
                  <th>Staff Amount (₹)</th>
                  <th>Payout Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isTxnLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      Loading gift history...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td>
                        {txn.createdAt
                          ? new Date(txn.createdAt).toLocaleString("en-GB")
                          : "-"}
                      </td>
                      <td>{txn.giftName || "-"}</td>
                      <td>
                        <div>{txn.userName || "-"}</div>
                        <div className="text-muted small">
                          {txn.userMemberID}
                        </div>
                      </td>
                      <td>
                        <div>{txn.staffName || "-"}</div>
                        <div className="text-muted small">
                          {txn.staffMemberID}
                        </div>
                      </td>
                      <td>{txn.coinsSpent || 0}</td>
                      <td>₹{txn.staffAmount || 0}</td>
                      <td>
                        {txn.payoutStatus === "paid" ? (
                          <>
                            <Badge bg="success">Paid</Badge>
                            {txn.paidAt ? (
                              <div className="text-muted small">
                                {new Date(txn.paidAt).toLocaleDateString(
                                  "en-GB"
                                )}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td>
                        {txn.payoutStatus === "paid" ? (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={updatingTxnId === txn._id}
                            onClick={() => askPayoutStatus(txn, "pending")}
                          >
                            {updatingTxnId === txn._id
                              ? "Saving..."
                              : "Undo"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            disabled={updatingTxnId === txn._id}
                            onClick={() => askPayoutStatus(txn, "paid")}
                          >
                            {updatingTxnId === txn._id
                              ? "Saving..."
                              : "Mark Paid"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {txnStatusFilter === "all"
                        ? "No gifts sent yet."
                        : `No ${txnStatusFilter} payouts.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* Confirm dialog — used for Mark Paid / Undo and gift deletion */}
      <Modal
        show={Boolean(confirmModal)}
        onHide={() => setConfirmModal(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">{confirmModal?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmModal?.body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmModal(null)}>
            Cancel
          </Button>
          <Button
            variant={confirmModal?.variant || "primary"}
            onClick={() => {
              const action = confirmModal?.onConfirm;
              // Close first: the action sets its own row-level "Saving..." state,
              // so leaving the dialog open would double up the busy indicators.
              setConfirmModal(null);
              if (action) action();
            }}
          >
            {confirmModal?.confirmLabel || "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit gift */}
      <Modal show={showEditModal} onHide={closeEditModal} centered size="lg">
        <Form onSubmit={handleEditSave}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Gift{editForm.name ? ` — ${editForm.name}` : ""}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <GiftFormFields
              form={editForm}
              onChange={makeChangeHandler(setEditForm)}
              onFileChange={makeFileHandler(setEditFile)}
              fileInputRef={editFileRef}
              imageUrl={editPreview || editExistingImage}
              disabled={isSaving}
              idPrefix="edit-call-gift"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeEditModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CallGiftsPage;
