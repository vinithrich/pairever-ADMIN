import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";

const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const LanguageOrderPage = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [supported, setSupported] = useState([]);
  const [selectedApp, setSelectedApp] = useState("0");
  // The order being edited. Kept separate from the saved copy so the page can
  // show what is unsaved and offer a discard.
  const [draft, setDraft] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Same confirm dialog the rest of the panel uses, rather than window.confirm.
  const [confirmModal, setConfirmModal] = useState(null);

  const loadOrders = useCallback(
    async ({ keepDraft = false } = {}) => {
      setIsLoading(true);
      try {
        const resp = await apiHelper.getRequest("language-order");
        if (resp?.status) {
          const data = resp.data || [];
          setRows(data);
          setSupported(resp.supportedLanguages || []);
          if (!keepDraft) {
            const current = data.find((row) => row.app.id === selectedApp);
            setDraft(current?.languages || []);
          }
        } else {
          Notiflix.Notify.failure(resp?.message || "Failed to load language order");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedApp]
  );

  useEffect(() => {
    loadOrders();
    // Only on mount: switching apps is handled below, without a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedForApp = useMemo(
    () => rows.find((row) => row.app.id === selectedApp),
    [rows, selectedApp]
  );

  const isDirty = !arraysEqual(draft, savedForApp?.languages || []);

  const applyAppSelection = (appId) => {
    setSelectedApp(appId);
    setDraft(rows.find((row) => row.app.id === appId)?.languages || []);
  };

  const selectApp = (appId) => {
    if (appId === selectedApp) return;
    if (isDirty) {
      setConfirmModal({
        title: "Discard unsaved changes?",
        body: "The order you arranged for this app has not been saved. Switching apps will discard it.",
        confirmLabel: "Discard and switch",
        variant: "danger",
        onConfirm: () => applyAppSelection(appId),
      });
      return;
    }
    applyAppSelection(appId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resp = await apiHelper.postRequest("language-order", {
        appName: selectedApp,
        languages: draft,
      });
      if (resp?.status) {
        Notiflix.Notify.success(resp?.message || "Language order saved");
        // The server normalises what it stores, so adopt its copy rather than
        // assuming the draft was accepted verbatim.
        setDraft(resp.data?.languages || draft);
        setRows((prev) =>
          prev.map((row) =>
            row.app.id === selectedApp
              ? { ...row, languages: resp.data?.languages || draft, isCustomised: true, updatedAt: resp.data?.updatedAt }
              : row
          )
        );
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to save language order");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const askReset = () =>
    setConfirmModal({
      title: "Reset to the default order?",
      body: `${selectedAppName || "This app"} will go back to the default language order.`,
      confirmLabel: "Reset to default",
      variant: "danger",
      onConfirm: handleReset,
    });

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const resp = await apiHelper.postRequest("language-order/reset", {
        appName: selectedApp,
      });
      if (resp?.status) {
        Notiflix.Notify.success(resp?.message || "Reset to default");
        setDraft(resp.data?.languages || []);
        setRows((prev) =>
          prev.map((row) =>
            row.app.id === selectedApp
              ? { ...row, languages: resp.data?.languages || [], isCustomised: false, updatedAt: null }
              : row
          )
        );
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to reset");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAppName = savedForApp?.app?.name || "";

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Language Order" />
      </div>

      <Card className="shadow-sm mt-4">
        <Card.Body>
          <h5 className="mb-1">Application</h5>
          <p className="text-muted small mb-3">
            Each app has its own order. Choose one, arrange the languages, then save.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {rows.map((row) => (
              <Button
                key={row.app.id}
                size="sm"
                variant={row.app.id === selectedApp ? "primary" : "outline-primary"}
                onClick={() => selectApp(row.app.id)}
              >
                {row.app.name}
                {row.isCustomised && (
                  <Badge bg="success" className="ms-2">
                    custom
                  </Badge>
                )}
              </Button>
            ))}
            {isLoading && !rows.length && (
              <span className="text-muted">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading applications...
              </span>
            )}
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4 mt-1">
        <Col xs={12} lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
                <div>
                  <h5 className="mb-1">
                    {selectedAppName ? `${selectedAppName} — language order` : "Language order"}
                  </h5>
                  <p className="text-muted small mb-0">
                    Position 1 is shown first in the app.
                    {savedForApp?.isCustomised === false && " Currently using the default order."}
                  </p>
                </div>
                {isDirty && <Badge bg="warning" text="dark">Unsaved</Badge>}
              </div>

              <Table className="mb-3 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>#</th>
                    <th>Language</th>
                    <th className="text-end" style={{ width: 170 }}>Move</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted">
                        {isLoading ? "Loading..." : "No languages"}
                      </td>
                    </tr>
                  ) : (
                    draft.map((language, index) => (
                      <tr key={language}>
                        <td className="fw-bold">{index + 1}</td>
                        <td className="fw-semibold">
                          {language}
                          {language === "All" && (
                            <span className="text-muted small ms-2">
                              (filter reset option)
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="me-1"
                            title="Move to top"
                            disabled={index === 0}
                            onClick={() => setDraft((prev) => move(prev, index, 0))}
                          >
                            ⇈
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="me-1"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => setDraft((prev) => move(prev, index, index - 1))}
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            title="Move down"
                            disabled={index === draft.length - 1}
                            onClick={() => setDraft((prev) => move(prev, index, index + 1))}
                          >
                            ↓
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || isLoading || !isDirty}
                >
                  {isSaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    "Save order"
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setDraft(savedForApp?.languages || [])}
                  disabled={!isDirty || isSaving}
                >
                  Discard changes
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={askReset}
                  disabled={isSaving || !savedForApp?.isCustomised}
                >
                  Reset to default
                </Button>
              </div>

              {supported.length > 0 && (
                <p className="text-muted small mb-0 mt-3">
                  Languages are fixed by the apps: {supported.join(", ")}. Only the
                  order is configurable here.
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                <div>
                  <h5 className="mb-1">All applications</h5>
                  <p className="text-muted small mb-0">
                    What each app is serving right now.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => loadOrders({ keepDraft: isDirty })}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Application</th>
                      <th>Order</th>
                      <th className="text-end">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted">
                          {isLoading ? "Loading..." : "No applications"}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.app.id}
                          className={row.app.id === selectedApp ? "table-active" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() => selectApp(row.app.id)}
                        >
                          <td className="fw-semibold">{row.app.name}</td>
                          <td className="small">{row.languages.join(" → ")}</td>
                          <td className="text-end">
                            {row.isCustomised ? (
                              <Badge bg="success">Custom</Badge>
                            ) : (
                              <Badge bg="secondary">Default</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirm dialog — the panel's own, matching Call Gifts and the rest. */}
      <Modal show={Boolean(confirmModal)} onHide={() => setConfirmModal(null)} centered>
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
              setConfirmModal(null);
              if (action) action();
            }}
          >
            {confirmModal?.confirmLabel || "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LanguageOrderPage;
