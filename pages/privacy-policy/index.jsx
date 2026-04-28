import React from "react";
import { Container, Card } from "react-bootstrap";
import { PageHeading } from "@/widgets";

const PolicyPage = () => {
  return (
    <Container fluid className="p-6">
      <PageHeading heading="Privacy Policy" />

      <Card className="mt-4 p-4">
        <h4>Privacy Policy</h4>
        <p>
          We respect your privacy and are committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, and
          safeguard your data when you use our website or services.
        </p>

        <h5>1. Information We Collect</h5>
        <p>
          We may collect personal details such as your name, email address,
          phone number, and payment details when you register or make a purchase.
        </p>

        <h5>2. How We Use Your Information</h5>
        <p>
          Your information is used to provide services, process payments, improve
          user experience, and communicate updates.
        </p>

        <h5>3. Data Protection</h5>
        <p>
          We take proper security measures to protect your information from
          unauthorized access or misuse.
        </p>

        <h5>4. Third-Party Services</h5>
        <p>
          We may use third-party services (payment gateways, analytics, etc.)
          which may collect data as per their own privacy policies.
        </p>

        <h5>5. Changes to This Policy</h5>
        <p>
          We may update this Privacy Policy anytime. Changes will be updated on
          this page.
        </p>

        <h5>6. Contact Us</h5>
        <p>
          If you have any questions about this policy, please contact our support team.
        </p>
      </Card>
    </Container>
  );
};

export default PolicyPage;
