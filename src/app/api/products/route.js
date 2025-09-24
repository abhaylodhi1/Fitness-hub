
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch products from MySQL with reviews
    const [products] = await pool.query(`
      SELECT 
        p.*, 
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    // Format products for frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      _id: product.id, // For compatibility
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: parseFloat(product.original_price),
      image: product.image_url,
      category: product.category_name,
      rating: parseFloat(product.average_rating),
      reviewCount: product.review_count,
      inStock: product.stock_quantity > 0,
      stockQuantity: product.stock_quantity,
      createdAt: product.created_at
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Error fetching products", error: error.message },
      { status: 500 }
    );
  }
}