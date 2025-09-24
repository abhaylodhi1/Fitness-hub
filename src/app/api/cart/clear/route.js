// app/api/cart/clear/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await pool.query(
      "DELETE FROM cart_items WHERE user_id = ?",
      [token.userId]
    );

    return NextResponse.json({ cart: { items: [] }, message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      { message: "Error clearing cart", error: error.message },
      { status: 500 }
    );
  }
}