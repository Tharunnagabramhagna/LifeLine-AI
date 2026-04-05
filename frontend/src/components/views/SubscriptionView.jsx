import React, { useState, useEffect } from 'react';
import './subscription.css';

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    features: [
      "Basic emergency requests",
      "Limited dashboard access"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499/month",
    features: [
      "Real-time emergency dispatch",
      "AI ambulance assignment",
      "Priority alerts",
      "Autonomous simulation loop"
    ],
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹1999/month",
    features: [
      "Full system control",
      "Advanced analytics",
      "Multi-location support",
      "Custom 24/7 technical operator support"
    ]
  }
];

export default function SubscriptionView() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const p = localStorage.getItem("userPlan") || "free";
    setCurrentPlan(p);
  }, []);

  const handleUpgrade = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5005/api/user/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentPlan(planId);
        
        // Sync local user object
        const saved = JSON.parse(localStorage.getItem('user'));
        if (saved) {
          saved.plan = planId.toUpperCase();
          localStorage.setItem('user', JSON.stringify(saved));
        }

        setMessage(`Plan upgraded to ${planId.toUpperCase()} successfully`);
        window.dispatchEvent(new Event('planChanged'));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Upgrade failed. Please try again.");
    }
  };


  return (
    <div className="view-container pb-20">
      <div className="flex justify-between items-end mb-8">
        <h2 className="view-header mb-0">Subscription Plans</h2>
        <span className="text-gray-400 font-mono tracking-widest text-sm">UPGRADE ACCESS</span>
      </div>
      
      {message && <div className="success mb-6 p-4 rounded-lg bg-green-900/30 text-green-400 border border-green-500/20">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className={`subscription-card ${currentPlan === plan.id ? 'active-plan' : ''} ${plan.popular ? 'popular-plan' : ''}`}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">{plan.price}</div>
            
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span className="text-[#ff4d4d]">✓</span> {f}
                </li>
              ))}
            </ul>
            
            <button 
              className={`plan-button ${currentPlan === plan.id ? 'current-btn' : ''}`}
              onClick={() => handleUpgrade(plan.id)}
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
