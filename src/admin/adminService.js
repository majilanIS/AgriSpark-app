import { supabase } from "../lib/supabaseClient";
import { composeAccountRole, getAccountStateLabel, splitAccountRole, USER_TYPES } from "./accountRules";
import { fetchMarketplaceProducts } from "../buyer/buyerService";

const normalizeText = (value) => String(value ?? "").trim();

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAuthUser = async () => {
  const { data: authData, error } = await supabase.auth.getUser();
  const user = authData?.user;

  if (error || !user) {
    throw new Error("Please sign in again to continue.");
  }

  return user;
};

export const fetchAdminProfile = async () => {
  const authUser = await getAuthUser();
  const normalizedEmail = normalizeText(authUser.email).toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, location, profile_image_url")
    .or(`id.eq.${authUser.id},email.eq.${normalizedEmail}`)
    .maybeSingle();

  if (error) throw error;

  return (
    data || {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.email,
      email: authUser.email,
      role: authUser.user_metadata?.role || "admin",
      location: "",
      profile_image_url: "",
    }
  );
};

export const fetchAdminDashboardStats = async () => {
  const [usersResult, productsResult, ordersResult, chatsResult, reportsResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, status", { count: "exact", head: true }),
    supabase.from("messages").select("order_id", { count: "exact", head: true }).not("message", "ilike", "Issue reported:%"),
    supabase.from("messages").select("id", { count: "exact", head: true }).ilike("message", "Issue reported:%"),
  ]);

  const counts = {
    users: usersResult.count || 0,
    products: productsResult.count || 0,
    orders: ordersResult.count || 0,
    chats: chatsResult.count || 0,
    reports: reportsResult.count || 0,
  };

  const pendingOrders = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const acceptedOrders = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted");

  return {
    counts,
    pendingOrders: pendingOrders.count || 0,
    acceptedOrders: acceptedOrders.count || 0,
    activeUsers: counts.users,
    totalProducts: counts.products,
    totalOrders: counts.orders,
    openChats: counts.chats,
    reportItems: counts.reports,
    notificationCount: (pendingOrders.count || 0) + (reportsResult.count || 0),
  };
};

export const fetchAdminUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone_number, role, business_name, location, profile_image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => {
    const { userType, accountState } = splitAccountRole(row.role);

    return {
      id: row.id,
      name: row.full_name || "Unknown user",
      email: row.email || "",
      phoneNumber: row.phone_number || "",
      userType,
      accountState,
      location: row.location || "",
      businessName: row.business_name || "",
      avatarUrl: row.profile_image_url || "",
      createdAt: row.created_at,
      displayLabel: userType === USER_TYPES.FARMER ? "Farm Name" : userType === USER_TYPES.BUYER ? "Business Name" : "Account",
      statusLabel: getAccountStateLabel(accountState),
    };
  });
};

export const setAdminUserState = async ({ userId, nextState }) => {
  const cleanUserId = normalizeText(userId);
  const cleanState = normalizeText(nextState).toLowerCase();

  if (!cleanUserId) {
    throw new Error("Missing user id.");
  }

  if (!["active", "inactive"].includes(cleanState)) {
    throw new Error("Invalid user state.");
  }

  const { data: currentUser, error: currentError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", cleanUserId)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentUser) throw new Error("User not found.");

  const { userType } = splitAccountRole(currentUser.role);
  const nextRole = composeAccountRole(userType, cleanState);

  const { error } = await supabase.from("users").update({ role: nextRole }).eq("id", cleanUserId);
  if (error) throw error;
};

export const deleteAdminUser = async ({ userId }) => {
  const cleanUserId = normalizeText(userId);
  if (!cleanUserId) throw new Error("Missing user id.");

  const { error } = await supabase.from("users").delete().eq("id", cleanUserId);
  if (error) throw error;
};

export const fetchAdminUserDeletionPreview = async ({ userId }) => {
  const cleanUserId = normalizeText(userId);
  if (!cleanUserId) throw new Error("Missing user id.");

  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", cleanUserId)
    .maybeSingle();

  if (userError) throw userError;
  if (!currentUser) throw new Error("User not found.");

  const { userType } = splitAccountRole(currentUser.role);

  const [productResult, orderResult, messageResult] = await Promise.all([
    userType === USER_TYPES.FARMER
      ? supabase.from("products").select("id", { count: "exact", head: true }).eq("farmer_id", cleanUserId)
      : Promise.resolve({ count: 0, error: null }),
    userType === USER_TYPES.BUYER
      ? supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", cleanUserId)
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(`sender_id.eq.${cleanUserId},receiver_id.eq.${cleanUserId}`),
  ]);

  if (productResult.error) throw productResult.error;
  if (orderResult.error) throw orderResult.error;
  if (messageResult.error) throw messageResult.error;

  const relatedProducts = productResult.count || 0;
  const relatedOrders = orderResult.count || 0;
  const relatedMessages = messageResult.count || 0;
  const hasRelatedData = relatedProducts > 0 || relatedOrders > 0 || relatedMessages > 0;

  return {
    user: currentUser,
    userType,
    relatedProducts,
    relatedOrders,
    relatedMessages,
    hasRelatedData,
    recommendedAction: hasRelatedData ? "inactive" : "delete",
  };
};

export const fetchAdminProducts = async () => {
  const { products } = await fetchMarketplaceProducts({ limit: 500, offset: 0 });
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    farmerName: product.farmer_name,
    location: product.location || product.farmer_location || "",
    category: product.category || "Other",
    description: product.description || "",
    priceLabel: product.price_label,
    stockLabel: product.stock_label,
    imageUrl: product.image_url,
    createdLabel: product.created_label,
    farmerId: product.farmer_id,
  }));
};

export const deleteAdminProduct = async ({ productId }) => {
  const cleanProductId = normalizeText(productId);
  if (!cleanProductId) throw new Error("Missing product id.");

  const { error } = await supabase.from("products").delete().eq("id", cleanProductId);
  if (error) throw error;
};

export const fetchAdminChatUsers = async () => {
  const [userResult, orderResult, productResult, messageResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, phone_number, role, business_name, location, profile_image_url, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("id, buyer_id, product_id, status, created_at").order("created_at", { ascending: false }),
    supabase.from("products").select("id, farmer_id, name, image_url, created_at").order("created_at", { ascending: false }),
    supabase.from("messages").select("id, order_id, sender_id, receiver_id, message, created_at").order("created_at", { ascending: false }),
  ]);

  if (userResult.error) throw userResult.error;
  if (orderResult.error) throw orderResult.error;
  if (productResult.error) throw productResult.error;
  if (messageResult.error) throw messageResult.error;

  const users = userResult.data || [];
  const orders = orderResult.data || [];
  const products = productResult.data || [];
  const messages = messageResult.data || [];

  const productsMap = new Map(products.map((row) => [String(row.id), row]));
  const messagesByOrderId = new Map();

  messages.forEach((row) => {
    if (!messagesByOrderId.has(String(row.order_id))) {
      messagesByOrderId.set(String(row.order_id), row);
    }
  });

  const userThreadMap = new Map();

  orders.forEach((order) => {
    const product = productsMap.get(String(order.product_id));
    const latestMessage = messagesByOrderId.get(String(order.id));
    const thread = {
      orderId: order.id,
      productName: product?.name || "Product",
      orderStatus: normalizeText(order.status).toLowerCase() || "pending",
      lastMessage: latestMessage?.message || `Order ${normalizeText(order.status).toLowerCase() || "pending"}`,
      lastMessageAt: latestMessage?.created_at || order.created_at,
    };

    const addThread = (userId) => {
      if (!userId) return;
      const existing = userThreadMap.get(String(userId)) || [];
      existing.push(thread);
      userThreadMap.set(String(userId), existing);
    };

    addThread(order.buyer_id);
    addThread(product?.farmer_id);
  });

  return users.map((row) => {
    const { userType, accountState } = splitAccountRole(row.role);
    const threads = (userThreadMap.get(String(row.id)) || []).sort((left, right) => {
      const leftTime = new Date(left.lastMessageAt || 0).getTime();
      const rightTime = new Date(right.lastMessageAt || 0).getTime();
      return rightTime - leftTime;
    });
    const latestThread = threads[0] || null;

    return {
      id: row.id,
      name: row.full_name || "Unknown user",
      email: row.email || "",
      phoneNumber: row.phone_number || "",
      userType,
      accountState,
      location: row.location || "",
      businessName: row.business_name || "",
      avatarUrl: row.profile_image_url || "",
      createdAt: row.created_at,
      threadCount: threads.length,
      latestOrderId: latestThread?.orderId || null,
      latestProductName: latestThread?.productName || "",
      latestMessage: latestThread?.lastMessage || "No messages yet",
      latestMessageAt: latestThread?.lastMessageAt || null,
      canChat: !!latestThread?.orderId,
      threads,
    };
  });
};

export const fetchAdminChatThread = async ({ orderId }) => {
  const cleanOrderId = normalizeText(orderId);
  if (!cleanOrderId) throw new Error("Missing order id.");

  const [{ data: orderRow, error: orderError }, { data: messages, error: messageError }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, buyer_id, product_id, quantity, status, created_at")
      .eq("id", cleanOrderId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, order_id, sender_id, receiver_id, message, created_at, is_read")
      .eq("order_id", cleanOrderId)
      .order("created_at", { ascending: true }),
  ]);

  if (orderError) throw orderError;
  if (!orderRow) throw new Error("Order not found.");
  if (messageError) throw messageError;

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id, name, category, price, quantity, location, image_url, created_at")
    .eq("id", orderRow.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const { data: buyerRow, error: buyerError } = await supabase
    .from("users")
    .select("id, full_name, location, business_name, profile_image_url, role")
    .eq("id", orderRow.buyer_id)
    .maybeSingle();

  if (buyerError) throw buyerError;

  const { data: farmerRow, error: farmerError } = productRow?.farmer_id
    ? await supabase
        .from("users")
        .select("id, full_name, location, business_name, profile_image_url, role")
        .eq("id", productRow.farmer_id)
        .maybeSingle()
    : { data: null, error: null };

  if (farmerError) throw farmerError;

  return {
    order: orderRow,
    product: productRow
      ? {
          id: productRow.id,
          name: productRow.name,
          location: productRow.location || "",
          imageUrl: productRow.image_url || "",
          farmerId: productRow.farmer_id || null,
        }
      : null,
    buyer: buyerRow
      ? {
          id: buyerRow.id,
          name: buyerRow.full_name || "Buyer",
          location: buyerRow.location || "",
          businessName: buyerRow.business_name || "",
          avatarUrl: buyerRow.profile_image_url || "",
        }
      : null,
    farmer: farmerRow
      ? {
          id: farmerRow.id,
          name: farmerRow.full_name || "Farmer",
          location: farmerRow.location || "",
          businessName: farmerRow.business_name || "",
          avatarUrl: farmerRow.profile_image_url || "",
        }
      : null,
    messages: messages || [],
    receiverOptions: [
      { label: "Buyer", value: orderRow.buyer_id, name: buyerRow?.full_name || "Buyer" },
      { label: "Farmer", value: productRow?.farmer_id || null, name: farmerRow?.full_name || "Farmer" },
    ].filter((item) => !!item.value),
  };
};

export const sendAdminChatMessage = async ({ orderId, receiverId, message }) => {
  const cleanOrderId = normalizeText(orderId);
  const cleanReceiverId = normalizeText(receiverId);
  const cleanMessage = normalizeText(message);

  if (!cleanOrderId) throw new Error("Missing order id.");
  if (!cleanReceiverId) throw new Error("Missing receiver id.");
  if (!cleanMessage) throw new Error("Message cannot be empty.");

  const adminProfile = await fetchAdminProfile();

  const { error } = await supabase.from("messages").insert({
    order_id: cleanOrderId,
    sender_id: adminProfile.id,
    receiver_id: cleanReceiverId,
    message: cleanMessage,
  });

  if (error) throw error;
};

export const deleteAdminChatThreadMessages = async ({ orderId }) => {
  const cleanOrderId = normalizeText(orderId);
  if (!cleanOrderId) throw new Error("Missing order id.");

  const { error } = await supabase.from("messages").delete().eq("order_id", cleanOrderId);
  if (error) throw error;
};

export const fetchAdminOrders = async () => {
  const { data: orderRows, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

  const productIds = [...new Set((orderRows || []).map((row) => row.product_id).filter(Boolean))];
  const buyerIds = [...new Set((orderRows || []).map((row) => row.buyer_id).filter(Boolean))];
  const farmerIds = [];

  const [productResult, buyerResult, issueResult] = await Promise.all([
    productIds.length
      ? supabase
          .from("products")
          .select("id, farmer_id, name, category, price, quantity, location, image_url, created_at")
          .in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    buyerIds.length
      ? supabase
          .from("users")
          .select("id, full_name, location, business_name, profile_image_url, role")
          .in("id", buyerIds)
      : Promise.resolve({ data: [], error: null }),
    orderRows?.length
      ? supabase
          .from("messages")
          .select("id, order_id, message, created_at, sender_id, receiver_id")
          .ilike("message", "Issue reported:%")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productResult.error) throw productResult.error;
  if (buyerResult.error) throw buyerResult.error;
  if (issueResult.error) throw issueResult.error;

  const productsMap = new Map((productResult.data || []).map((row) => {
    if (row?.farmer_id) farmerIds.push(row.farmer_id);
    return [String(row.id), row];
  }));

  const uniqueFarmerIds = [...new Set(farmerIds.filter(Boolean))];
  const farmerResult = uniqueFarmerIds.length
    ? await supabase
        .from("users")
        .select("id, full_name, location, business_name, profile_image_url, role")
        .in("id", uniqueFarmerIds)
    : { data: [], error: null };

  if (farmerResult.error) throw farmerResult.error;

  const buyersMap = new Map((buyerResult.data || []).map((row) => [String(row.id), row]));
  const farmersMap = new Map((farmerResult.data || []).map((row) => [String(row.id), row]));

  const issueMap = new Map();
  (issueResult.data || []).forEach((row) => {
    if (!issueMap.has(String(row.order_id))) {
      issueMap.set(String(row.order_id), row);
    }
  });

  return (orderRows || []).map((orderRow) => {
    const product = productsMap.get(String(orderRow.product_id));
    const buyer = buyersMap.get(String(orderRow.buyer_id));
    const farmer = product ? farmersMap.get(String(product.farmer_id)) : null;
    const quantity = Number(orderRow.quantity || 0);
    const unitPrice = Number(product?.price || 0);
    const issue = issueMap.get(String(orderRow.id));

    return {
      id: orderRow.id,
      productName: product?.name || "Product",
      buyerName: buyer?.full_name || "Buyer",
      farmerName: farmer?.full_name || "Farmer",
      buyerLocation: buyer?.location || "",
      farmerLocation: farmer?.location || "",
      buyerBusinessName: buyer?.business_name || "",
      farmerBusinessName: farmer?.business_name || "",
      imageUrl: product?.image_url || "",
      status: normalizeText(orderRow.status).toLowerCase() || "pending",
      statusLabel: normalizeText(orderRow.status)
        ? normalizeText(orderRow.status).charAt(0).toUpperCase() + normalizeText(orderRow.status).slice(1)
        : "Pending",
      createdAt: orderRow.created_at,
      createdLabel: formatDateTime(orderRow.created_at),
      quantityLabel: `${quantity} kg`,
      totalLabel: `ETB ${(unitPrice * quantity).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      productCategory: product?.category || "Other",
      productLocation: product?.location || "",
      disputeMessage: issue?.message || "",
      disputeCreatedAt: issue?.created_at || null,
      hasDispute: !!issue,
      issueId: issue?.id || null,
      farmerId: product?.farmer_id || null,
      productId: product?.id || null,
      buyerId: orderRow.buyer_id,
    };
  });
};

export const fetchAdminReport = async () => {
  const profile = await fetchAdminProfile();
  const stats = await fetchAdminDashboardStats();

  const { data: statusRows, error } = await supabase
    .from("orders")
    .select("status", { count: "exact" });

  if (error) throw error;

  const statusTotals = (statusRows || []).reduce(
    (accumulator, row) => {
      const status = normalizeText(row.status).toLowerCase();
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    },
    { pending: 0, accepted: 0, rejected: 0 }
  );

  // Fetch reported issue messages (messages that start with "Issue reported:")
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, message, sender_id, receiver_id, created_at")
    .ilike("message", "Issue reported:%")
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const userIds = Array.from(
    new Set(
      [ ...(messages || []).map((m) => m.sender_id), ...(messages || []).map((m) => m.receiver_id) ]
        .filter(Boolean)
        .map(String)
    )
  );

  const usersMap = new Map();
  if (userIds.length) {
    const { data: usersData, error: usersError } = await supabase.from("users").select("id, full_name, email").in("id", userIds);
    if (usersError) throw usersError;
    (usersData || []).forEach((u) => usersMap.set(String(u.id), u.full_name || u.email || "User"));
  }

  const issues = (messages || []).map((m) => ({
    id: m.id,
    message: String(m.message || "").replace(/^Issue reported:\s*/i, "").trim(),
    senderId: m.sender_id,
    senderName: usersMap.get(String(m.sender_id)) || "Unknown",
    receiverId: m.receiver_id,
    receiverName: usersMap.get(String(m.receiver_id)) || "Unknown",
    createdAt: m.created_at,
  }));

  return {
    profile,
    stats,
    statusTotals,
    summaryRows: [
      { label: "Users", value: formatNumber(stats.activeUsers) },
      { label: "Products", value: formatNumber(stats.totalProducts) },
      { label: "Orders", value: formatNumber(stats.totalOrders) },
      { label: "Notifications", value: formatNumber(stats.notificationCount) },
    ],
    issues,
  };
};
