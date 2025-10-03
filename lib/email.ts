import { Resend } from "resend";
import { render } from "@react-email/render";
import OrderConfirmationCustomerEmail from "@/emails/order-confirmation-customer";
import OrderNotificationAdminEmail from "@/emails/order-notification-admin";

// Lazy initialization of Resend client
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "pedidos@isla-market.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ernestoleonard8@gmail.com";

interface OrderItem {
  product: {
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  house_number: string;
  between_streets: string;
  neighborhood: string;
  province: string;
}

interface User {
  email: string;
  full_name: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export interface SendOrderEmailsParams {
  order: Order;
  user: User;
  shippingAddress: ShippingAddress;
}

/**
 * Envía emails de confirmación de orden al cliente y notificación al admin
 */
export async function sendOrderEmails({
  order,
  user,
  shippingAddress,
}: SendOrderEmailsParams) {
  try {
    // Preparar datos comunes
    const orderDate = new Date(order.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalAmount = `$${order.total_amount.toFixed(2)}`;

    const recipientName = `${shippingAddress.first_name} ${shippingAddress.last_name}`;
    const recipientAddress = `${shippingAddress.street} #${shippingAddress.house_number}, entre ${shippingAddress.between_streets}, ${shippingAddress.neighborhood}, ${shippingAddress.province}, Cuba`;

    const items = order.order_items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: `$${item.unit_price.toFixed(2)}`,
      image:
        item.product.images[0] ||
        "https://cms-next.sfo3.digitaloceanspaces.com/icono.png",
      total: `$${item.total_price.toFixed(2)}`,
    }));

    const customerName =
      user.full_name ||
      (user.user_metadata?.first_name && user.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : "Cliente");

    const customerPhone =
      user.user_metadata?.phone || shippingAddress.phone || "No proporcionado";

    const adminLink = `https://isla-market.com/admin/orders/${order.id}`;

    // 1. Enviar email al cliente
    const customerEmailHtml = await render(
      OrderConfirmationCustomerEmail({
        customerName,
        orderId: order.id.slice(0, 8).toUpperCase(),
        orderDate,
        totalAmount,
        items,
        recipientName,
        recipientAddress,
      })
    );

    const customerEmailResult = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `✅ Confirmación de Pedido #${order.id
        .slice(0, 8)
        .toUpperCase()} - Isla Market`,
      html: customerEmailHtml,
    });

    console.log("✅ Email enviado al cliente:", customerEmailResult);

    // 2. Enviar email al admin
    const adminEmailHtml = await render(
      OrderNotificationAdminEmail({
        orderId: order.id.slice(0, 8).toUpperCase(),
        orderDate,
        totalAmount,
        customerName,
        customerEmail: user.email,
        customerPhone,
        items,
        recipientName,
        recipientAddress,
        adminLink,
      })
    );

    const adminEmailResult = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `🔔 Nueva Orden #${order.id
        .slice(0, 8)
        .toUpperCase()} - Isla Market Admin`,
      html: adminEmailHtml,
    });

    console.log("✅ Email enviado al admin:", adminEmailResult);

    return {
      success: true,
      customerEmailId: customerEmailResult.data?.id,
      adminEmailId: adminEmailResult.data?.id,
    };
  } catch (error) {
    console.error("❌ Error al enviar emails:", error);
    // No lanzamos error para no bloquear la creación de la orden
    // Los emails son importantes pero no críticos
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Envía email de actualización de estado de orden
 */
export async function sendOrderStatusUpdateEmail({
  order,
  user,
  newStatus,
}: {
  order: Order;
  user: User;
  newStatus: string;
}) {
  try {
    const statusMessages: Record<
      string,
      { subject: string; message: string; emoji: string }
    > = {
      paid: {
        subject: "💳 Pago Confirmado",
        message:
          "Tu pago ha sido confirmado y tu pedido está siendo procesado.",
        emoji: "✅",
      },
      delivered: {
        subject: "📦 Pedido Entregado",
        message: "¡Tu pedido ha sido entregado exitosamente en Cuba!",
        emoji: "🎉",
      },
      cancelled: {
        subject: "❌ Pedido Cancelado",
        message:
          "Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.",
        emoji: "⚠️",
      },
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) return { success: false, error: "Estado no soportado" };

    const customerName =
      user.full_name ||
      (user.user_metadata?.first_name && user.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : "Cliente");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Isla Market 🇨🇺</h1>
          </div>
          <div style="background: #f8fafc; padding: 40px; border-radius: 0 0 8px 8px;">
            <div style="text-align: center; font-size: 64px; margin-bottom: 20px;">
              ${statusInfo.emoji}
            </div>
            <h2 style="color: #1e293b; text-align: center; margin-bottom: 20px;">
              ${statusInfo.subject}
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 24px;">
              Hola ${customerName},
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 24px;">
              ${statusInfo.message}
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                <strong>Pedido #:</strong> ${order.id.slice(0, 8).toUpperCase()}
              </p>
              <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;">
                <strong>Estado:</strong> <span style="color: #0ea5e9; font-weight: 600;">${newStatus.toUpperCase()}</span>
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://isla-market.com/orders" 
                 style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Ver Mi Pedido
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Con amor desde el exterior,<br>
              <strong>Isla Market 🇨🇺</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `${statusInfo.subject} - Pedido #${order.id
        .slice(0, 8)
        .toUpperCase()}`,
      html,
    });

    console.log("✅ Email de actualización enviado:", result);

    return {
      success: true,
      emailId: result.data?.id,
    };
  } catch (error) {
    console.error("❌ Error al enviar email de actualización:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
