import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Button,
  Img,
} from "@react-email/components";

interface OrderConfirmationCustomerEmailProps {
  customerName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    image: string;
  }>;
  recipientName: string;
  recipientAddress: string;
}

export const OrderConfirmationCustomerEmail = ({
  customerName = "Cliente",
  orderId = "123456",
  orderDate = "3 de Octubre, 2025",
  totalAmount = "$0.00",
  items = [],
  recipientName = "Destinatario",
  recipientAddress = "Dirección completa",
}: OrderConfirmationCustomerEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        {/* Header con Logo */}
        <Section style={header}>
          <Img
            src="https://cms-next.sfo3.digitaloceanspaces.com/icono.png"
            width="60"
            height="60"
            alt="Isla Market"
            style={logo}
          />
          <Heading style={heading}>Isla Market 🇨🇺</Heading>
        </Section>

        {/* Mensaje Principal */}
        <Section style={section}>
          <Heading as="h2" style={title}>
            ✅ ¡Pedido Confirmado!
          </Heading>
          <Text style={text}>Hola {customerName},</Text>
          <Text style={text}>
            ¡Gracias por tu pedido! Hemos recibido tu orden y la procesaremos
            pronto para enviar amor a Cuba.
          </Text>
        </Section>

        {/* Detalles del Pedido */}
        <Section style={orderDetails}>
          <Heading as="h3" style={sectionTitle}>
            📦 Detalles del Pedido
          </Heading>
          <Row style={detailRow}>
            <Column style={detailLabel}>Pedido #:</Column>
            <Column style={detailValue}>{orderId}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Fecha:</Column>
            <Column style={detailValue}>{orderDate}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Total:</Column>
            <Column style={detailValue}>
              <strong>{totalAmount}</strong>
            </Column>
          </Row>
        </Section>

        {/* Productos */}
        <Section style={productsSection}>
          <Heading as="h3" style={sectionTitle}>
            🛍️ Productos
          </Heading>
          {items.map((item, index) => (
            <Row key={index} style={productRow}>
              <Column style={productImageCell}>
                <Img
                  src={item.image}
                  width="60"
                  height="60"
                  alt={item.name}
                  style={productImage}
                />
              </Column>
              <Column style={productInfo}>
                <Text style={productName}>{item.name}</Text>
                <Text style={productDetails}>
                  {item.quantity} × {item.price}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>

        {/* Destinatario */}
        <Section style={recipientSection}>
          <Heading as="h3" style={sectionTitle}>
            📍 Destinatario en Cuba
          </Heading>
          <Text style={recipientText}>
            <strong>{recipientName}</strong>
          </Text>
          <Text style={recipientText}>{recipientAddress}</Text>
        </Section>

        {/* Estado del Pago */}
        <Section style={paymentSection}>
          <Heading as="h3" style={sectionTitle}>
            💳 Estado del Pago
          </Heading>
          <Text style={text}>
            <span style={statusBadge}>⏳ Pendiente de confirmación</span>
          </Text>
          <Text style={text}>
            Te notificaremos cuando se confirme el pago y se procese tu pedido.
          </Text>
        </Section>

        {/* Call to Action */}
        <Section style={buttonSection}>
          <Button href={`https://isla-market.com/orders`} style={button}>
            Ver mi Pedido
          </Button>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            ¿Preguntas? Responde a este email o contáctanos.
          </Text>
          <Text style={footerText}>
            Con amor desde el exterior,
            <br />
            <strong>Isla Market 🇨🇺</strong>
          </Text>
          <Text style={footerCopy}>
            © 2025 Isla Market. Conectando corazones a través del océano.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationCustomerEmail;

// Estilos
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
  maxWidth: "600px",
};

const header = {
  padding: "32px 20px",
  textAlign: "center" as const,
  backgroundColor: "#0ea5e9",
};

const logo = {
  margin: "0 auto 16px",
  borderRadius: "12px",
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const section = {
  padding: "24px 32px",
};

const title = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const orderDetails = {
  padding: "24px 32px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "0 20px 24px",
};

const sectionTitle = {
  color: "#0ea5e9",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const detailRow = {
  marginBottom: "12px",
};

const detailLabel = {
  color: "#64748b",
  fontSize: "14px",
  width: "40%",
};

const detailValue = {
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "500",
};

const productsSection = {
  padding: "24px 32px",
};

const productRow = {
  marginBottom: "16px",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "16px",
};

const productImageCell = {
  width: "80px",
  paddingRight: "16px",
};

const productImage = {
  borderRadius: "8px",
  objectFit: "cover" as const,
};

const productInfo = {
  verticalAlign: "middle" as const,
};

const productName = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 8px",
};

const productDetails = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const recipientSection = {
  padding: "24px 32px",
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "0 20px 24px",
};

const recipientText = {
  color: "#92400e",
  fontSize: "15px",
  margin: "4px 0",
};

const paymentSection = {
  padding: "24px 32px",
};

const statusBadge = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
  padding: "8px 16px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "600",
};

const buttonSection = {
  padding: "24px 32px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const footer = {
  padding: "32px 32px",
  borderTop: "1px solid #e2e8f0",
  textAlign: "center" as const,
};

const footerText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const footerCopy = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "16px 0 0",
};
