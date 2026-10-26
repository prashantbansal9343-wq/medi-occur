export function dashboardPathForRole(role) {
  switch (role) {
    case "WHOLESALER":
      return "/wholesaler";
    case "DELIVERY":
      return "/delivery";
    case "ADMIN":
      return "/admin";
    case "RETAILER":
    default:
      return "/retailer";
  }
}
