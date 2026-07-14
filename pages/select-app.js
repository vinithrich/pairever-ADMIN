import React from "react";
import { useRouter } from "next/router";
import { Card, Col, Container, Row } from "react-bootstrap";
import AuthLayout from "@/layouts/AuthLayout";
import { getFirstAllowedPath } from "@/helper/accessControl";
import { useAuth } from "@/helper/Context/AuthContext";
import Notiflix from "notiflix";

const SelectAppPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleSelectApp = (appName) => {
    localStorage.setItem("selectedAdminApp", appName);
    Notiflix.Notify.success(`Accessing ${appName === "flamez" || appName === "1" ? "Flamez" : "PairEver"} Panel`);
    
    // Redirect to the first permitted dashboard route
    const nextPath = getFirstAllowedPath(user);
    router.push(nextPath);
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row className="justify-content-center w-100">
        <Col md={10} lg={8} xl={7}>
          <div className="text-center mb-5">
            <h1 className="text-white fw-bold mb-2">Select Application Platform</h1>
            <p className="text-white-50">
              Please choose which application data context you want to manage. You can switch this at any time from the sidebar.
            </p>
          </div>

          <Row className="g-4">
            <Col sm={6}>
              <Card
                className="shadow border-0 rounded-4 select-app-card py-5 px-4 text-center cursor-pointer h-100"
                onClick={() => handleSelectApp("0")}
                style={{
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.3s ease",
                  border: "1px solid rgba(255, 255, 255, 0.15) !important",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(116, 58, 255, 0.4)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
              >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "linear-gradient(135deg, #743aff 0%, #1e00ff 100%)",
                      boxShadow: "0 0 20px rgba(116, 58, 255, 0.5)",
                    }}
                  >
                    <i className="fe fe-activity text-white fs-1" />
                  </div>
                  <h3 className="text-white fw-bold mb-2">PairEver</h3>
                  <p className="text-white-50 mb-0 small">
                    Manage profiles, call logs, analytics, and settings for the PairEver application.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6}>
              <Card
                className="shadow border-0 rounded-4 select-app-card py-5 px-4 text-center cursor-pointer h-100"
                onClick={() => handleSelectApp("1")}
                style={{
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.3s ease",
                  border: "1px solid rgba(255, 255, 255, 0.15) !important",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(255, 75, 75, 0.4)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
              >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "linear-gradient(135deg, #ff4b4b 0%, #ff007b 100%)",
                      boxShadow: "0 0 20px rgba(255, 75, 75, 0.5)",
                    }}
                  >
                    <i className="fe fe-heart text-white fs-1" />
                  </div>
                  <h3 className="text-white fw-bold mb-2">Flamez</h3>
                  <p className="text-white-50 mb-0 small">
                    Manage profiles, call logs, analytics, and settings for the Flamez application.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

SelectAppPage.Layout = AuthLayout;

export default SelectAppPage;
