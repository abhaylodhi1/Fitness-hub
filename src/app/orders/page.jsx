// app/checkout/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useShoppingStore } from "@/store/useShoppingStore";
import { 
  FaArrowLeft, 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaPaypal, 
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaCheck,
  FaLock,
  FaCheckCircle,
  FaStore
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cart } = useShoppingStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const hasSetDefaultAddress = useRef(false);
  
  // Form states
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: ""
  });
  
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: ""
  });

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 1,
      fullName: "John Doe",
      street: "123 Fitness Street",
      city: "Gym City",
      state: "CA",
      zipCode: "90210",
      phone: "(555) 123-4567",
      isDefault: true
    },
    {
      id: 2,
      fullName: "John Doe",
      street: "456 Workout Ave",
      city: "Healthville",
      state: "NY",
      zipCode: "10001",
      phone: "(555) 987-6543",
      isDefault: false
    }
  ]);
// Add this to your useEffect dependencies
useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Don't redirect if we're in the middle of processing
    if (cart.length === 0 && !orderSuccess && !isProcessing) {
      toast.error("Your cart is empty");
      router.push("/cart");
      return;
    }
    
    // Only set default address once
    if (!hasSetDefaultAddress.current && savedAddresses.length > 0 && !orderSuccess && !isProcessing) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
        hasSetDefaultAddress.current = true;
      }
    }
  }, [user, cart, router, savedAddresses, orderSuccess, isProcessing]);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.08;
  };

  const calculateFinalTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    
    // Validate the form
    if (!addressForm.fullName || !addressForm.street || !addressForm.city || 
        !addressForm.state || !addressForm.zipCode || !addressForm.phone) {
      toast.error("Please fill all address fields");
      return;
    }
    
    const newAddress = {
      id: Date.now(),
      ...addressForm,
      isDefault: savedAddresses.length === 0
    };
    
    setSavedAddresses(prev => [...prev, newAddress]);
    setSelectedAddress(newAddress.id);
    setIsAddingAddress(false);
    setAddressForm({
      fullName: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      phone: ""
    });
    toast.success("Address added successfully");
  };

  const handlePlaceOrder = async () => {
    console.log("Placing order...");
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const address = savedAddresses.find(addr => addr.id === selectedAddress);
      const orderData = {
        items: cart,
        total: calculateFinalTotal(),
        shippingAddress: address,
        paymentMethod: selectedPayment
      };
  
      console.log("Order data:", orderData);
      
      // Use the checkout method from your store
      const result = await useShoppingStore.getState().checkout(orderData);
      console.log("Checkout result:", result);
      
      if (result && result.success) {
        console.log("Order successful");
        setOrderSuccess(true);
        setOrderId(result.orderId);
        
        // Show the success message as a toast
        toast.success(
          <div>
            <div className="font-semibold">Order Created Successfully!</div>
            <div className="text-sm">Order ID: {result.orderId}</div>
          </div>,
          {
            duration: 5000,
            icon: '✅',
          }
        );
      } else {
        console.log("Order failed:", result);
        toast.error(result?.message || "Failed to place order");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order");
      setIsProcessing(false);
    }
  };

  const renderConfirmation = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <FaCheckCircle className="text-4xl text-green-600" />
      </motion.div>
      
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Order Confirmed!</h2>
      <p className="text-lg text-gray-600 mb-2">
        Thank you for your purchase!
      </p>
      {orderId && (
        <p className="text-gray-600 mb-6">
          Your order ID is: <span className="font-semibold">{orderId}</span>
        </p>
      )}
      <p className="text-gray-500 mb-8">
        You will receive a confirmation email shortly with your order details.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/orders"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
        >
          View Orders
        </Link>
        <Link
          href="/shop"
          className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
        >
          <FaStore /> Continue Shopping
        </Link>
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Shipping Address</h2>
      
      <div className="grid gap-4">
        {savedAddresses.map((address) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAddress === address.id 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedAddress(address.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-800">{address.fullName}</h3>
                  {address.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{address.street}</p>
                <p className="text-gray-600">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-gray-600 mt-2">{address.phone}</p>
              </div>
              {selectedAddress === address.id && (
                <div className="text-blue-500">
                  <FaCheck />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {isAddingAddress ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border rounded-lg p-4"
        >
          <h3 className="font-medium text-gray-800 mb-4">Add New Address</h3>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <button
          onClick={() => setIsAddingAddress(true)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <FaPlus /> Add New Address
        </button>
      )}

      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={() => setActiveStep(2)}
          disabled={!selectedAddress}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Payment Method</h2>
      
      <div className="grid gap-4">
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedPayment === "card" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedPayment("card")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FaCreditCard className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Credit/Debit Card</h3>
                <p className="text-sm text-gray-600">Pay securely with your card</p>
              </div>
            </div>
            {selectedPayment === "card" && (
              <div className="text-blue-500">
                <FaCheck />
              </div>
            )}
          </div>
          
          {selectedPayment === "card" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({...cardForm, cardNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name on Card
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardForm.cardName}
                  onChange={(e) => setCardForm({...cardForm, cardName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({...cardForm, expiry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedPayment === "paypal" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedPayment("paypal")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FaPaypal className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">PayPal</h3>
                <p className="text-sm text-gray-600">Pay with your PayPal account</p>
              </div>
            </div>
            {selectedPayment === "paypal" && (
              <div className="text-blue-500">
                <FaCheck />
              </div>
            )}
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedPayment === "cod" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedPayment("cod")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FaMoneyBillWave className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Cash on Delivery</h3>
                <p className="text-sm text-gray-600">Pay when you receive your order</p>
              </div>
            </div>
            {selectedPayment === "cod" && (
              <div className="text-blue-500">
                <FaCheck />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => setActiveStep(1)}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const address = savedAddresses.find(addr => addr.id === selectedAddress);
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Review Your Order</h2>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-500" />
            Shipping Address
          </h3>
          <div className="text-gray-600">
            <p>{address.fullName}</p>
            <p>{address.street}</p>
            <p>{address.city}, {address.state} {address.zipCode}</p>
            <p>{address.phone}</p>
          </div>
          <button
            onClick={() => setActiveStep(1)}
            className="mt-3 text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaEdit /> Change
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            {selectedPayment === "card" && <FaCreditCard className="text-blue-500" />}
            {selectedPayment === "paypal" && <FaPaypal className="text-blue-500" />}
            {selectedPayment === "cod" && <FaMoneyBillWave className="text-blue-500" />}
            Payment Method
          </h3>
          <div className="text-gray-600">
            {selectedPayment === "card" && "Credit/Debit Card"}
            {selectedPayment === "paypal" && "PayPal"}
            {selectedPayment === "cod" && "Cash on Delivery"}
          </div>
          <button
            onClick={() => setActiveStep(2)}
            className="mt-3 text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaEdit /> Change
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3">Order Items</h3>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium text-gray-800">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800">{formatPrice(calculateTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-800">{formatPrice(calculateTax())}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(calculateFinalTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setActiveStep(2)}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <FaLock /> Place Order
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const steps = [
    { number: 1, title: "Address", active: activeStep === 1 && !orderSuccess },
    { number: 2, title: "Payment", active: activeStep === 2 && !orderSuccess },
    { number: 3, title: "Review", active: activeStep === 3 && !orderSuccess },
    { number: 4, title: "Complete", active: orderSuccess }
  ];

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800">Order Confirmation</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {renderConfirmation()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'mr-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.active ? 'border-blue-500 bg-blue-500 text-white' : 
                    (orderSuccess || index < activeStep - 1) ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {orderSuccess || index < activeStep - 1 ? <FaCheck /> : step.number}
                  </div>
                  <span className={`text-sm mt-2 ${
                    step.active ? 'text-blue-600 font-medium' : 
                    (orderSuccess || index < activeStep - 1) ? 'text-green-600 font-medium' : 
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    orderSuccess || index < activeStep - 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeStep === 1 && renderAddressStep()}
              {activeStep === 2 && renderPaymentStep()}
              {activeStep === 3 && renderReviewStep()}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-800">{formatPrice(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(calculateFinalTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}