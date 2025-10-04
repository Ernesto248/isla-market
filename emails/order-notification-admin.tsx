import {
  Html,
  Head,
  Body,
  Container,
  Section,
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
        {/* Alert Principal - Minimalista */}
        <Section style={alertSection}>
          <Text style={alertIcon}>🔔</Text>
          <Heading as="h2" style={alertTitle}>
            Nueva Orden
          </Heading>
        </Section>

        {/* Información de la Orden */}
        <Section style={orderInfo}>
          <Heading as="h3" style={sectionTitle}>
            📋 Información del Pedido
          </Heading>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr style={infoRow}>
                <td style={infoLabel}>ID de Orden:</td>
                <td style={infoValue}>
                  <strong>#{orderId}</strong>
                </td>
              </tr>
              <tr style={infoRow}>
                <td style={infoLabel}>Fecha:</td>
                <td style={infoValue}>{orderDate}</td>
              </tr>
              <tr style={infoRow}>
                <td style={infoLabel}>Total:</td>
                <td style={infoValue}>
                  <Text style={totalAmountStyle}>{totalAmount}</Text>
                </td>
              </tr>
            </tbody>
          </table>
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
            <Section key={index} style={productCard}>
              <Img
                src={item.image}
                width="100%"
                height="auto"
                alt={item.name}
                style={productCardImage}
              />
              <Section style={productCardContent}>
                <Text style={productCardName}>{item.name}</Text>
                <Text style={productCardDetails}>
                  Cantidad: <strong>{item.quantity}</strong>
                </Text>
                <Text style={productCardDetails}>
                  Precio unitario: <strong>{item.price}</strong>
                </Text>
                <Text style={productCardTotal}>
                  Subtotal: <strong>{item.total}</strong>
                </Text>
              </Section>
            </Section>
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

const alertSection = {
  padding: "24px 32px",
  textAlign: "center" as const,
  backgroundColor: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};

const alertIcon = {
  fontSize: "32px",
  margin: "0 0 8px",
};

const alertTitle = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "600",
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
  marginBottom: "0",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "14px",
  width: "35%",
  fontWeight: "500",
  padding: "8px 0",
  verticalAlign: "top" as const,
};

const infoValue = {
  color: "#1e293b",
  fontSize: "16px",
  padding: "8px 0",
  verticalAlign: "top" as const,
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
  padding: "24px 20px",
};

const productCard = {
  backgroundColor: "#ffffff",
  border: "2px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "hidden",
  marginBottom: "16px",
  maxWidth: "100%",
};

const productCardImage = {
  width: "100%",
  height: "auto",
  maxHeight: "200px",
  objectFit: "cover" as const,
  display: "block",
  borderBottom: "2px solid #e2e8f0",
};

const productCardContent = {
  padding: "16px 20px",
};

const productCardName = {
  color: "#1e293b",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const productCardDetails = {
  color: "#64748b",
  fontSize: "15px",
  margin: "6px 0",
  lineHeight: "1.5",
};

const productCardTotal = {
  color: "#059669",
  fontSize: "17px",
  margin: "12px 0 0",
  fontWeight: "700",
  paddingTop: "12px",
  borderTop: "1px solid #e2e8f0",
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
