export const plans = {
  free: {
    name: "Free",
    features: ["basic_dispatch", "simulation"]
  },
  pro: {
    name: "Pro",
    features: ["basic_dispatch", "ai_dispatch", "simulation"]
  },
  enterprise: {
    name: "Enterprise",
    features: ["all"]
  }
};

export const planLimits = {
  free: {
    maxSimulations: 3,
    maxActiveEmergencies: 5,
    autoSimulation: false
  },
  pro: {
    maxSimulations: 50,
    maxActiveEmergencies: 20,
    autoSimulation: true
  },
  enterprise: {
    maxSimulations: Infinity,
    maxActiveEmergencies: Infinity,
    autoSimulation: true
  }
};

export const hasFeature = (plan, feature) => {
  if (!plan) return false;
  if (plan === "enterprise") return true;
  return plans[plan]?.features?.includes(feature);
};
