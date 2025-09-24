// app/api/cart/add/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await req.json();

    // Check if product exists and has enough stock
    const [product] = await pool.query(
      "SELECT stock_quantity FROM products WHERE id = ?",
      [productId]
    );

    if (product.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (product[0].stock_quantity < quantity) {
      return NextResponse.json({ message: "Not enough stock" }, { status: 400 });
    }

    // Check if item already exists in cart
    const [existingItem] = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
      [token.userId, productId]
    );

    if (existingItem.length > 0) {
      // Update quantity if item exists
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
        [quantity, token.userId, productId]
      );
    } else {
      // Add new item to cart
      await pool.query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [token.userId, productId, quantity]
      );
    }

    // Return updated cart
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

    return NextResponse.json({ cart, message: "Item added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { message: "Error adding to cart", error: error.message },
      { status: 500 }
    );
  }
}