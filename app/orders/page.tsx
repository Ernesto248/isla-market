'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Calendar, DollarSign, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { mockOrders } from '@/lib/mock-data';

export default function OrdersPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Filter orders for current user
  const userOrders = mockOrders.filter(order => order.userId === user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t.myOrders}</h1>
        <p className="text-xl text-muted-foreground">
          {language === 'en' 
            ? `You have ${userOrders.length} orders`
            : `Tienes ${userOrders.length} órdenes`
          }
        </p>
      </motion.div>

      {userOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            {language === 'en' 
              ? 'You haven\'t placed any orders yet'
              : 'Aún no has realizado ningún pedido'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? 'Start shopping to send love to your family in Cuba'
              : 'Comienza a comprar para enviar amor a tu familia en Cuba'
            }
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>{t.orderNumber}{order.id}</span>
                    </CardTitle>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status === 'pending' ? t.pending : t.delivered}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Order Info */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderDate}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderTotal}</p>
                        <p className="text-sm text-muted-foreground">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderStatus}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.status === 'pending' ? t.pending : t.delivered}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">
                      {language === 'en' ? 'Recipient in Cuba' : 'Destinatario en Cuba'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo.firstName} {order.recipientInfo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo.street} #{order.recipientInfo.houseNumber}, {order.recipientInfo.betweenStreets}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo.neighborhood}, {order.recipientInfo.province}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">
                      {language === 'en' ? 'Items' : 'Artículos'}
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-4">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {t.quantity}: {item.quantity} × ${item.product.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}