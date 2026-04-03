"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCartItems(JSON.parse(localStorage.getItem('aapnexa_cart')) || []);
    
    // Auth Guard Observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const saveCart = (newCart) => {
    localStorage.setItem('aapnexa_cart', JSON.stringify(newCart));
    setCartItems(newCart);
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    saveCart(newCart);
  };

  const checkoutWhatsApp = async () => {
    if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let userEmail = "";
    if (auth.currentUser) {
        userEmail = auth.currentUser.email;
    } else {
        const guestEmail = window.prompt("Bulk Guest Checkout: Please enter your Email Address.\\n\\n(Use this exact email later to login and track your delivery status!)");
        if (!guestEmail || !guestEmail.includes("@")) {
            alert("A valid Email Address is required to finalize your checkout securely.");
            return;
        }
        userEmail = guestEmail;
    }

    const userPhone = window.prompt("Delivery Details:\\n\\nPlease enter your active Phone Number (10 Digits) to securely confirm this dropoff!");
    if (!userPhone || userPhone.trim().length < 10) {
        alert("A valid Phone Number is securely required to generate your tracking endpoints.");
        return;
    }

    const adminPhone = "919608751759";
    let message = `*Bulk Order Notification (Aapnexa)*%0A%0A*Customer Email:* ${userEmail}%0A*Contact Number:* ${userPhone}%0A%0A`;
    
    let total = 0;
    cartItems.forEach((item, index) => {
        const visualInfo = item.image || item.imageUrl || item.img || "No Photo Attached";
        message += `${index + 1}. *${item.name}*%0A- Size: ${item.size} | Qty: ${item.quantity}%0A- Price: ₹${item.price * item.quantity}%0A- Product Link: ${visualInfo}%0A%0A`;
        total += (item.price * item.quantity);
    });
    
    message += `*Total Amount: ₹${total}*`;

    try {
        const orderDate = new Date().toISOString();
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7); // Calculate T+7 Expected Delivery

        // Record isolated documents securely per item in firestore
        for (const item of cartItems) {
            await addDoc(collection(db, "orders"), {
                userEmail: userEmail,
                userPhone: userPhone,
                productName: item.name,
                price: parseFloat(item.price),
                orderDate: orderDate,
                deliveryDate: deliveryDate.toISOString(),
                status: "Processing",
            });
        }

        // Empty user cart to successfully process session
        saveCart([]);

    } catch(err) {
        console.error("Firebase Write Error:", err);
    } finally {
        // Final resilient direct navigation completely bypassing Chrome/Safari Popup restrictions safely natively
        window.location.href = `https://wa.me/${adminPhone}?text=${message}`;
    }
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (!isClient) return null; // Prevent hydration errors

  return (
    <div className="fade-in">
        <Navbar />
        <div className="cart-container">
            <h2>Your Shopping Cart</h2>
            <div id="cartItems">
                {cartItems.length === 0 ? <p style={{ padding: '20px 0', fontSize: '18px', color: 'gray' }}>Your cart is currently empty. Start browsing our catalog!</p> : cartItems.map((item, idx) => (
                    <div className="cart-item" key={idx}>
                        <img src={item.image || item.imageUrl || item.img || "https://placehold.co/400x400?text=No+Visual"} alt={item.name || "Product"} />
                        <div className="cart-item-details">
                            <h3>{item.name || "Untitled Item"}</h3>
                            <p>Size: {item.size} | Qty: {item.quantity}</p>
                            <p className="price">₹{item.price}</p>
                        </div>
                        <button className="remove-btn" onClick={() => removeItem(idx)}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
            
            {cartItems.length > 0 && (
                <div className="cart-summary" id="cartSummary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span id="cartSubtotal">₹{totalAmount}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    <div className="summary-row" style={{ fontWeight: 'bold', fontSize: '18px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                        <span>Total</span>
                        <span id="cartTotal">₹{totalAmount}</span>
                    </div>
                    <button className="btn" id="checkoutBtn" onClick={checkoutWhatsApp} style={{ width: '100%', marginTop: '20px', padding: '15px' }}>
                        <i className="fa-brands fa-whatsapp"></i> Secure Checkout
                    </button>
                </div>
            )}
        </div>
        <Footer />
    </div>
  );
}
