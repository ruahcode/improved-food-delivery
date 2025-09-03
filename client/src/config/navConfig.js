// Navigation configuration based on user roles
export const navConfig = {
  user: [
    { to: "/", text: "Home", icon: "FaHome" },
    { to: "/restaurants", text: "Restaurants", icon: "FaUtensils" },
    { to: "/favorites", text: "Favorites", icon: "FaHeart" },
    { to: "/contact", text: "Contact Us", icon: "FaPhone" }
  ],
  admin: [
    { to: "/", text: "Home", icon: "FaHome" },
    { to: "/admin", text: "Dashboard", icon: "FaTachometerAlt" },
    { to: "/admin/users", text: "Users", icon: "FaUsers" },
    { to: "/admin/orders", text: "Orders", icon: "FaShoppingBag" },
    { to: "/admin/analytics", text: "Analytics", icon: "FaChartBar" },
    { to: "/admin/settings", text: "Settings", icon: "FaCog" }
  ]
};

export const getNavLinksForRole = (role) => {
  if (role === 'admin') return navConfig.admin;
  return navConfig.user;
};