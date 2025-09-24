// app/cart/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useShoppingStore } from "@/store/useShoppingStore";
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft, FaCreditCard, FaStore } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { 
    cart, 
    isLoading, 
    error, 
    fetchCart, 
    updateCartQuantity, 
    removeFromCart,
    clearCart
  } = useShoppingStore();
  
  const [isUpdating, setIsUpdating] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  useEffect(() => {
    if (!user && !isLoading) {
      toast.error("Please login to view your cart");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(prev => ({ ...prev, [productId]: true }));
    
    const result = await updateCartQuantity(productId, newQuantity);
    
    setIsUpdating(prev => ({ ...prev, [productId]: false }));
    
    if (!result.success) {
      toast.error(result.message);
    }
  };

  const handleRemoveItem = async (productId) => {
    const result = await removeFromCart(productId);
    
    if (result.success) {
      toast.success("Item removed from cart");
    } else {
      toast.error(result.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
  
    setIsCheckingOut(true);
    
    try {
      // Redirect to the checkout page for address selection and payment
      router.push("/orders");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((total, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      const discount = (originalPrice - item.product.price) * item.quantity;
      return total + Math.max(0, discount);
    }, 0);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={fetchCart}
              className="ml-4 text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-3xl text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/shop"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FaStore /> Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Cart Items</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 flex items-center gap-4"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={item.product.image || `/api/placeholder/80/80?text=${item.product.name.charAt(0)}`}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold"
                            style={{ display: 'none' }}
                          >
                            {item.product.name.charAt(0)}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {item.product.category}
                          </p>
                          
                          {/* Price */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-gray-800">
                              {formatPrice(item.product.price)}
                            </span>
                            {item.product.originalPrice > item.product.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            disabled={isUpdating[item.product.id] || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaMinus className="text-sm" />
                          </button>
                          
                          <span className="w-8 text-center font-medium">
                            {isUpdating[item.product.id] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                            ) : (
                              item.quantity
                            )}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            disabled={isUpdating[item.product.id]}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaPlus className="text-sm" />
                          </button>
                        </div>

                        {/* Total Price */}
                        <div className="text-right min-w-[80px]">
                          <p className="font-semibold text-gray-800">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          disabled={isUpdating[item.product.id]}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  {/* Summary Items */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">{formatPrice(calculateSubtotal())}</span>
                    </div>
                    
                    {calculateDiscount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount</span>
                        <span className="text-green-600">-{formatPrice(calculateDiscount())}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-800">Free</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-800">{formatPrice(calculateTotal() * 0.08)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-blue-600">
                        {formatPrice(calculateTotal() * 1.08)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Including tax</p>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cart.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCreditCard /> Checkout
                      </>
                    )}
                  </button>

                  {/* Continue Shopping */}
                  <Link
                    href="/shop"
                    className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <FaStore /> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}