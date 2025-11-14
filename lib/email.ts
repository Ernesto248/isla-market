import { Resend } from "resend";

// Initialize Resend client - simplified for Vercel compatibility
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "pedidos@isla-market.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lestevezcarbajales@gmail.com";
const CC_EMAIL = process.env.CC_EMAIL || "ernestoleonard8@gmail.com";

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
  referrer?: {
    referral_code: string;
    referrer_name: string;
    referrer_email: string;
  } | null;
}

// HTML Template Generator for Customer Email
function generateCustomerEmailHTML(params: {
  customerName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  subtotal: string;
  shippingFee: string;
  deliveryType: "home_delivery" | "store_pickup";
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
    image: string;
  }>;
  recipientName: string;
  recipientAddress?: string;
  recipientPhone: string;
}) {
  const itemsHTML = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${item.price}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0ea5e9;">${item.total}</td>
    </tr>
  `
    )
    .join("");

  const deliveryBadge =
    params.deliveryType === "home_delivery"
      ? `<span style="background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🚚 Entrega a Domicilio</span>`
      : `<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏪 Recogida en Tienda</span>`;

  const deliverySection =
    params.deliveryType === "home_delivery"
      ? `<h3 style="color: #1e293b; margin-top: 30px;">📦 Dirección de Entrega:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #334155; font-weight: 600;">${
              params.recipientName
            }</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">📞 ${
              params.recipientPhone
            }</p>
            ${
              params.recipientAddress
                ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${params.recipientAddress}</p>`
                : ""
            }
          </div>`
      : `<h3 style="color: #1e293b; margin-top: 30px;">🏪 Recogida en Tienda:</h3>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #334155; font-weight: 600;">${params.recipientName}</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">📞 ${params.recipientPhone}</p>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 14px; font-weight: 600;">Punto de Recogida:</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">📍 San Clemente esquina Cisneros, Camagüey, Cuba</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 13px; font-style: italic;">Horario: Lunes a Sábado, 8:00 AM - 5:00 PM</p>
          </div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🇨🇺 Isla Market</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <div style="text-align: center; font-size: 64px; margin-bottom: 20px;">✅</div>
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 10px;">¡Pedido Confirmado!</h2>
          <div style="text-align: center; margin-bottom: 10px;">${deliveryBadge}</div>
          <p style="color: #64748b; text-align: center; font-size: 14px; margin-bottom: 30px;">Orden #${
            params.orderId
          }</p>
          <p style="color: #475569; font-size: 16px;">Hola ${
            params.customerName
          },</p>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            ¡Gracias por tu compra! Hemos recibido tu pedido ${
              params.deliveryType === "home_delivery"
                ? "y lo enviaremos pronto a Cuba"
                : "y estará listo para recoger en nuestra tienda"
            }.
          </p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #64748b; margin: 0; font-size: 14px;"><strong>Fecha:</strong> ${
              params.orderDate
            }</p>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;"><strong>Subtotal:</strong> ${
              params.subtotal
            }</p>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;"><strong>Envío:</strong> ${
              params.shippingFee === "$0.00 USD" ? "Gratis" : params.shippingFee
            }</p>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;"><strong>Total:</strong> <span style="color: #0ea5e9; font-size: 18px; font-weight: 700;">${
              params.totalAmount
            }</span></p>
          </div>
          <h3 style="color: #1e293b; margin-top: 30px;">Productos Ordenados:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">IMG</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">PRODUCTO</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600;">CANT.</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">PRECIO</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          ${deliverySection}
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://isla-market.com/orders" style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Ver Mi Pedido</a>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Con amor desde el exterior,<br><strong>Isla Market 🇨🇺</strong>
          </p>
        </div>
      </body>
    </html>
  `;
}

// HTML Template Generator for Admin Email
function generateAdminEmailHTML(params: {
  orderId: string;
  orderDate: string;
  totalAmount: string;
  subtotal: string;
  shippingFee: string;
  deliveryType: "home_delivery" | "store_pickup";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  recipientName: string;
  recipientPhone: string;
  recipientAddress?: string;
  adminLink: string;
  referrer?: {
    referral_code: string;
    referrer_name: string;
    referrer_email: string;
  } | null;
}) {
  const itemsHTML = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${item.price}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0ea5e9;">${item.total}</td>
    </tr>
  `
    )
    .join("");

  const deliveryBadge =
    params.deliveryType === "home_delivery"
      ? `<span style="background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🚚 Entrega a Domicilio</span>`
      : `<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏪 Recogida en Tienda</span>`;

  const deliverySection =
    params.deliveryType === "home_delivery"
      ? `<h3 style="color: #1e293b; margin-top: 30px;">📍 Dirección de Entrega en Cuba:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #334155; font-weight: 600;">${
              params.recipientName
            }</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">📞 ${
              params.recipientPhone
            }</p>
            ${
              params.recipientAddress
                ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${params.recipientAddress}</p>`
                : ""
            }
          </div>`
      : `<h3 style="color: #1e293b; margin-top: 30px;">🏪 Recogida en Tienda:</h3>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #334155; font-weight: 600;">Cliente: ${params.recipientName}</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">📞 ${params.recipientPhone}</p>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 14px; font-weight: 600;">Punto de Recogida:</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">📍 San Clemente esquina Cisneros, Camagüey, Cuba</p>
          </div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Nueva Orden</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-bottom: 10px;">Nueva Orden Recibida</h2>
          <div style="margin-bottom: 10px;">${deliveryBadge}</div>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Orden #${
            params.orderId
          } - ${params.orderDate}</p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">⚡ Acción Requerida</p>
            <p style="margin: 8px 0 0; color: #7f1d1d; font-size: 14px;">${
              params.deliveryType === "home_delivery"
                ? "Procesa este pedido y coordina el envío a Cuba"
                : "Prepara este pedido para recogida en tienda"
            }</p>
          </div>
          <h3 style="color: #1e293b; margin-top: 30px;">👤 Información del Cliente:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #334155;"><strong>Nombre:</strong> ${
              params.customerName
            }</p>
            <p style="margin: 8px 0 0; color: #334155;"><strong>Email:</strong> ${
              params.customerEmail
            }</p>
            <p style="margin: 8px 0 0; color: #334155;"><strong>Teléfono:</strong> ${
              params.customerPhone
            }</p>
          </div>
          ${
            params.referrer
              ? `<h3 style="color: #1e293b; margin-top: 30px;">🤝 Información del Referidor:</h3>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #334155;"><strong>Código:</strong> <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${params.referrer.referral_code}</span></p>
            <p style="margin: 8px 0 0; color: #334155;"><strong>Nombre:</strong> ${params.referrer.referrer_name}</p>
            <p style="margin: 8px 0 0; color: #334155;"><strong>Email:</strong> ${params.referrer.referrer_email}</p>
          </div>`
              : ""
          }
          <h3 style="color: #1e293b;">💰 Resumen del Pedido:</h3>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b;"><strong>Subtotal:</strong> ${
              params.subtotal
            }</p>
            <p style="margin: 8px 0 0; color: #64748b;"><strong>Envío:</strong> ${
              params.shippingFee === "$0.00 USD"
                ? "Gratis (Recogida en tienda)"
                : params.shippingFee
            }</p>
            <p style="margin: 8px 0 0; color: #0ea5e9; font-size: 24px; font-weight: 700;"><strong>Total:</strong> ${
              params.totalAmount
            }</p>
          </div>
          <h3 style="color: #1e293b; margin-top: 30px;">📦 Productos:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">PRODUCTO</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600;">CANT.</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">PRECIO</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          ${deliverySection}
          <div style="text-align: center; margin-top: 30px;">
            <a href="${
              params.adminLink
            }" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Gestionar Orden en Admin</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// HTML Template Generator for Referrer Email
function generateReferrerEmailHTML(params: {
  orderId: string;
  orderDate: string;
  totalAmount: string;
  subtotal: string;
  shippingFee: string;
  deliveryType: "home_delivery" | "store_pickup";
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  referrerName: string;
}) {
  const itemsHTML = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${item.price}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0ea5e9;">${item.total}</td>
    </tr>
  `
    )
    .join("");

  const deliveryBadge =
    params.deliveryType === "home_delivery"
      ? `<span style="background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🚚 Entrega a Domicilio</span>`
      : `<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏪 Recogida en Tienda</span>`;

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Nueva Comisión Generada</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-bottom: 10px;">¡Felicidades ${
            params.referrerName
          }!</h2>
          <div style="margin-bottom: 10px;">${deliveryBadge}</div>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Orden #${
            params.orderId
          } - ${params.orderDate}</p>
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; color: #0369a1; font-weight: 600;">💰 ¡Tu cliente ha realizado un pedido!</p>
            <p style="margin: 8px 0 0; color: #075985; font-size: 14px;">Ganarás una comisión por esta orden cuando sea entregada y marcada como pagada.</p>
          </div>
          <h3 style="color: #1e293b; margin-top: 30px;">👤 Cliente:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #334155; font-weight: 600;">${
              params.customerName
            }</p>
          </div>
          <h3 style="color: #1e293b;">💰 Resumen del Pedido:</h3>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b;"><strong>Subtotal:</strong> ${
              params.subtotal
            }</p>
            <p style="margin: 8px 0 0; color: #64748b;"><strong>Envío:</strong> ${
              params.shippingFee === "$0.00 USD"
                ? "Gratis (Recogida en tienda)"
                : params.shippingFee
            }</p>
            <p style="margin: 8px 0 0; color: #0ea5e9; font-size: 24px; font-weight: 700;"><strong>Total:</strong> ${
              params.totalAmount
            }</p>
          </div>
          <h3 style="color: #1e293b; margin-top: 30px;">📦 Productos:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">PRODUCTO</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600;">CANT.</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">PRECIO</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          <div style="background: #ecfccb; padding: 16px; border-radius: 8px; margin-top: 30px;">
            <p style="margin: 0; color: #3f6212; font-weight: 600;">✨ Sigue recomendando Isla Market</p>
            <p style="margin: 8px 0 0; color: #4d7c0f; font-size: 14px;">Cada venta de tus referidos te genera comisión. ¡Gracias por confiar en nosotros!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Envía emails de confirmación de orden al cliente y notificación al admin
 */
export async function sendOrderEmails({
  order,
  user,
  shippingAddress,
  referrer,
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
    const recipientPhone = shippingAddress.phone;

    // Construir dirección solo si los campos existen (home_delivery)
    const recipientAddress =
      shippingAddress.street && shippingAddress.house_number
        ? `${shippingAddress.street} #${shippingAddress.house_number}, entre ${shippingAddress.between_streets}, ${shippingAddress.neighborhood}, ${shippingAddress.province}, Cuba`
        : undefined;

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

    // Calcular subtotal y shipping fee
    const subtotal = order.order_items.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const subtotalFormatted = `$${subtotal.toFixed(2)} USD`;
    const shippingFee = (order as any).shipping_fee || 0;
    const shippingFeeFormatted = `$${shippingFee.toFixed(2)} USD`;
    const deliveryType = (order as any).delivery_type || "home_delivery";

    // 1. Enviar email al cliente
    const customerEmailHtml = generateCustomerEmailHTML({
      customerName,
      orderId: order.id.slice(0, 8).toUpperCase(),
      orderDate,
      totalAmount,
      subtotal: subtotalFormatted,
      shippingFee: shippingFeeFormatted,
      deliveryType: deliveryType as "home_delivery" | "store_pickup",
      items,
      recipientName,
      recipientPhone,
      recipientAddress,
    });

    const customerEmailResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `✅ Confirmación de Pedido #${order.id
        .slice(0, 8)
        .toUpperCase()} - Isla Market`,
      html: customerEmailHtml,
    });

    console.log("✅ Email enviado al cliente:", customerEmailResult);

    // 2. Enviar email al admin
    const adminEmailHtml = generateAdminEmailHTML({
      orderId: order.id.slice(0, 8).toUpperCase(),
      orderDate,
      totalAmount,
      subtotal: subtotalFormatted,
      shippingFee: shippingFeeFormatted,
      deliveryType: deliveryType as "home_delivery" | "store_pickup",
      customerName,
      customerEmail: user.email,
      customerPhone,
      items,
      recipientName,
      recipientPhone,
      recipientAddress,
      adminLink,
      referrer,
    });

    const adminEmailResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      cc: CC_EMAIL,
      subject: `🔔 Nueva Orden #${order.id
        .slice(0, 8)
        .toUpperCase()} - Isla Market Admin`,
      html: adminEmailHtml,
    });

    console.log("✅ Email enviado al admin:", adminEmailResult);

    // 3. Enviar email al referidor (si existe)
    console.log("[SEND-EMAILS] Verificando si hay referidor...");
    console.log("[SEND-EMAILS] - referrer:", referrer);
    console.log(
      "[SEND-EMAILS] - referrer?.referrer_email:",
      referrer?.referrer_email
    );

    let referrerEmailResult = null;
    if (referrer && referrer.referrer_email) {
      console.log(
        "[SEND-EMAILS] 🎯 Enviando email al referidor:",
        referrer.referrer_email
      );

      const referrerEmailHtml = generateReferrerEmailHTML({
        orderId: order.id.slice(0, 8).toUpperCase(),
        orderDate,
        totalAmount,
        subtotal: subtotalFormatted,
        shippingFee: shippingFeeFormatted,
        deliveryType: deliveryType as "home_delivery" | "store_pickup",
        customerName,
        items,
        referrerName: referrer.referrer_name,
      });

      referrerEmailResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: referrer.referrer_email,
        subject: `🎉 Nueva Comisión - Pedido #${order.id
          .slice(0, 8)
          .toUpperCase()} - Isla Market`,
        html: referrerEmailHtml,
      });

      console.log("✅ Email enviado al referidor:", referrerEmailResult);
    } else {
      console.log(
        "[SEND-EMAILS] ❌ NO se enviará email al referidor (referrer es null o sin email)"
      );
    }

    return {
      success: true,
      customerEmailId: customerEmailResult.data?.id,
      adminEmailId: adminEmailResult.data?.id,
      referrerEmailId: referrerEmailResult?.data?.id,
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

    const result = await resend.emails.send({
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

/**
 * Envía email al admin notificando la cancelación de una orden
 */
export async function sendOrderCancellationAdminEmail({
  order,
  user,
  shippingAddress,
}: SendOrderEmailsParams) {
  try {
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

    const itemsHTML = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${item.price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0ea5e9;">${item.total}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Orden Cancelada</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-bottom: 10px;">Cancelación de Orden</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Orden #${order.id
              .slice(0, 8)
              .toUpperCase()} - ${orderDate}</p>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">❌ Orden Cancelada por el Cliente</p>
              <p style="margin: 8px 0 0; color: #7f1d1d; font-size: 14px;">El stock de los productos ha sido restaurado automáticamente</p>
            </div>
            <h3 style="color: #1e293b; margin-top: 30px;">👤 Información del Cliente:</h3>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #334155;"><strong>Nombre:</strong> ${customerName}</p>
              <p style="margin: 8px 0 0; color: #334155;"><strong>Email:</strong> ${
                user.email
              }</p>
              <p style="margin: 8px 0 0; color: #334155;"><strong>Teléfono:</strong> ${customerPhone}</p>
            </div>
            <h3 style="color: #1e293b;">💰 Total de la Orden Cancelada:</h3>
            <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 10px 0; text-decoration: line-through;">${totalAmount}</p>
            <h3 style="color: #1e293b; margin-top: 30px;">📦 Productos (Stock Restaurado):</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">PRODUCTO</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600;">CANT.</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">PRECIO</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">TOTAL</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            <h3 style="color: #1e293b; margin-top: 30px;">📍 Dirección de Entrega (Cancelada):</h3>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
              <p style="margin: 0; color: #334155; font-weight: 600;">${recipientName}</p>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${recipientAddress}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${adminLink}" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Ver Orden en Admin</a>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Esta orden fue cancelada por el cliente y el stock ha sido devuelto al inventario.
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      cc: CC_EMAIL,
      subject: `❌ Orden Cancelada #${order.id
        .slice(0, 8)
        .toUpperCase()} - Isla Market Admin`,
      html,
    });

    console.log("✅ Email de cancelación enviado al admin:", result);

    return {
      success: true,
      emailId: result.data?.id,
    };
  } catch (error) {
    console.error("❌ Error al enviar email de cancelación al admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
