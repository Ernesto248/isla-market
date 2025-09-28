'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, User, MapPin, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  // Customer Information
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  
  // Recipient Information
  recipientFirstName: z.string().min(2, 'Recipient first name is required'),
  recipientLastName: z.string().min(2, 'Recipient last name is required'),
  street: z.string().min(5, 'Street address is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  betweenStreets: z.string().min(5, 'Between streets is required'),
  neighborhood: z.string().min(2, 'Neighborhood is required'),
  province: z.string().min(2, 'Province is required'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { language, user, cart, getCartTotal, clearCart } = useAppStore();
  const t = translations[language];
  const total = getCartTotal();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/products');
    }
  }, [cart, router]);

  const onSubmit = async (data: CheckoutForm) => {
    setIsLoading(true);
    
    // TODO: Integrate with payment processing and Supabase
    setTimeout(() => {
      // Mock order creation
      toast.success(
        language === 'en' 
          ? 'Order placed successfully! You will receive a confirmation email shortly.'
          : '¡Pedido realizado con éxito! Recibirás un email de confirmación pronto.'
      );
      
      clearCart();
      setIsLoading(false);
      router.push('/orders');
    }, 2000);
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t.checkout}</h1>
        <p className="text-xl text-muted-foreground">
          {language === 'en' 
            ? 'Complete your order to send love to Cuba'
            : 'Completa tu pedido para enviar amor a Cuba'
          }
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{t.customerInformation}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t.firstName}</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      className={form.formState.errors.firstName ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t.lastName}</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      className={form.formState.errors.lastName ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    className={form.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register('phone')}
                    className={form.formState.errors.phone ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{t.recipientInformation}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientFirstName">{t.firstName}</Label>
                    <Input
                      id="recipientFirstName"
                      {...form.register('recipientFirstName')}
                      className={form.formState.errors.recipientFirstName ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.recipientFirstName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.recipientFirstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipientLastName">{t.lastName}</Label>
                    <Input
                      id="recipientLastName"
                      {...form.register('recipientLastName')}
                      className={form.formState.errors.recipientLastName ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.recipientLastName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.recipientLastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">{t.street}</Label>
                    <Input
                      id="street"
                      {...form.register('street')}
                      className={form.formState.errors.street ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.street && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.street.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">{t.houseNumber}</Label>
                    <Input
                      id="houseNumber"
                      {...form.register('houseNumber')}
                      className={form.formState.errors.houseNumber ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.houseNumber && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.houseNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="betweenStreets">{t.betweenStreets}</Label>
                  <Input
                    id="betweenStreets"
                    {...form.register('betweenStreets')}
                    className={form.formState.errors.betweenStreets ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.betweenStreets && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.betweenStreets.message}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">{t.neighborhood}</Label>
                    <Input
                      id="neighborhood"
                      {...form.register('neighborhood')}
                      className={form.formState.errors.neighborhood ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.neighborhood && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.neighborhood.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="province">{t.province}</Label>
                    <Input
                      id="province"
                      {...form.register('province')}
                      className={form.formState.errors.province ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.province && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.province.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <CreditCard className="h-5 w-5 mr-2" />
              )}
              {isLoading 
                ? (language === 'en' ? 'Processing...' : 'Procesando...')
                : t.placeOrder
              }
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>
                  {language === 'en' ? 'Order Summary' : 'Resumen del Pedido'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium text-sm">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t.total}:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}