// app/api/cart/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [cartItems] = await pool.query(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image,
        p.original_price as product_original_price,
        c.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.user_id = ?
    `, [token.userId]);

    const cart = {
      items: cartItems.map(item => ({
        id: item.id,
        product: {
          id: item.product_id,
          name: item.product_name,
          price: parseFloat(item.product_price),
          originalPrice: parseFloat(item.product_original_price),
          image: item.product_image,
          category: item.category_name
        },
        quantity: item.quantity
      }))
    };

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { message: "Error fetching cart", error: error.message },
      { status: 500 }
    );
  }
}