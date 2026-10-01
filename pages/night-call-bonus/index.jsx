import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
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

const nf = new Intl.NumberFormat("en-IN");

const EMPTY = {
  isActive: false,
  startTime: "00:00",
  endTime: "08:00",
  audioBonusPerMinute: 0,
  videoBonusPerMinute: 0,
};

// "22:00" -> 1320. Used only to describe the window in the preview.
const toMinutes = (value) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
};

const windowLength = (start, end) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || s === e) return null;
  return e > s ? e - s : 24 * 60 - s + e;
};

const NightCallBonusPage = () => {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [defaults, setDefaults] = useState(EMPTY);
  const [activeSince, setActiveSince] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Same confirm dialog the rest of the panel uses, rather than window.confirm.
  const [confirmModal, setConfirmModal] = useState(null);

  const adopt = (data) => {
    const next = {
      isActive: Boolean(data?.isActive),
      startTime: data?.startTime || EMPTY.startTime,
      endTime: data?.endTime || EMPTY.endTime,
      audioBonusPerMinute: Number(data?.audioBonusPerMinute) || 0,
      videoBonusPerMinute: Number(data?.videoBonusPerMinute) || 0,
    };
    setForm(next);
    setSaved(next);
    setActiveSince(data?.activeSince || null);
    if (data?.defaults) setDefaults({ ...EMPTY, ...data.defaults });
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [config, usage] = await Promise.all([
        apiHelper.getRequest("night-call-bonus"),
        apiHelper.getRequest("night-call-bonus/stats?days=30"),
      ]);
      if (config?.status) adopt(config.data);
      else Notiflix.Notify.failure(config?.message || "Failed to load configuration");
      if (usage?.status) setStats(usage.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDirty = useMemo(
    () =>
      ["startTime", "endTime", "audioBonusPerMinute", "videoBonusPerMinute"].some(
        (key) => String(form[key]) !== String(saved[key])
      ),
    [form, saved]
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (overrides = {}) => {
    const payload = { ...form, ...overrides };
    setIsSaving(true);
    try {
      const resp = await apiHelper.postRequest("night-call-bonus", payload);
      if (resp?.status) {
        adopt(resp.data);
        Notiflix.Notify.success(resp?.message || "Saved");
        return true;
      }
      Notiflix.Notify.failure(resp?.message || "Failed to save");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // The switch saves on its own, so the page can never show a state that is not
  // stored — the same way the leaderboard switch behaves.
  const toggleActive = async (checked) => {
    if (checked && !(Number(form.audioBonusPerMinute) > 0 || Number(form.videoBonusPerMinute) > 0)) {
      Notiflix.Notify.warning("Set an audio or video amount above 0 before switching this on");
      return;
    }
    setForm((prev) => ({ ...prev, isActive: checked }));
    const ok = await save({ isActive: checked });
    if (!ok) setForm((prev) => ({ ...prev, isActive: !checked }));
  };

  const askReset = () =>
    setConfirmModal({
      title: "Reset to default settings?",
      body: (
        <>
          This switches the bonus <strong>off</strong> and clears both amounts, so calls are
          paid exactly as they were before this feature.
          <br />
          <span className="text-muted small">
            Bonuses already paid are not affected.
          </span>
        </>
      ),
      confirmLabel: "Reset to defaults",
      variant: "danger",
      onConfirm: resetToDefaults,
    });

  const resetToDefaults = async () => {
    setIsSaving(true);
    try {
      const resp = await apiHelper.postRequest("night-call-bonus/reset", {});
      if (resp?.status) {
        adopt(resp.data);
        Notiflix.Notify.success(resp?.message || "Reset to default settings");
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to reset");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const spanMinutes = windowLength(form.startTime, form.endTime);
  const previewMinutes = 10;
  const audioBonus = (Number(form.audioBonusPerMinute) || 0) * previewMinutes;
  const videoBonus = (Number(form.videoBonusPerMinute) || 0) * previewMinutes;

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Night Call Bonus" />
      </div>

      <Alert variant="secondary" className="mt-4 mb-0">
        Extra coins per minute paid to staff for <strong>audio and video</strong> calls taken
        inside the night window — <strong>added on top</strong> of whatever that staff already
        earns. Users are not charged any more; the platform pays this. Applies to
        <strong> all applications</strong>. Chat is not included, because chat is not billed per
        minute.
      </Alert>

      <Row className="g-4 mt-1">
        <Col xs={12} lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
                <div>
                  <h5 className="mb-1">
                    Status{" "}
                    {form.isActive ? (
                      <Badge bg="success">On</Badge>
                    ) : (
                      <Badge bg="secondary">Off</Badge>
                    )}
                  </h5>
                  <p className="text-muted small mb-0">
                    {form.isActive
                      ? `Running since ${activeSince ? new Date(activeSince).toLocaleString() : "—"}`
                      : "Switched off — calls are paid exactly as they were before this feature."}
                  </p>
                </div>
                <Form.Check
                  type="switch"
                  id="night-bonus-active"
                  label={form.isActive ? "Enabled" : "Disabled"}
                  checked={form.isActive}
                  disabled={isLoading || isSaving}
                  onChange={(e) => toggleActive(e.target.checked)}
                />
              </div>

              <Row className="g-3">
                <Col xs={6} md={3}>
                  <Form.Label className="fw-semibold small mb-1">Window starts</Form.Label>
                  <Form.Control
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setField("startTime", e.target.value)}
                  />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Label className="fw-semibold small mb-1">Window ends</Form.Label>
                  <Form.Control
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setField("endTime", e.target.value)}
                  />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Label className="fw-semibold small mb-1">Audio + coins/min</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.audioBonusPerMinute}
                    onChange={(e) => setField("audioBonusPerMinute", e.target.value)}
                  />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Label className="fw-semibold small mb-1">Video + coins/min</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.videoBonusPerMinute}
                    onChange={(e) => setField("videoBonusPerMinute", e.target.value)}
                  />
                </Col>
              </Row>

              <p className="text-muted small mt-2 mb-0">
                Times are IST.{" "}
                {spanMinutes === null
                  ? "Start and end cannot be the same."
                  : `The window covers ${(spanMinutes / 60).toFixed(spanMinutes % 60 ? 1 : 0)} hours${
                      toMinutes(form.endTime) <= toMinutes(form.startTime)
                        ? " and crosses midnight."
                        : "."
                    }`}
              </p>

              {/* A misplaced decimal on a rate screen costs real money, so show
                  the effect before it is saved rather than after a week of payouts. */}
              <Card className="bg-light border-0 mt-4">
                <Card.Body className="py-3">
                  <h6 className="mb-2">What a staff member earns extra</h6>
                  <p className="mb-1 small">
                    A <strong>{previewMinutes}-minute audio call</strong> inside the window pays{" "}
                    <strong>+{nf.format(audioBonus)} coins</strong> on top of their normal rate.
                  </p>
                  <p className="mb-1 small">
                    A <strong>{previewMinutes}-minute video call</strong> inside the window pays{" "}
                    <strong>+{nf.format(videoBonus)} coins</strong> on top.
                  </p>
                  <p className="mb-0 small text-muted">
                    A call that only partly falls inside the window is paid the bonus for the
                    minutes inside it — a call from 07:50 to 08:10 with an 08:00 end earns 10
                    minutes of bonus, not 20.
                  </p>
                </Card.Body>
              </Card>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <Button variant="primary" onClick={() => save()} disabled={isSaving || !isDirty}>
                  {isSaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setForm(saved)}
                  disabled={!isDirty || isSaving}
                >
                  Discard changes
                </Button>
                <Button variant="outline-danger" onClick={askReset} disabled={isSaving}>
                  Reset to default settings
                </Button>
                {isDirty && (
                  <span className="align-self-center">
                    <Badge bg="warning" text="dark">Unsaved</Badge>
                  </span>
                )}
              </div>

              <p className="text-muted small mb-0 mt-3">
                Defaults: {defaults.startTime}–{defaults.endTime}, audio +
                {defaults.audioBonusPerMinute}/min, video +{defaults.videoBonusPerMinute}/min,
                switched off.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                <div>
                  <h5 className="mb-1">What it has cost</h5>
                  <p className="text-muted small mb-0">Bonus actually paid, last 30 days.</p>
                </div>
                <Button size="sm" variant="outline-primary" onClick={load} disabled={isLoading}>
                  Refresh
                </Button>
              </div>

              <Table className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Call type</th>
                    <th className="text-end">Calls</th>
                    <th className="text-end">Bonus minutes</th>
                    <th className="text-end">Bonus paid</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && !stats ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : !stats?.rows?.length ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No bonus paid yet
                      </td>
                    </tr>
                  ) : (
                    stats.rows.map((row) => (
                      <tr key={row.callType}>
                        <td className="fw-semibold text-capitalize">{row.callType}</td>
                        <td className="text-end">{nf.format(row.calls)}</td>
                        <td className="text-end">{nf.format(row.bonusMinutes)}</td>
                        <td className="text-end text-success fw-semibold">
                          {nf.format(row.bonusCoins)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stats?.rows?.length > 0 && (
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td>Total</td>
                      <td className="text-end">{nf.format(stats.totals.calls)}</td>
                      <td className="text-end">{nf.format(stats.totals.bonusMinutes)}</td>
                      <td className="text-end">{nf.format(stats.totals.bonusCoins)}</td>
                    </tr>
                  </tfoot>
                )}
              </Table>

              <p className="text-muted small mb-0 mt-3">
                Read from the bonus recorded on each call, so it stays accurate even after the
                amounts here are changed.
              </p>
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
              // Close first: the action sets its own "Saving..." state, so
              // leaving the dialog open would double up the busy indicators.
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

export default NightCallBonusPage;
