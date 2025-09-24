import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  console.log("Middleware hit! Token:", token);

  if (!token) {
    console.log("No token found, redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token valid, allowing access");
    return NextResponse.next();
  } catch (err) {
    console.log("Token invalid, redirecting to /login", err.message);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Protect all dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
  runtime: "nodejs", // important for JWT
};
