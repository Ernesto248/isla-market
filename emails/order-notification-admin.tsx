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

interface OrderNotificationAdminEmailProps {
  orderId: string;
  orderDate: string;
  totalAmount: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    image: string;
    total: string;
  }>;
  recipientName: string;
  recipientAddress: string;
  adminLink: string;
}

export const OrderNotificationAdminEmail = ({
  orderId = "123456",
  orderDate = "3 de Octubre, 2025",
  totalAmount = "$0.00",
  customerName = "Cliente",
  customerEmail = "cliente@example.com",
  customerPhone = "+1234567890",
  items = [],
  recipientName = "Destinatario",
  recipientAddress = "Dirección completa",
  adminLink = "https://isla-market.com/admin/orders/123456",
}: OrderNotificationAdminEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Img
            src="https://cms-next.sfo3.digitaloceanspaces.com/icono.png"
            width="60"
            height="60"
            alt="Isla Market"
            style={logo}
          />
          <Heading style={heading}>Isla Market Admin</Heading>
        </Section>

        {/* Alert Principal */}
        <Section style={alertSection}>
          <Text style={alertIcon}>🔔</Text>
          <Heading as="h2" style={alertTitle}>
            Nueva Orden Recibida
          </Heading>
          <Text style={alertSubtitle}>
            Un cliente ha realizado un nuevo pedido
          </Text>
        </Section>

        {/* Información de la Orden */}
        <Section style={orderInfo}>
          <Heading as="h3" style={sectionTitle}>
            📋 Información del Pedido
          </Heading>
          <Row style={infoRow}>
            <Column style={infoLabel}>ID de Orden:</Column>
            <Column style={infoValue}>
              <strong>#{orderId}</strong>
            </Column>
          </Row>
          <Row style={infoRow}>
            <Column style={infoLabel}>Fecha:</Column>
            <Column style={infoValue}>{orderDate}</Column>
          </Row>
          <Row style={infoRow}>
            <Column style={infoLabel}>Total:</Column>
            <Column style={infoValue}>
              <Text style={totalAmountStyle}>{totalAmount}</Text>
            </Column>
          </Row>
        </Section>

        {/* Información del Cliente */}
        <Section style={customerSection}>
          <Heading as="h3" style={sectionTitle}>
            👤 Información del Cliente
          </Heading>
          <Text style={customerInfo}>
            <strong>Nombre:</strong> {customerName}
          </Text>
          <Text style={customerInfo}>
            <strong>Email:</strong> {customerEmail}
          </Text>
          <Text style={customerInfo}>
            <strong>Teléfono:</strong> {customerPhone}
          </Text>
        </Section>

        {/* Productos */}
        <Section style={productsSection}>
          <Heading as="h3" style={sectionTitle}>
            🛍️ Productos Ordenados
          </Heading>
          {items.map((item, index) => (
            <Row key={index} style={productRow}>
              <Column style={productImageCell}>
                <Img
                  src={item.image}
                  width="80"
                  height="80"
                  alt={item.name}
                  style={productImage}
                />
              </Column>
              <Column style={productInfo}>
                <Text style={productName}>{item.name}</Text>
                <Text style={productDetails}>
                  Cantidad: {item.quantity} × {item.price}
                </Text>
                <Text style={productTotal}>
                  Subtotal: <strong>{item.total}</strong>
                </Text>
              </Column>
            </Row>
          ))}
        </Section>

        {/* Destinatario en Cuba */}
        <Section style={shippingSection}>
          <Heading as="h3" style={sectionTitle}>
            📍 Envío a Cuba
          </Heading>
          <Text style={shippingInfo}>
            <strong>Destinatario:</strong>
            <br />
            {recipientName}
          </Text>
          <Text style={shippingInfo}>
            <strong>Dirección:</strong>
            <br />
            {recipientAddress}
          </Text>
        </Section>

        {/* Estado */}
        <Section style={statusSection}>
          <Text style={statusBadge}>⏳ PENDIENTE DE CONFIRMACIÓN</Text>
          <Text style={statusDescription}>
            Esta orden requiere que confirmes el pago y actualices el estado
            manualmente desde el panel de administración.
          </Text>
        </Section>

        {/* Call to Action */}
        <Section style={buttonSection}>
          <Button href={adminLink} style={button}>
            Ver Orden Completa en Admin Panel
          </Button>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Este email fue generado automáticamente por Isla Market
          </Text>
          <Text style={footerCopy}>
            © 2025 Isla Market Admin. Panel de Administración.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderNotificationAdminEmail;

// Estilos
const main = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "650px",
  border: "1px solid #e2e8f0",
};

const header = {
  padding: "32px 20px",
  textAlign: "center" as const,
  backgroundColor: "#1e293b",
};

const logo = {
  margin: "0 auto 16px",
  borderRadius: "12px",
};

const heading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const alertSection = {
  padding: "32px 32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#fef3c7",
  borderBottom: "4px solid #f59e0b",
};

const alertIcon = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const alertTitle = {
  color: "#92400e",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const alertSubtitle = {
  color: "#b45309",
  fontSize: "16px",
  margin: "0",
};

const orderInfo = {
  padding: "24px 32px",
  backgroundColor: "#f8fafc",
  margin: "24px 20px",
  borderRadius: "8px",
  border: "2px solid #0ea5e9",
};

const sectionTitle = {
  color: "#0ea5e9",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 20px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const infoRow = {
  marginBottom: "12px",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "14px",
  width: "40%",
  fontWeight: "500",
};

const infoValue = {
  color: "#1e293b",
  fontSize: "16px",
};

const totalAmountStyle = {
  color: "#059669",
  fontSize: "20px",
  fontWeight: "700" as const,
  margin: "0",
};

const customerSection = {
  padding: "24px 32px",
  borderLeft: "4px solid #8b5cf6",
  margin: "0 20px 24px",
  backgroundColor: "#faf5ff",
};

const customerInfo = {
  color: "#1e293b",
  fontSize: "15px",
  margin: "8px 0",
};

const link = {
  color: "#0ea5e9",
  textDecoration: "underline",
};

const productsSection = {
  padding: "24px 32px",
};

const productRow = {
  marginBottom: "20px",
  borderBottom: "2px solid #e2e8f0",
  paddingBottom: "20px",
};

const productImageCell = {
  width: "100px",
  paddingRight: "20px",
};

const productImage = {
  borderRadius: "8px",
  objectFit: "cover" as const,
  border: "2px solid #e2e8f0",
};

const productInfo = {
  verticalAlign: "top" as const,
};

const productName = {
  color: "#1e293b",
  fontSize: "17px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const productDetails = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
};

const productTotal = {
  color: "#059669",
  fontSize: "15px",
  margin: "8px 0 0",
  fontWeight: "600",
};

const shippingSection = {
  padding: "24px 32px",
  backgroundColor: "#fef3c7",
  margin: "0 20px 24px",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
};

const shippingInfo = {
  color: "#92400e",
  fontSize: "15px",
  margin: "12px 0",
  lineHeight: "24px",
};

const statusSection = {
  padding: "24px 32px",
  textAlign: "center" as const,
  backgroundColor: "#fef3c7",
  margin: "0 20px 24px",
  borderRadius: "8px",
};

const statusText = {
  margin: "0 0 16px",
};

const statusBadge = {
  backgroundColor: "#f59e0b",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "24px",
  fontSize: "15px",
  fontWeight: "700" as const,
  letterSpacing: "1px",
  display: "inline-block",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const statusDescription = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

const buttonSection = {
  padding: "32px 32px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 48px",
  boxShadow: "0 4px 6px rgba(14, 165, 233, 0.3)",
};

const footer = {
  padding: "24px 32px",
  borderTop: "1px solid #e2e8f0",
  textAlign: "center" as const,
  backgroundColor: "#f8fafc",
};

const footerText = {
  color: "#64748b",
  fontSize: "13px",
  margin: "8px 0",
};

const footerCopy = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "8px 0 0",
};
