import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })

export async function POST(request) {
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature")

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)

    const handleSessionCompleted = async (session) => {
      const { orderIds, userId, appId } = session.metadata

      if (appId !== "KrisMart") {
        console.warn("Invalid appId", appId)
        return
      }

      const orderIdArray = orderIds.split(",")

      // Mark orders as paid
      await Promise.all(
        orderIdArray.map(async (orderId) => {
          await prisma.order.update({
            where: { id: orderId },
            data: { isPaid: true },
          })
        })
      )

      // Clear user cart
      await prisma.user.update({
        where: { id: userId },
        data: { cart: {} },
      })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        await handleSessionCompleted(session)
        break
      }
      case "payment_intent.canceled": {
        const intent = event.data.object
        const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id })
        const session = sessions.data[0]
        if (session?.metadata?.orderIds) {
          const orderIdArray = session.metadata.orderIds.split(",")
          await Promise.all(
            orderIdArray.map(async (orderId) => {
              await prisma.order.delete({ where: { id: orderId } })
            })
          )
        }
        break
      }
      default:
        console.log("Unhandled event type:", event.type)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export const config = {
  api: {
    bodyParser: false, // ✅ pakai bodyParser (camelCase benar)
  },
}
