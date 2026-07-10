import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import apiHelper from "@/helper/apiHelper";

const SystemSettingsPage = () => {
  const router = useRouter();
  const [maxMissedCalls, setMaxMissedCalls] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await apiHelper.getRequest("settings");
      if (resp?.status) {
        setMaxMissedCalls(resp.data?.maxMissedCalls ?? 3);
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to fetch settings");
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      Notiflix.Notify.failure("An error occurred while fetching settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericVal = Number(maxMissedCalls);
    if (!Number.isInteger(numericVal) || numericVal < 1) {
      Notiflix.Notify.failure("Threshold must be a positive integer");
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await apiHelper.postRequest("settings", { maxMissedCalls: numericVal });
      if (resp?.status) {
        setMaxMissedCalls(resp.data?.maxMissedCalls ?? 3);
        Notiflix.Notify.success("Settings updated successfully");
      } else {
        Notiflix.Notify.failure(resp?.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Update settings error:", err);
      Notiflix.Notify.failure("An error occurred while updating settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back d-flex align-items-center mb-4">
        <i
          className="nav-icon fe fe-arrow-left-circle me-3 text-white fs-3 cursor-pointer"
          onClick={() => router.back()}
          style={{ cursor: "pointer" }}
        />
        <PageHeading heading="System Settings" />
      </div>

      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body className="p-4">
              <div className="mb-4">
                <h4 className="mb-1 text-dark fw-bold">Call Configuration Settings</h4>
                <p className="text-muted mb-0">
                  Configure dynamic values used throughout the platform, including the threshold for automatic offline status.
                </p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-secondary">
                    Max Consecutive Missed Calls
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter maximum consecutive missed calls threshold (e.g. 3)"
                    value={maxMissedCalls}
                    onChange={(event) => setMaxMissedCalls(event.target.value)}
                    disabled={isLoading || isSubmitting}
                    className="form-control-lg border-2"
                  />
                  <Form.Text className="text-muted">
                    If a staff member is online but misses this many consecutive calls, they will be automatically set to offline on both Redis presence and MongoDB, and receive an auto-offline push notification.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    className="px-4 py-2 text-white fw-bold"
                    variant="primary"
                    disabled={isLoading || isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Save Settings"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="px-4 py-2"
                    onClick={fetchSettings}
                    disabled={isLoading || isSubmitting}
                  >
                    Refresh
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SystemSettingsPage;
