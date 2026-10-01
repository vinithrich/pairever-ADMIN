import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Badge,
  Button,
  ButtonGroup,
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

const MAX_PRIZES = 50;

const newPrize = (type = "cash") => ({
  type,
  name: type === "cash" ? "Cash Reward" : "",
  description: type === "cash" ? "Direct wallet credit" : "",
  amount: "",
  image: "",
  file: null,
});

// Name and member ID both open the staff record. Falls back to plain text when
// the row has no staffId — a winner whose staff account was since deleted keeps
// its place in a frozen period, and a dead link there would 404.
const StaffCell = ({ staffId, name, memberID }) => {
  const label = (
    <>
      <div className="fw-semibold">{name || "-"}</div>
      <div className="text-muted small">{memberID || "-"}</div>
    </>
  );

  if (!staffId) return label;

  return (
    <Link
      href={`/staff-management/${staffId}`}
      className="text-decoration-none text-reset"
      title="Open staff details"
    >
      {label}
    </Link>
  );
};

const rupees = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Periods are IST and end-exclusive, so the last day shown is end − 1ms.
const formatPeriod = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) return "";
  const opts = { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" };
  const start = new Date(startsAt).toLocaleDateString("en-GB", opts);
  const end = new Date(new Date(endsAt).getTime() - 1).toLocaleDateString("en-GB", opts);
  return `${start} – ${end}`;
};

const PAYOUT_BADGE = {
  pending: { bg: "warning", text: "dark", label: "Pending" },
  paid: { bg: "success", label: "Paid" },
  delivered: { bg: "info", text: "dark", label: "Delivered" },
};

// Object URLs are revoked when the file changes or the row unmounts.
const PrizeImage = ({ file, image, size = 56 }) => {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = preview || image;
  return (
    <div
      className="rounded border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, background: "#f8f9fa" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Prize" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span className="text-muted small">No image</span>
      )}
    </div>
  );
};

const LeaderboardPage = () => {
  const router = useRouter();

  // ---- configuration ----
  // isActive always mirrors the SERVER: the switch saves instantly, so the Live/Off
  // badge can never show a state that isn't stored.
  const [isActive, setIsActive] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [periodType, setPeriodType] = useState("weekly");
  // The period type still needs "Save", so track the stored value to flag edits.
  const [savedPeriodType, setSavedPeriodType] = useState("weekly");
  // How many competitors the staff app lists (ranks past the prizes show no prize).
  const [displayCount, setDisplayCount] = useState(20);
  const [prizes, setPrizes] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ---- standings + results ----
  const [standings, setStandings] = useState(null);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [results, setResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [settlingKey, setSettlingKey] = useState("");
  const [confirm, setConfirm] = useState(null);

  const prizePool = useMemo(
    () => prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [prizes]
  );

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const resp = await apiHelper.getRequest("leaderboard/config");
      if (resp?.status) {
        setIsActive(Boolean(resp.data?.isActive));
        setPeriodType(resp.data?.periodType || "weekly");
        setSavedPeriodType(resp.data?.periodType || "weekly");
        setDisplayCount(resp.data?.displayCount ?? 20);
        setCurrentPeriod(resp.data?.currentPeriod || null);
        setPrizes(
          (resp.data?.prizes || []).map((p) => ({
            type: p.type,
            name: p.name || "",
            description: p.description || "",
            amount: p.amount ?? "",
            image: p.image || "",
            file: null,
          }))
        );
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to load leaderboard");
      }
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const loadStandings = useCallback(async () => {
    setIsLoadingStandings(true);
    try {
      const resp = await apiHelper.getRequest("leaderboard/standings");
      setStandings(resp?.status ? resp.data : null);
    } finally {
      setIsLoadingStandings(false);
    }
  }, []);

  const loadResults = useCallback(async () => {
    setIsLoadingResults(true);
    try {
      const resp = await apiHelper.getRequest("leaderboard/results?limit=6");
      setResults(resp?.status && Array.isArray(resp.data) ? resp.data : []);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadStandings();
    loadResults();
  }, [loadConfig, loadStandings, loadResults]);

  const handleToggleActive = async (nextActive) => {
    setIsTogglingActive(true);
    setIsActive(nextActive); // optimistic; reverted below if the save fails
    try {
      const resp = await apiHelper.postRequest("leaderboard/status", { isActive: nextActive });
      if (resp?.status) {
        setIsActive(Boolean(resp.data?.isActive));
        Notiflix.Notify.success(resp.message);
        loadStandings();
      } else {
        setIsActive(!nextActive);
        Notiflix.Notify.failure(resp?.message || "Failed to update leaderboard status");
      }
    } catch (err) {
      setIsActive(!nextActive);
      Notiflix.Notify.failure("An error occurred while updating the leaderboard status");
    } finally {
      setIsTogglingActive(false);
    }
  };

  // ---- prize editing ----
  const updatePrize = (index, patch) =>
    setPrizes((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const changeType = (index, type) =>
    setPrizes((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        // Swap in the cash defaults, or clear them when switching to a product.
        if (type === "cash") {
          return {
            ...p,
            type,
            name: p.name && p.type === "cash" ? p.name : "Cash Reward",
            description: p.description && p.type === "cash" ? p.description : "Direct wallet credit",
            image: "",
            file: null,
          };
        }
        return {
          ...p,
          type,
          name: p.name === "Cash Reward" ? "" : p.name,
          description: p.description === "Direct wallet credit" ? "" : p.description,
        };
      })
    );

  const addPrize = () => {
    if (prizes.length >= MAX_PRIZES) {
      Notiflix.Notify.warning(`A leaderboard can have at most ${MAX_PRIZES} prizes`);
      return;
    }
    // The podium is usually products, the tail usually cash.
    setPrizes((prev) => [...prev, newPrize(prev.length < 3 ? "product" : "cash")]);
  };

  const removePrize = (index) =>
    setPrizes((prev) => prev.filter((_, i) => i !== index));

  const movePrize = (index, direction) =>
    setPrizes((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleImage = (index, event) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      Notiflix.Notify.failure("Please choose an image file");
      event.target.value = "";
      return;
    }
    updatePrize(index, { file });
  };

  const handleSave = async () => {
    if (!prizes.length) {
      Notiflix.Notify.failure("Add at least one prize");
      return;
    }

    for (let i = 0; i < prizes.length; i += 1) {
      const p = prizes[i];
      const amount = Number(p.amount);
      if (p.type === "product" && !String(p.name).trim()) {
        Notiflix.Notify.failure(`Rank #${i + 1}: enter the product name`);
        return;
      }
      if (p.amount === "" || !Number.isFinite(amount) || amount < 0) {
        Notiflix.Notify.failure(`Rank #${i + 1}: enter a valid amount`);
        return;
      }
    }

    const count = Number(displayCount);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      Notiflix.Notify.failure("Competitors shown must be a whole number between 1 and 100");
      return;
    }

    const payload = new FormData();
    payload.append("isActive", isActive);
    payload.append("displayCount", count);
    payload.append("periodType", periodType);
    payload.append(
      "prizes",
      JSON.stringify(
        prizes.map((p) => ({
          type: p.type,
          name: String(p.name).trim(),
          description: String(p.description).trim(),
          amount: Number(p.amount),
          image: p.file ? "" : p.image,
        }))
      )
    );
    prizes.forEach((p, i) => {
      if (p.file) payload.append(`prizeImage_${i}`, p.file);
    });

    setIsSaving(true);
    try {
      const resp = await apiHelper.postRequest("leaderboard/config", payload, true);
      if (resp?.status) {
        Notiflix.Notify.success(resp.message || "Leaderboard saved");
        await Promise.all([loadConfig(), loadStandings(), loadResults()]);
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to save leaderboard");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ---- payout ----
  const askSettle = (period, winner) => {
    const isCash = winner.prize?.type === "cash";
    setConfirm({
      title: isCash ? "Credit cash reward" : "Mark prize as delivered",
      variant: isCash ? "success" : "primary",
      confirmLabel: isCash ? `Credit ${rupees(winner.prize?.amount)}` : "Mark Delivered",
      body: (
        <>
          <p className="mb-1">
            <span className="fw-semibold">#{winner.rank} {winner.staffName || "Staff"}</span>{" "}
            <span className="text-muted small">{winner.staffMemberID}</span>
          </p>
          <p className="mb-3 text-muted small">
            {formatPeriod(period.startsAt, period.endsAt)} · {winner.minutes} min
          </p>
          <p className="mb-3">
            <span className="fw-bold">{winner.prize?.name}</span> — {rupees(winner.prize?.amount)}
          </p>
          <div className={`alert ${isCash ? "alert-warning" : "alert-info"} mb-0 py-2 px-3 small`}>
            {isCash
              ? "This credits the amount to the staff wallet (earnings and withdrawable balance) immediately. It can only be done once."
              : "No money moves. This only records that the product has been handed over."}
          </div>
        </>
      ),
      onConfirm: () => settle(period.periodKey, winner.rank),
    });
  };

  const settle = async (periodKey, rank) => {
    const key = `${periodKey}#${rank}`;
    setSettlingKey(key);
    try {
      const resp = await apiHelper.postRequest("leaderboard/settle", { periodKey, rank });
      if (resp?.status) {
        Notiflix.Notify.success(resp.message || "Reward settled");
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to settle reward");
      }
      await loadResults();
    } finally {
      setSettlingKey("");
    }
  };

  const shownPeriod = standings?.startsAt ? standings : currentPeriod;

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={() => router.back()} />
        <PageHeading heading="Leaderboard" />
      </div>

      {/* ---------------- Settings ---------------- */}
      <Card className="shadow-sm mt-4 mb-4" border={isActive ? "success" : "secondary"}>
        <Card.Body className="p-4">
          <Row className="g-4 align-items-center">
            <Col lg={3}>
              <h4 className="mb-1">
                Staff Call Leaderboard{" "}
                <Badge bg={isActive ? "success" : "secondary"}>{isActive ? "Live" : "Off"}</Badge>
              </h4>
              <p className="text-muted mb-0 small">
                Ranks staff by combined audio + video call minutes. There is one leaderboard — edit
                it here.
              </p>
            </Col>

            <Col sm={6} lg={2}>
              <Form.Label className="fw-bold small mb-1">Visible in staff app</Form.Label>
              <Form.Check
                type="switch"
                id="leaderboard-active"
                className="fs-4"
                checked={isActive}
                disabled={isLoadingConfig || isSaving || isTogglingActive}
                onChange={(e) => handleToggleActive(e.target.checked)}
                label={isTogglingActive ? "Saving..." : ""}
              />
              <div className="text-muted small">Saves instantly</div>
            </Col>

            <Col sm={6} lg={2}>
              <Form.Label className="fw-bold small mb-1">Competitors shown</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="100"
                value={displayCount}
                disabled={isLoadingConfig || isSaving}
                onChange={(e) => setDisplayCount(e.target.value)}
                style={{ maxWidth: 110 }}
              />
              <div className="text-muted small">
                {Number(displayCount) < prizes.length
                  ? `At least ${prizes.length} shown (one per prize)`
                  : "Your rank is always shown, even outside this list"}
              </div>
            </Col>

            <Col sm={6} lg={2}>
              <Form.Label className="fw-bold small mb-1 d-block">Period</Form.Label>
              <ButtonGroup>
                {["weekly", "monthly"].map((type) => (
                  <Button
                    key={type}
                    variant={periodType === type ? "primary" : "outline-secondary"}
                    disabled={isLoadingConfig || isSaving}
                    onClick={() => setPeriodType(type)}
                  >
                    {type === "weekly" ? "Weekly" : "Monthly"}
                  </Button>
                ))}
              </ButtonGroup>
              <div className="text-muted small mt-1">
                {periodType === "weekly" ? "Monday – Sunday (IST)" : "Calendar month (IST)"}
              </div>
              {periodType !== savedPeriodType ? (
                <div className="text-warning small fw-semibold">
                  Not saved yet — click Save Leaderboard
                </div>
              ) : null}
            </Col>

            <Col lg={3} className="text-lg-end">
              <div className="text-muted small">Prize pool · Top {prizes.length}</div>
              <div className="fs-2 fw-bold">{rupees(prizePool)}</div>
              {shownPeriod?.startsAt ? (
                <div className="text-muted small">
                  Current: {formatPeriod(shownPeriod.startsAt, shownPeriod.endsAt)}
                </div>
              ) : null}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ---------------- Prizes ---------------- */}
      <Card className="shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <h4 className="mb-1">Prize Distribution</h4>
              <p className="text-muted mb-0 small">
                One row per rank, in order. Products are handed over by you; cash is credited to the
                staff wallet when you pay out a finished period.
              </p>
            </div>
            <Button variant="outline-primary" onClick={addPrize} disabled={isSaving}>
              + Add Rank #{prizes.length + 1}
            </Button>
          </div>

          {isLoadingConfig ? (
            <p className="text-center text-muted my-4">Loading prizes...</p>
          ) : prizes.length === 0 ? (
            <p className="text-center text-muted my-4">
              No prizes yet. Click &quot;Add Rank #1&quot; to start.
            </p>
          ) : (
            <Table responsive className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>Rank</th>
                  <th style={{ width: 130 }}>Type</th>
                  <th>Prize name</th>
                  <th>Description</th>
                  <th style={{ width: 140 }}>Amount (₹)</th>
                  <th style={{ width: 230 }}>Image</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {prizes.map((prize, index) => (
                  <tr key={index}>
                    <td className="fw-bold">#{index + 1}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={prize.type}
                        disabled={isSaving}
                        onChange={(e) => changeType(index, e.target.value)}
                      >
                        <option value="product">Product</option>
                        <option value="cash">Cash</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={prize.name}
                        disabled={isSaving}
                        placeholder={prize.type === "product" ? 'Smart TV 43"' : "Cash Reward"}
                        onChange={(e) => updatePrize(index, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={prize.description}
                        disabled={isSaving}
                        placeholder={
                          prize.type === "product"
                            ? "Samsung Crystal UHD · 4K"
                            : "Direct wallet credit"
                        }
                        onChange={(e) => updatePrize(index, { description: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        min="0"
                        value={prize.amount}
                        disabled={isSaving}
                        placeholder="0"
                        onChange={(e) => updatePrize(index, { amount: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <PrizeImage file={prize.file} image={prize.image} size={48} />
                        <Form.Control
                          size="sm"
                          type="file"
                          accept="image/*"
                          disabled={isSaving}
                          onChange={(e) => handleImage(index, e)}
                        />
                      </div>
                    </td>
                    <td className="text-nowrap">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-1"
                        disabled={isSaving || index === 0}
                        title="Move up"
                        onClick={() => movePrize(index, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-1"
                        disabled={isSaving || index === prizes.length - 1}
                        title="Move down"
                        onClick={() => movePrize(index, 1)}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={isSaving}
                        title="Remove"
                        onClick={() => removePrize(index)}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={loadConfig} disabled={isSaving || isLoadingConfig}>
              Discard changes
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoadingConfig}>
              {isSaving ? "Saving..." : "Save Leaderboard"}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ---------------- Live standings ---------------- */}
      <Card className="shadow-sm mb-4">
        <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-0">
          <div>
            <h4 className="mb-1">
              Live Standings{" "}
              {standings?.periodLabel ? (
                <Badge bg="primary" className="align-middle">{standings.periodLabel}</Badge>
              ) : null}
            </h4>
            <p className="text-muted small mb-3">
              {standings?.startsAt ? formatPeriod(standings.startsAt, standings.endsAt) : ""} ·
              updates about every minute
              {standings && !standings.enabled ? " · hidden from staff while the board is off" : ""}
            </p>
          </div>
          <Button size="sm" variant="outline-secondary" onClick={loadStandings} disabled={isLoadingStandings}>
            {isLoadingStandings ? "Refreshing..." : "Refresh"}
          </Button>
        </Card.Body>
        <Table responsive className="text-nowrap mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Rank</th>
              <th>Staff</th>
              <th>Call minutes</th>
              <th>Prize</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingStandings ? (
              <tr><td colSpan="4" className="text-center">Loading standings...</td></tr>
            ) : !standings?.top?.length ? (
              <tr>
                <td colSpan="4" className="text-center">
                  {prizes.length
                    ? "No calls in this period yet."
                    : "Configure prizes and save to see the standings."}
                </td>
              </tr>
            ) : (
              standings.top.map((entry) => (
                <tr key={entry.staffId}>
                  <td className="fw-bold">#{entry.rank}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <PrizeImage image={entry.image} size={36} />
                      <StaffCell
                        staffId={entry.staffId}
                        name={entry.name}
                        memberID={entry.memberID}
                      />
                    </div>
                  </td>
                  <td>{entry.minutes} min</td>
                  <td>
                    {entry.prize ? (
                      <>
                        <Badge bg={entry.prize.type === "cash" ? "success" : "primary"} className="me-2">
                          {entry.prize.type === "cash" ? "Cash" : "Product"}
                        </Badge>
                        {entry.prize.name} · {rupees(entry.prize.amount)}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* ---------------- Completed periods ---------------- */}
      <Card className="shadow-sm">
        <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-0">
          <div>
            <h4 className="mb-1">Completed Periods &amp; Payouts</h4>
            <p className="text-muted small mb-3">
              Winners are frozen when a period ends, using the prizes configured at that time.
            </p>
          </div>
          <Button size="sm" variant="outline-secondary" onClick={loadResults} disabled={isLoadingResults}>
            {isLoadingResults ? "Refreshing..." : "Refresh"}
          </Button>
        </Card.Body>

        {isLoadingResults ? (
          <p className="text-center text-muted my-4">Loading results...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-muted my-4 px-3">
            No completed periods yet. Results appear here once a period the leaderboard was running
            for has ended.
          </p>
        ) : (
          results.map((period) => (
            <div key={period.periodKey} className="border-top">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-4 py-3">
                <div>
                  <span className="fw-bold">{formatPeriod(period.startsAt, period.endsAt)}</span>{" "}
                  <Badge bg="secondary" className="ms-1">
                    {period.periodType === "monthly" ? "Monthly" : "Weekly"}
                  </Badge>
                </div>
                <div className="text-muted small">Prize pool {rupees(period.prizePool)}</div>
              </div>
              <Table responsive className="text-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Rank</th>
                    <th>Staff</th>
                    <th>Minutes</th>
                    <th>Prize</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!period.winners?.length ? (
                    <tr><td colSpan="6" className="text-center">No calls were made in this period.</td></tr>
                  ) : (
                    period.winners.map((winner) => {
                      const key = `${period.periodKey}#${winner.rank}`;
                      const badge = PAYOUT_BADGE[winner.payoutStatus] || PAYOUT_BADGE.pending;
                      const isCash = winner.prize?.type === "cash";
                      return (
                        <tr key={key}>
                          <td className="fw-bold">#{winner.rank}</td>
                          <td>
                            <StaffCell
                              staffId={winner.staffId}
                              name={winner.staffName}
                              memberID={winner.staffMemberID}
                            />
                          </td>
                          <td>{winner.minutes} min</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {!isCash ? <PrizeImage image={winner.prize?.image} size={36} /> : null}
                              <div>
                                <div>{winner.prize?.name}</div>
                                <div className="text-muted small">{rupees(winner.prize?.amount)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg={badge.bg} text={badge.text}>{badge.label}</Badge>
                            {winner.paidAt ? (
                              <div className="text-muted small">
                                {new Date(winner.paidAt).toLocaleDateString("en-GB")}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            {winner.payoutStatus === "pending" ? (
                              <Button
                                size="sm"
                                variant={isCash ? "success" : "primary"}
                                disabled={settlingKey === key}
                                onClick={() => askSettle(period, winner)}
                              >
                                {settlingKey === key
                                  ? "Saving..."
                                  : isCash
                                    ? `Credit ${rupees(winner.prize?.amount)}`
                                    : "Mark Delivered"}
                              </Button>
                            ) : (
                              <span className="text-muted small">Done</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          ))
        )}
      </Card>

      <Modal show={Boolean(confirm)} onHide={() => setConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">{confirm?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirm?.body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant={confirm?.variant || "primary"}
            onClick={() => {
              const action = confirm?.onConfirm;
              setConfirm(null);
              if (action) action();
            }}
          >
            {confirm?.confirmLabel || "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LeaderboardPage;
