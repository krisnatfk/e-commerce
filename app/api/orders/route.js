import prisma from "@/lib/prisma";
import { ensureUserExists } from "@/lib/ensureUser";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Ensure user exists in DB (auto-sync from Clerk)
    await ensureUserExists(userId);

    const { addressId, items, couponCode, paymentMethod, shippingCost, shippingCourier } = await request.json();

    if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "missing order details" }, { status: 401 });
    }

    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (!coupon) {
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }
    }

    if (couponCode && coupon.forNewUser) {
      const userorders = await prisma.order.findMany({ where: { userId } });
      if (userorders.length > 0) {
        return NextResponse.json({ error: "Coupon valid for new users" }, { status: 400 });
      }
    }

    const isPlusMember = has({ plan: "plus" });

    if (couponCode && coupon.forMember) {
      if (!isPlusMember) {
        return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 });
      }
    }

    // Get user details for Midtrans
    const userData = await prisma.user.findUnique({ where: { id: userId } });

    const orderByStore = new Map();

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      const storeId = product.storeId;
      if (!orderByStore.has(storeId)) {
        orderByStore.set(storeId, []);
      }
      orderByStore.get(storeId).push({ ...item, price: product.price });
    }

    let orderIds = [];
    let fullAmount = 0;
    let isShippingFeeAdded = false;

    // Use the shipping cost from frontend (RajaOngkir) or default
    const actualShippingCost = shippingCost || 0;
    const actualShippingCourier = shippingCourier || "";

    for (const [storeId, sellerItems] of orderByStore.entries()) {
      let total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      if (couponCode) {
        total -= (total * coupon.discount) / 100;
      }

      // Add shipping cost (only once, from RajaOngkir calculation)
      if (!isPlusMember && !isShippingFeeAdded && actualShippingCost > 0) {
        total += actualShippingCost;
        isShippingFeeAdded = true;
      }

      fullAmount += total;

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: total,
          paymentMethod,
          shippingCost: !isShippingFeeAdded ? 0 : actualShippingCost,
          shippingCourier: actualShippingCourier,
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      orderIds.push(order.id);
    }

    // MIDTRANS PAYMENT INTEGRATION
    if (paymentMethod === 'MIDTRANS') {
      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
      });

      const parameter = {
        "transaction_details": {
          "order_id": `TRIMOJOYO-${Date.now()}-${orderIds[0].substring(0, 5)}`,
          "gross_amount": Math.round(fullAmount)
        },
        "credit_card": {
          "secure": true
        },
        "customer_details": {
          "first_name": userData?.name || "Customer",
          "email": userData?.email || "",
        },
        "item_details": items.map(item => ({
          id: item.id,
          price: Math.round(item.price),
          quantity: item.quantity,
          name: item.name?.substring(0, 50) || "Product"
        })).concat(
          actualShippingCost > 0 && !isPlusMember ? [{
            id: "SHIPPING",
            price: Math.round(actualShippingCost),
            quantity: 1,
            name: `Ongkir ${actualShippingCourier.toUpperCase()}`
          }] : []
        ).concat(
          coupon ? [{
            id: "DISCOUNT",
            price: -Math.round(items.reduce((acc, item) => acc + item.price * item.quantity, 0) * coupon.discount / 100),
            quantity: 1,
            name: `Diskon ${coupon.code}`
          }] : []
        )
      };

      const transaction = await snap.createTransaction(parameter);

      // Clear cart after creating Midtrans transaction
      await prisma.user.update({
        where: { id: userId },
        data: { cart: {} },
      });

      return NextResponse.json({ token: transaction.token, redirect_url: transaction.redirect_url, orderIds });
    }


    // clear cart for COD
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json({ message: "Order Placed Successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    // Return ALL orders (including unpaid MIDTRANS) so customer can see payment status
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
