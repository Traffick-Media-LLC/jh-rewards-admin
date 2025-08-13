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

interface CodeRedemptionEmailProps {
  firstName: string;
  pointsEarned: number;
  totalPoints: number;
  code: string;
}

export const CodeRedemptionEmail = ({ 
  firstName, 
  pointsEarned, 
  totalPoints, 
  code 
}: CodeRedemptionEmailProps) => (
  <Html>
    <Head />
    <Preview>🎯 You earned {pointsEarned} points! Code: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🧠 Juice Head Rewards</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h2}>Nice work, {firstName}! 🎯</Heading>
          
          <Text style={text}>
            You just successfully redeemed the code <strong>{code}</strong> and earned some sweet points!
          </Text>

          <Section style={pointsBox}>
            <Text style={pointsLabel}>Points Earned</Text>
            <Heading style={pointsEarned}>+{pointsEarned}</Heading>
            <Text style={totalPointsText}>Total Balance: {totalPoints} points</Text>
          </Section>

          <Text style={text}>
            Your points are building up! Here's what you can do next:
          </Text>
          
          <Text style={listItem}>🛍️ Browse the shop for exclusive rewards</Text>
          <Text style={listItem}>🎯 Find more codes to keep earning</Text>
          <Text style={listItem}>🏆 Check out milestone rewards</Text>

          <Section style={buttonContainer}>
            <Button 
              href="https://rewards.juicehead.com/shop" 
              style={button}
            >
              Shop Now
            </Button>
          </Section>

          <Text style={text}>
            Keep up the great work! The more codes you redeem, the more exclusive 
            rewards you unlock. 
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Juice Head Rewards | 
            <Link href="https://rewards.juicehead.com" style={link}> View Balance</Link> | 
            <Link href="https://rewards.juicehead.com/account" style={link}> Manage Account</Link>
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
  backgroundColor: '#10B981',
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
  backgroundColor: '#f0fdf4',
  border: '2px solid #10B981',
  borderRadius: '12px',
  padding: '30px',
  textAlign: 'center' as const,
  margin: '25px 0',
};

const pointsLabel = {
  color: '#059669',
  fontSize: '14px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontWeight: 'bold',
};

const pointsEarned = {
  color: '#10B981',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const totalPointsText = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#10B981',
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
  color: '#10B981',
  textDecoration: 'underline',
};