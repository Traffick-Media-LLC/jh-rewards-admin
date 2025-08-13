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
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface OrderConfirmationEmailProps {
  firstName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    points: number;
  }>;
  totalPoints: number;
}

export const OrderConfirmationEmail = ({ 
  firstName, 
  orderNumber, 
  items, 
  totalPoints 
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Order Confirmation #{orderNumber} - Your rewards are on the way!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🧠 Juice Head Rewards</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h2}>Order Confirmed! 📦</Heading>
          
          <Text style={text}>
            Hey {firstName}! Thanks for your order. We've got everything ready 
            and your rewards will be on their way soon.
          </Text>

          <Section style={orderBox}>
            <Text style={orderLabel}>Order Number</Text>
            <Heading style={orderNumber}>#{orderNumber}</Heading>
          </Section>

          <Heading style={h3}>Order Details</Heading>
          
          {items.map((item, index) => (
            <Section key={index} style={itemRow}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemDetails}>Qty: {item.quantity} • {item.points} points each</Text>
            </Section>
          ))}

          <Hr style={divider} />

          <Section style={totalRow}>
            <Text style={totalLabel}>Total Points Used:</Text>
            <Text style={totalAmount}>{totalPoints} points</Text>
          </Section>

          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>
          
          <Text style={listItem}>📧 You'll get tracking info once your order ships</Text>
          <Text style={listItem}>📦 Orders typically ship within 2-3 business days</Text>
          <Text style={listItem}>🎯 Keep earning points for your next order!</Text>

          <Text style={text}>
            Need help? Just reply to this email and we'll sort you out.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Juice Head Rewards | 
            <Link href="https://rewards.juicehead.com/account" style={link}> Track Orders</Link> | 
            <Link href="https://rewards.juicehead.com/shop" style={link}> Shop More</Link>
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
  backgroundColor: '#3B82F6',
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

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
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

const orderBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3B82F6',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const orderLabel = {
  color: '#1d4ed8',
  fontSize: '14px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontWeight: 'bold',
};

const orderNumber = {
  color: '#3B82F6',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const itemRow = {
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f1f5f9',
};

const itemName = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const itemDetails = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const divider = {
  border: 'none',
  borderTop: '2px solid #e2e8f0',
  margin: '20px 0',
};

const totalRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 0',
  borderBottom: '1px solid #e2e8f0',
};

const totalLabel = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const totalAmount = {
  color: '#3B82F6',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
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
  color: '#3B82F6',
  textDecoration: 'underline',
};