export const ROUTE_ACCESS = [
  { path: "/dashboard", accessKey: "dashboard" },
  { path: "/user-management", accessKey: "userManagement" },
  { path: "/staff-management", accessKey: "staffManagement" },
  { path: "/sub-admin-management", accessKey: "subAdminManagement" },
  { path: "/deposit-history", accessKey: "depositHistory" },
  { path: "/referral-histories", accessKey: "referralHistories" },
  { path: "/withdraw-management", accessKey: "withdrawManagement" },
  { path: "/payments-structure", accessKey: "paymentsStructure" },
  { path: "/payment-gateway-management", accessKey: "paymentGateway" },
  { path: "/ad-banner", accessKey: "adBanner" },
  { path: "/app-update", accessKey: "appUpdate" },
  { path: "/push-notification", accessKey: "pushNotification" },
  { path: "/support", accessKey: "supportTickets" },
  { path: "/chat-audit", accessKey: "chatAudit" },
  { path: "/staff-reports", accessKey: "reports" },
  { path: "/user-reports", accessKey: "reports" },
  { path: "/overall-call-history", accessKey: "callHistory" },
  { path: "/staff-speaking-reports", accessKey: "reports" },
];

const isObject = (value) => value && typeof value === "object";

const isAccountLike = (value) =>
  isObject(value) &&
  ("permissions" in value ||
    "access" in value ||
    "isSubAdmin" in value ||
    "isSuperAdmin" in value ||
    "isVerified" in value ||
    "status" in value ||
    "email" in value ||
    "name" in value ||
    "id" in value ||
    "_id" in value ||
    "roleName" in value ||
    "role" in value);

export const getAuthAccount = (session) => {
  const candidates = [
    session?.user,
    session?.raw?.user,
    session?.raw?.data?.user,
    session?.raw?.data,
    session?.data?.user,
    session?.data,
    session?.raw,
    session,
  ];

  return candidates.find(isAccountLike) || null;
};

export const isSubAdmin = (session) => {
  const account = getAuthAccount(session);
  return Boolean(
    account?.isSubAdmin === true ||
      (Array.isArray(account?.permissions) && account.permissions.length > 0) ||
      (Array.isArray(account?.access) && account.access.length > 0)
  );
};

export const getPermissions = (session) => {
  const account = getAuthAccount(session);
  const permissions = account?.permissions || account?.access || [];

  if (Array.isArray(permissions)) {
    return permissions;
  }

  return typeof permissions === "string" ? [permissions] : [];
};

export const canAccessKey = (session, accessKey) => {
  if (!accessKey || !isSubAdmin(session)) {
    return true;
  }

  return getPermissions(session).includes(accessKey);
};

export const canAccessPath = (session, pathname) => {
  if (!isSubAdmin(session)) {
    return true;
  }

  const route = ROUTE_ACCESS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return route ? canAccessKey(session, route.accessKey) : true;
};

export const getFirstAllowedPath = (session) => {
  if (!isSubAdmin(session)) {
    return "/dashboard";
  }

  const permissions = getPermissions(session);
  const firstRoute = ROUTE_ACCESS.find((route) =>
    permissions.includes(route.accessKey)
  );

  return firstRoute?.path || "/";
};
