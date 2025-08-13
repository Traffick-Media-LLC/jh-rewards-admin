import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  firstName: string;
  pointsBalance: number;
}

export const WelcomeEmail = ({ firstName, pointsBalance }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Juice Head Rewards! Start earning points today.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🧠 Juice Head Rewards</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h2}>Welcome, {firstName}! 🎉</Heading>
          
          <Text style={text}>
            Thanks for joining Juice Head Rewards! You're now part of an exclusive community 
            where every action earns you points that you can redeem for amazing rewards.
          </Text>

          <Section style={pointsBox}>
            <Text style={pointsText}>Your current balance:</Text>
            <Heading style={pointsAmount}>{pointsBalance} Points</Heading>
          </Section>

          <Text style={text}>
            <strong>Here's how to get started:</strong>
          </Text>
          
          <Text style={listItem}>🎯 Redeem reward codes to earn points</Text>
          <Text style={listItem}>🛍️ Use points to get exclusive products</Text>
          <Text style={listItem}>🏆 Reach milestones for bonus rewards</Text>

          <Section style={buttonContainer}>
            <Button 
              href="https://rewards.juicehead.com/shop" 
              style={button}
            >
              Start Shopping
            </Button>
          </Section>

          <Text style={text}>
            Have questions? Just reply to this email - we're here to help!
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Juice Head Rewards | 
            <Link href="https://rewards.juicehead.com" style={link}> Visit Dashboard</Link> | 
            <Link href="https://rewards.juicehead.com/account" style={link}> Manage Preferences</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '20px 30px',
  textAlign: 'center' as const,
  backgroundColor: '#8B5CF6',
};

const content = {
  padding: '30px 30px 40px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 8px',
  paddingLeft: '10px',
};

const pointsBox = {
  backgroundColor: '#f8f9fa',
  border: '2px solid #8B5CF6',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const pointsText = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const pointsAmount = {
  color: '#8B5CF6',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  padding: '20px 30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #eaeaea',
};

const footerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
};

const link = {
  color: '#8B5CF6',
  textDecoration: 'underline',
};