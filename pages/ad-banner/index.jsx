import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import {
  GetAdBannerApi,
  UpdateAdBannerApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const AdBannerPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [bannerImage, setBannerImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [coins, setCoins] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(bannerImage || "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [bannerImage, selectedFile]);

  const fetchBanner = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetAdBannerApi((resp) => {
        if (resp?.status) {
          const image =
            resp?.data?.image ||
            resp?.data?.banner ||
            resp?.data?.bannerImage ||
            "";
          setBannerImage(image);
          setAmount(resp?.data?.amount ?? "");
          setCoins(resp?.data?.coins ?? resp?.data?.coin ?? "");
        } else {
          setBannerImage("");
          setAmount("");
          setCoins("");
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch ad banner"
          );
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      Notiflix.Notify.failure("Please select a valid image file");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleClear = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile && amount === "" && coins === "") {
      Notiflix.Notify.failure("Please select one banner image or enter amount/coins");
      return;
    }

    const payload = new FormData();

    if (selectedFile) {
      payload.append("image", selectedFile);
    }

    payload.append("amount", amount);
    payload.append("coins", coins);
    payload.append("coin", coins);

    setIsSubmitting(true);

    await dispatch(
      UpdateAdBannerApi(payload, (resp) => {
        if (resp?.status) {
          Notiflix.Notify.success(
            resp?.message || "Ad banner updated successfully"
          );
          handleClear();
          fetchBanner();
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Failed to update ad banner"
          );
        }

        setIsSubmitting(false);
      })
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Ad Banner" />
      </div>

      <Row className="mt-4 justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Current Banner</Form.Label>
                  <div
                    className="border rounded d-flex align-items-center justify-content-center overflow-hidden"
                    style={{
                      minHeight: "220px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {isLoading ? (
                      <span className="text-muted">Loading banner...</span>
                    ) : previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Ad banner preview"
                        className="img-fluid w-100"
                        style={{ maxHeight: "360px", objectFit: "contain" }}
                      />
                    ) : (
                      <span className="text-muted">No banner image available</span>
                    )}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Upload New Banner</Form.Label>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">
                    Only one image can be updated at a time.
                  </Form.Text>
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Amount</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Coins</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Enter coins"
                        value={coins}
                        onChange={(e) => setCoins(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isSubmitting || isLoading}>
                    {isSubmitting ? "Updating..." : "Update Banner"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClear}
                    disabled={isSubmitting}
                  >
                    Clear
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

export default AdBannerPage;
