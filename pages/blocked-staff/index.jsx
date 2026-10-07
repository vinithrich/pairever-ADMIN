import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Image,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";
import TablePagination from "@/components/TablePagination";
import useUrlPageState from "@/hooks/useUrlPageState";

const SCOPES = [
  { key: "all", label: "Hidden from users" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
  { key: "chat", label: "Chat" },
];

const LIMIT = 20;

// "Permanent" or when it lapses — the two things an admin needs to decide
// whether to lift it early.
const describe = (block) => {
  if (!block?.active) return null;
  if (block.permanent) return "Permanent";
  return block.until ? `Until ${new Date(block.until).toLocaleDateString()}` : "Active";
};

const BlockedStaffPage = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await apiHelper.getRequest(
        `staff-block?page=${currentPage}&limit=${LIMIT}`
      );
      if (resp?.status) {
        setRows(resp.data || []);
        setTotal(resp.pagination?.total || 0);
        setTotalPages(resp.pagination?.totalPages || 1);
      } else {
        setRows([]);
        Notiflix.Notify.failure(resp?.message || "Failed to load blocked staff");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const lift = async (staffId, scope) => {
    setPendingKey(`${staffId}:${scope}`);
    try {
      const resp = await apiHelper.postRequest("staff-block", {
        staffId,
        scope,
        mode: "clear",
      });
      if (resp?.status) {
        Notiflix.Notify.success(resp.message || "Block lifted");
        await load();
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to lift block");
      }
    } finally {
      setPendingKey("");
    }
  };

  // Lifting every scope at once, for the common "this was a mistake" case.
  const liftAll = async (staff) => {
    const active = SCOPES.filter((s) => staff.blocks?.[s.key]?.active).map((s) => s.key);
    setPendingKey(`${staff.staffId}:*`);
    try {
      for (const scope of active) {
        await apiHelper.postRequest("staff-block", {
          staffId: staff.staffId,
          scope,
          mode: "clear",
        });
      }
      Notiflix.Notify.success(`All restrictions lifted for ${staff.name || "staff"}`);
      await load();
    } finally {
      setPendingKey("");
    }
  };

  const askLiftAll = (staff) =>
    setConfirmModal({
      title: "Lift all restrictions?",
      body: (
        <>
          Every active restriction on <strong>{staff.name || staff.memberID}</strong> will be
          removed, and they become visible and callable again straight away.
        </>
      ),
      confirmLabel: "Lift all",
      variant: "success",
      onConfirm: () => liftAll(staff),
    });

  const counts = useMemo(() => {
    const out = { all: 0, video: 0, audio: 0, chat: 0 };
    rows.forEach((staff) => {
      SCOPES.forEach(({ key }) => {
        if (staff.blocks?.[key]?.active) out[key] += 1;
      });
    });
    return out;
  }, [rows]);

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Blocked Staff" />
      </div>

      <Row className="g-3 mt-1 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="py-3">
              <div className="text-muted small">Staff with a restriction</div>
              <div className="fs-3 fw-bold text-danger">{total}</div>
            </Card.Body>
          </Card>
        </Col>
        {SCOPES.map(({ key, label }) => (
          <Col xs={6} md={2} key={key}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="py-3">
                <div className="text-muted small">{label}</div>
                <div className="fs-4 fw-bold">{counts[key]}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm">
        <Card.Body className="d-flex align-items-start justify-content-between flex-wrap gap-2 pb-0">
          <p className="text-muted small mb-3">
            Blocking never deletes a staff member — their account, history and earnings stay.
            A timed restriction lifts itself when it expires; use Lift to end one early.
            Counts above are for this page.
          </p>
          <Button size="sm" variant="outline-primary" onClick={load} disabled={isLoading}>
            Refresh
          </Button>
        </Card.Body>

        <Table responsive hover className="text-nowrap mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Staff</th>
              {SCOPES.map(({ key, label }) => (
                <th key={key}>{label}</th>
              ))}
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !rows.length ? (
              <tr>
                <td colSpan={SCOPES.length + 2} className="text-center py-5">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading blocked staff...
                </td>
              </tr>
            ) : !rows.length ? (
              <tr>
                <td colSpan={SCOPES.length + 2} className="text-center py-5 text-muted">
                  No staff are currently blocked.
                </td>
              </tr>
            ) : (
              rows.map((staff) => (
                <tr key={staff.staffId}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Image
                        src={staff.image || "/images/avatar/avatar.jpg"}
                        alt={staff.name}
                        roundedCircle
                        style={{ width: 36, height: 36, objectFit: "cover" }}
                      />
                      <div>
                        <Link
                          href={`/staff-management/${staff.staffId}`}
                          className="text-decoration-none fw-semibold"
                        >
                          {staff.name || "-"}
                        </Link>
                        <div className="text-muted small">
                          {staff.memberID || "-"}
                          {staff.phone ? ` · ${staff.phone}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {SCOPES.map(({ key }) => {
                    const detail = describe(staff.blocks?.[key]);
                    const busy = pendingKey === `${staff.staffId}:${key}`;
                    return (
                      <td key={key}>
                        {detail ? (
                          <>
                            <Badge bg="danger">{detail}</Badge>
                            <div>
                              <Button
                                size="sm"
                                variant="link"
                                className="p-0 mt-1"
                                disabled={busy || Boolean(pendingKey)}
                                onClick={() => lift(staff.staffId, key)}
                              >
                                {busy ? "Lifting..." : "Lift"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-success"
                      disabled={Boolean(pendingKey)}
                      onClick={() => askLiftAll(staff)}
                    >
                      {pendingKey === `${staff.staffId}:*` ? "Lifting..." : "Lift all"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (page < 1 || page > totalPages || page === currentPage) return;
            setCurrentPage(page);
          }}
        />
      </Card>

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

export default BlockedStaffPage;
