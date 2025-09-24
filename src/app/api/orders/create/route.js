// app/api/orders/create/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { items, total, shippingAddress, paymentMethod } = await req.json();

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) 
         VALUES (?, ?, 'processing', ?, ?)`,
        [token.userId, total, JSON.stringify(shippingAddress), paymentMethod]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product.id, item.quantity, item.product.price]
        );

        // Update product stock
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.product.id]
        );
      }

      // Clear user's cart
      await connection.query(
        'DELETE FROM cart_items WHERE user_id = ?',
        [token.userId]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ 
        success: true, 
        orderId,
        message: "Order created successfully" 
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Order creation error:", error);
      return NextResponse.json(
        { success: false, message: "Error creating order", error: error.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}