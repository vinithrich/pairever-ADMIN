import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import {
  GetAppVersionApi,
  UpdateAppVersionApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const getVersionValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return (
    payload.latest_version ||
    payload.version ||
    payload.appVersion ||
    payload.currentVersion ||
    payload.latestVersion ||
    ""
  );
};

const getApkUrlValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return payload.apk_url || payload.apkUrl || "";
};

const getForceUpdateValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return Boolean(
    payload.force_update ??
      payload.forceUpdate ??
      payload.is_force_update ??
      payload.isForceUpdate
  );
};

const AppUpdatePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [currentVersion, setCurrentVersion] = useState("");
  const [currentApkUrl, setCurrentApkUrl] = useState("");
  const [currentForceUpdate, setCurrentForceUpdate] = useState(false);
  const [version, setVersion] = useState("");
  const [apkUrl, setApkUrl] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVersion = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetAppVersionApi((resp) => {
        if (resp?.status) {
          const nextVersion = getVersionValue(resp?.data);
          const nextApkUrl = getApkUrlValue(resp?.data);
          const nextForceUpdate = getForceUpdateValue(resp?.data);
          setCurrentVersion(nextVersion);
          setCurrentApkUrl(nextApkUrl);
          setCurrentForceUpdate(nextForceUpdate);
          setVersion(nextVersion);
          setApkUrl(nextApkUrl);
          setForceUpdate(nextForceUpdate);
        } else {
          setCurrentVersion("");
          setCurrentApkUrl("");
          setCurrentForceUpdate(false);
          setVersion("");
          setApkUrl("");
          setForceUpdate(false);
          Notiflix.Notify.failure(resp?.message || "Failed to fetch app version");
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedVersion = version.trim();
    const trimmedApkUrl = apkUrl.trim();

    if (!trimmedVersion) {
      Notiflix.Notify.failure("Please enter an app version");
      return;
    }

    setIsSubmitting(true);

    await dispatch(
      UpdateAppVersionApi(
        {
          version: trimmedVersion,
          latest_version: trimmedVersion,
          force_update: forceUpdate,
          apk_url: trimmedApkUrl,
        },
        (resp) => {
          if (resp?.status) {
            const savedVersion = getVersionValue(resp?.data) || trimmedVersion;
            const savedApkUrl = getApkUrlValue(resp?.data) || trimmedApkUrl;
            const savedForceUpdate =
              resp?.data && typeof resp.data === "object"
                ? getForceUpdateValue(resp?.data)
                : forceUpdate;
            setCurrentVersion(savedVersion);
            setCurrentApkUrl(savedApkUrl);
            setCurrentForceUpdate(savedForceUpdate);
            setVersion(savedVersion);
            setApkUrl(savedApkUrl);
            setForceUpdate(savedForceUpdate);
            Notiflix.Notify.success(
              resp?.message || "App version updated successfully"
            );
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to update app version"
            );
          }

          setIsSubmitting(false);
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
        <PageHeading heading="App Update" />
      </div>

      <Row className="mt-4 justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="mb-4">
                <h4 className="mb-1">Manage App Version</h4>
                <p className="text-muted mb-0">
                  Update the version number shown to the mobile app for app update
                  purpose.
                </p>
              </div>

              <Alert variant="light" className="border">
                <div className="small text-muted mb-1">Current version</div>
                <div className="fw-bold">
                  {isLoading ? "Loading..." : currentVersion || "Not available"}
                </div>
                <hr className="my-3" />
                <div className="small text-muted mb-1">Current force update</div>
                <div className="fw-bold mb-3">
                  {isLoading ? "Loading..." : currentForceUpdate ? "Yes" : "No"}
                </div>
                <div className="small text-muted mb-1">Current APK URL</div>
                <div className="fw-bold text-break">
                  {isLoading ? "Loading..." : currentApkUrl || "Not available"}
                </div>
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">App Version</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter version like 1.0.1"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    disabled={isLoading || isSubmitting}
                  />
                  <Form.Text className="text-muted">
                    Example: 1.0.1 or 2.3.0
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Force Update</Form.Label>
                  <Form.Check
                    type="switch"
                    id="force-update-switch"
                    label={forceUpdate ? "Enabled" : "Disabled"}
                    checked={forceUpdate}
                    onChange={(e) => setForceUpdate(e.target.checked)}
                    disabled={isLoading || isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">APK URL</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter APK or Play Store URL"
                    value={apkUrl}
                    onChange={(e) => setApkUrl(e.target.value)}
                    disabled={isLoading || isSubmitting}
                  />
                  <Form.Text className="text-muted">
                    Example: https://play.google.com/store/apps/details?id=...
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isLoading || isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Details"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fetchVersion}
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

export default AppUpdatePage;
