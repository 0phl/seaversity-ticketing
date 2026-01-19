import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name = "User" }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Seaversity Ticketing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Seaversity Ticketing</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Welcome to the Seaversity Ticketing & Work Management System. You can
          now submit tickets, track your requests, and collaborate with the IT
          team.
        </Text>
        <Text style={text}>
          If you have any questions, feel free to submit a ticket or contact
          your administrator.
        </Text>
        <Text style={footer}>
          - The Seaversity IT Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};

const footer = {
  color: "#898989",
  fontSize: "14px",
  lineHeight: "22px",
  padding: "0 48px",
  marginTop: "32px",
};
