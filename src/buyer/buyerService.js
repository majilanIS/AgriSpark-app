import { supabase } from "../lib/supabaseClient";

const chunk = (items, size) => {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

const normalizeText = (value) => String(value ?? "").trim();

const buildChannelName = (prefix, key) => {
  const safeKey = normalizeText(key).replace(/[^a-zA-Z0-9_-]/g, "") || "anon";
  const nonce = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${safeKey}-${Date.now()}-${nonce}`;
};

const capitalize = (value) => {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "Pending";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatMoney = (value) => {
  return `ETB ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getProfileName = (row, fallback = "") => {
  return normalizeText(row?.full_name) || normalizeText(row?.name) || fallback || "";
};

const getCurrentAuthUser = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUser = authData?.user;

  if (authError || !authUser?.email) {
    throw new Error("Please sign in again to continue.");
  }

  return authUser;
};

export const fetchBuyerProfile = async () => {
  const authUser = await getCurrentAuthUser();
  const normalizedEmail = authUser.email.trim().toLowerCase();

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, location, profile_image_url")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.id) {
    return {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
      email: authUser.email,
      location: "",
      profile_image_url: "",
    };
  }

  return profile;
};

export const fetchFarmerProfile = async () => {
  const profile = await fetchBuyerProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "farmer") {
    throw new Error("Only farmer accounts can access this chat.");
  }
  return profile;
};

const fetchUsersByIds = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((value) => String(value || "").trim()).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const maps = new Map();
  for (const idGroup of chunk(uniqueIds, 20)) {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, location, profile_image_url")
      .in("id", idGroup);

    if (error) throw error;
    (data || []).forEach((row) => maps.set(String(row.id), row));
  }

  return maps;
};

const resolveImageUrl = (value) => {
  const text = normalizeText(value);
  if (!text) return "";
  if (text.startsWith("http")) return text;
  return text;
};

const shapeProduct = (row, farmer) => {
  const quantity = Number(row?.quantity || 0);
  const price = Number(row?.price || 0);
  const category = normalizeText(row?.category) || "Other";
  const description = normalizeText(row?.description);
  const title = normalizeText(row?.name) || "Product";

  const isOrganic = /organic/i.test(`${title} ${description} ${category}`);
  const isBulk = quantity >= 100 || /bulk/i.test(`${title} ${description}`);

  return {
    id: row.id,
    farmer_id: row.farmer_id,
    name: title,
    category,
    description,
    price,
    quantity,
    location: normalizeText(row?.location) || normalizeText(farmer?.location),
    image_url: resolveImageUrl(row?.image_url),
    created_at: row?.created_at,
    farmer_name: getProfileName(farmer, "Farmer"),
    farmer_location: normalizeText(farmer?.location),
    farmer_image_url: resolveImageUrl(farmer?.profile_image_url),
    price_label: formatMoney(price),
    stock_label: `${quantity} in stock`,
    created_label: formatDate(row?.created_at),
    is_organic: isOrganic,
    is_bulk: isBulk,
  };
};

export const fetchMarketplaceProducts = async ({ search = "", category = "All", limit = 12, offset = 0 } = {}) => {
  let query = supabase
    .from("products")
    .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const cleanedSearch = normalizeText(search);
  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  if (cleanedSearch) {
    const safeSearch = cleanedSearch.replace(/[%_]/g, " ");
    query = query.or(
      `name.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const farmerIds = (data || []).map((row) => row.farmer_id);
  const farmerMap = await fetchUsersByIds(farmerIds);

  return {
    products: (data || []).map((row) => shapeProduct(row, farmerMap.get(String(row.farmer_id)))),
    totalCount: typeof count === "number" ? count : (data || []).length,
  };
};

export const fetchProductById = async (productId) => {
  const cleanId = normalizeText(productId);
  if (!cleanId) return null;

  const { data, error } = await supabase
    .from("products")
    .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
    .eq("id", cleanId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const farmerMap = await fetchUsersByIds([data.farmer_id]);
  return shapeProduct(data, farmerMap.get(String(data.farmer_id)));
};

export const fetchFeaturedProducts = async () => {
  const { products } = await fetchMarketplaceProducts({ limit: 24, offset: 0 });
  const newest = products.slice(0, 3);
  const bulk = products.filter((item) => item.is_bulk).slice(0, 3);
  const organic = products.filter((item) => item.is_organic).slice(0, 3);

  return {
    newest,
    bulk,
    organic,
  };
};

export const fetchCartItems = async () => {
  const profile = await fetchBuyerProfile();

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, buyer_id, product_id, quantity, created_at")
    .eq("buyer_id", String(profile.id))
    .order("created_at", { ascending: false });

  if (error) throw error;

  const productIds = (data || []).map((row) => row.product_id);
  const productMap = new Map();

  if (productIds.length) {
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
      .in("id", productIds);

    if (productError) throw productError;

    const farmerMap = await fetchUsersByIds((productRows || []).map((row) => row.farmer_id));
    (productRows || []).forEach((row) => {
      productMap.set(String(row.id), shapeProduct(row, farmerMap.get(String(row.farmer_id))));
    });
  }

  return (data || []).map((row) => {
    const product = productMap.get(String(row.product_id));
    const quantity = Math.max(1, Number(row.quantity || 1));
    const price = Number(product?.price || 0);

    return {
      id: row.id,
      buyer_id: row.buyer_id,
      product_id: row.product_id,
      quantity,
      created_at: row.created_at,
      product,
      product_name: product?.name || "Product",
      farmer_name: product?.farmer_name || "Farmer",
      farmer_image_url: product?.farmer_image_url || "",
      location: product?.location || "",
      price,
      price_label: formatMoney(price),
      subtotal: price * quantity,
      subtotal_label: formatMoney(price * quantity),
    };
  });
};

export const upsertCartItem = async ({ productId, quantity = 1 }) => {
  const profile = await fetchBuyerProfile();
  const cleanProductId = normalizeText(productId);
  const safeQuantity = Math.max(1, Number(quantity || 1));

  const { data: existingRows, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("buyer_id", String(profile.id))
    .eq("product_id", cleanProductId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingRows?.id) {
    const nextQuantity = Number(existingRows.quantity || 1) + safeQuantity;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existingRows.id);

    if (error) throw error;
    return existingRows.id;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      buyer_id: String(profile.id),
      product_id: cleanProductId,
      quantity: safeQuantity,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id || null;
};

export const updateCartItemQuantity = async ({ cartItemId, quantity }) => {
  const safeQuantity = Math.max(1, Number(quantity || 1));
  const { error } = await supabase.from("cart_items").update({ quantity: safeQuantity }).eq("id", cartItemId);
  if (error) throw error;
};

export const removeCartItem = async ({ cartItemId }) => {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
};

export const clearBuyerCart = async () => {
  const profile = await fetchBuyerProfile();
  const { error } = await supabase.from("cart_items").delete().eq("buyer_id", String(profile.id));
  if (error) throw error;
};

export const placeOrdersFromCart = async () => {
  const profile = await fetchBuyerProfile();
  const cartItems = await fetchCartItems();

  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  const createdOrders = [];
  for (const item of cartItems) {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: String(profile.id),
        product_id: item.product_id,
        quantity: Number(item.quantity || 1),
        status: "pending",
      })
      .select("id, buyer_id, product_id, quantity, status, created_at")
      .single();

    if (error) throw error;

    createdOrders.push(data);
  }

  await clearBuyerCart();

  return createdOrders;
};

export const placeSingleOrder = async ({ productId, quantity }) => {
  const profile = await fetchBuyerProfile();
  const safeQuantity = Math.max(1, Number(quantity || 1));

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: String(profile.id),
      product_id: normalizeText(productId),
      quantity: safeQuantity,
      status: "pending",
    })
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .single();

  if (error) throw error;
  return data;
};

export const fetchBuyerOrders = async () => {
  const profile = await fetchBuyerProfile();

  const { data, error } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .eq("buyer_id", String(profile.id))
    .order("created_at", { ascending: false });

  if (error) throw error;

  const productIds = (data || []).map((row) => row.product_id);
  const productMap = new Map();

  if (productIds.length) {
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
      .in("id", productIds);

    if (productError) throw productError;

    const farmerMap = await fetchUsersByIds((productRows || []).map((row) => row.farmer_id));
    (productRows || []).forEach((row) => {
      productMap.set(String(row.id), shapeProduct(row, farmerMap.get(String(row.farmer_id))));
    });
  }

  return (data || []).map((row) => {
    const product = productMap.get(String(row.product_id));
    const quantity = Math.max(1, Number(row.quantity || 1));
    const price = Number(product?.price || 0);
    const total = price * quantity;

    return {
      id: row.id,
      product_id: row.product_id,
      buyer_id: row.buyer_id,
      quantity,
      status: capitalize(row.status),
      rawStatus: normalizeText(row.status).toLowerCase() || "pending",
      product_name: product?.name || "Product",
      farmer_name: product?.farmer_name || "Farmer",
      farmer_image_url: product?.farmer_image_url || "",
      location: product?.location || "",
      image_url: product?.image_url || "",
      price,
      total,
      total_label: formatMoney(total),
      price_label: formatMoney(price),
      created_at: row.created_at,
      created_label: formatDate(row.created_at),
      farmer_id: product?.farmer_id || null,
      product,
    };
  });
};

export const fetchBuyerConversations = async () => {
  const orders = await fetchBuyerOrders();
  const acceptedOrders = orders.filter((order) => order.rawStatus === "accepted");
  const orderIds = acceptedOrders.map((order) => order.id);

  const latestMessages = new Map();
  if (orderIds.length) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, order_id, sender_id, receiver_id, message, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    (data || []).forEach((row) => {
      if (!latestMessages.has(String(row.order_id))) {
        latestMessages.set(String(row.order_id), row);
      }
    });
  }

  return acceptedOrders.map((order) => {
    const latest = latestMessages.get(String(order.id));

    return {
      id: order.id,
      order_id: order.id,
      orderId: order.id,
      name: order.farmer_name,
      product: order.product_name,
      lastMessage: latest?.message || `Order ${order.status.toLowerCase()} - tap to chat.`,
      time: latest ? formatDate(latest.created_at) : order.created_label,
      unread: latest ? 1 : 0,
      image: order.farmer_image_url || order.image_url,
      online: true,
      status: order.status,
      rawStatus: order.rawStatus,
      productId: order.product_id,
      farmerId: order.farmer_id,
      latestMessageAt: latest?.created_at || order.created_at,
    };
  });
};

export const fetchFarmerConversations = async () => {
  const farmerProfile = await fetchFarmerProfile();

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
    .eq("farmer_id", String(farmerProfile.id));

  if (productError) throw productError;

  const productMap = new Map((productRows || []).map((row) => [String(row.id), row]));
  const productIds = [...productMap.keys()];
  if (!productIds.length) return [];

  const { data: orderRows, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

  const safeOrders = (orderRows || []).filter((order) => productMap.has(String(order.product_id)));
  const buyerMap = await fetchUsersByIds(safeOrders.map((order) => order.buyer_id));

  const latestMessages = new Map();
  const orderIds = safeOrders.map((order) => order.id);
  if (orderIds.length) {
    const { data: messages, error: messageError } = await supabase
      .from("messages")
      .select("id, order_id, sender_id, receiver_id, message, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (messageError) throw messageError;

    (messages || []).forEach((row) => {
      if (!latestMessages.has(String(row.order_id))) {
        latestMessages.set(String(row.order_id), row);
      }
    });
  }

  return safeOrders.map((order) => {
    const product = productMap.get(String(order.product_id));
    const buyer = buyerMap.get(String(order.buyer_id));
    const latest = latestMessages.get(String(order.id));
    const status = capitalize(order.status);
    const rawStatus = normalizeText(order.status).toLowerCase() || "pending";

    return {
      id: order.id,
      order_id: order.id,
      orderId: order.id,
      name: getProfileName(buyer, "Buyer"),
      product: normalizeText(product?.name) || "Product",
      status,
      rawStatus,
      canChat: rawStatus === "accepted",
      quantity: Number(order.quantity || 1),
      lastMessage: latest?.message || `Order ${status.toLowerCase()} - tap to open thread.`,
      time: latest ? formatDate(latest.created_at) : formatDate(order.created_at),
      image: resolveImageUrl(product?.image_url),
      buyerId: order.buyer_id,
      productId: order.product_id,
      latestMessageAt: latest?.created_at || order.created_at,
    };
  });
};

export const fetchChatThread = async (orderId, role = "buyer") => {
  const cleanOrderId = normalizeText(orderId);
  if (!cleanOrderId) {
    throw new Error("Missing order id.");
  }

  const profile = await fetchBuyerProfile();
  const isFarmerView = normalizeText(role).toLowerCase() === "farmer";

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .eq("id", cleanOrderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!orderRow) return null;

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id, name, category, description, price, quantity, location, image_url, created_at")
    .eq("id", orderRow.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const ownerId = isFarmerView ? productRow?.farmer_id : orderRow.buyer_id;
  if (String(ownerId || "") !== String(profile.id)) {
    throw new Error("You do not have access to this conversation.");
  }

  const buyerMap = await fetchUsersByIds([orderRow.buyer_id]);
  const buyerProfile = buyerMap.get(String(orderRow.buyer_id));

  const farmerMap = await fetchUsersByIds([productRow?.farmer_id]);
  const product = productRow ? shapeProduct(productRow, farmerMap.get(String(productRow.farmer_id))) : null;

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, order_id, sender_id, receiver_id, message, created_at")
    .eq("order_id", cleanOrderId)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  return {
    order: orderRow,
    product,
    role: isFarmerView ? "farmer" : "buyer",
    farmer: product?.farmer_name || "Farmer",
    farmerId: product?.farmer_id || null,
    buyer: getProfileName(buyerProfile, "Buyer"),
    buyerId: orderRow.buyer_id || null,
    participantName: isFarmerView ? getProfileName(buyerProfile, "Buyer") : product?.farmer_name || "Farmer",
    participantId: isFarmerView ? orderRow.buyer_id || null : product?.farmer_id || null,
    selfId: String(profile.id || ""),
    messages: messages || [],
    canChat: normalizeText(orderRow.status).toLowerCase() === "accepted",
  };
};

export const sendChatMessage = async ({ orderId, message, receiverId, role = "buyer" }) => {
  const profile = await fetchBuyerProfile();
  const isFarmerView = normalizeText(role).toLowerCase() === "farmer";
  const cleanOrderId = normalizeText(orderId);
  const text = normalizeText(message);
  if (!text) throw new Error("Message cannot be empty.");

  if (!cleanOrderId) {
    throw new Error("Missing order id for this message.");
  }

  let targetReceiverId = normalizeText(receiverId);

  if (!targetReceiverId) {
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, product_id")
      .eq("id", cleanOrderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!orderRow) throw new Error("Order not found for this conversation.");

    const { data: productRow, error: productError } = await supabase
      .from("products")
      .select("farmer_id")
      .eq("id", orderRow.product_id)
      .maybeSingle();

    if (productError) throw productError;

    const allowedOwnerId = isFarmerView ? productRow?.farmer_id : orderRow.buyer_id;
    if (String(allowedOwnerId || "") !== String(profile.id)) {
      throw new Error("You do not have access to this conversation.");
    }

    targetReceiverId = isFarmerView ? normalizeText(orderRow?.buyer_id) : normalizeText(productRow?.farmer_id);
  }

  if (!targetReceiverId) {
    throw new Error("Could not determine the receiver for this chat.");
  }

  const { error } = await supabase.from("messages").insert({
    order_id: cleanOrderId,
    sender_id: String(profile.id),
    receiver_id: targetReceiverId,
    message: text,
  });

  if (error) throw error;
};

export const subscribeToBuyerOrders = (buyerId, callback) => {
  const channel = supabase
    .channel(buildChannelName("buyer-orders", buyerId))
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${buyerId}` }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToBuyerMessages = (orderId, callback) => {
  const channel = supabase
    .channel(buildChannelName("buyer-messages", orderId))
    .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToProducts = (callback) => {
  const channel = supabase
    .channel(buildChannelName("buyer-products", "global"))
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const confirmDelivery = async ({ orderId }) => {
  const cleanOrderId = normalizeText(orderId);
  if (!cleanOrderId) throw new Error("Missing order id.");

  const profile = await fetchBuyerProfile();

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, product_id, buyer_id")
    .eq("id", cleanOrderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!orderRow) throw new Error("Order not found.");

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id")
    .eq("id", orderRow.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const farmerId = productRow?.farmer_id;

  if (!farmerId) {
    throw new Error("Could not find farmer for this order.");
  }

  const { error } = await supabase.from("messages").insert({
    order_id: cleanOrderId,
    sender_id: String(profile.id),
    receiver_id: String(farmerId),
    message: "Buyer confirmed delivery",
  });

  if (error) throw error;
};

export const reportOrderIssue = async ({ orderId, issue = "Buyer reported an issue with this order." }) => {
  const cleanOrderId = normalizeText(orderId);
  const cleanIssue = normalizeText(issue);

  if (!cleanOrderId) throw new Error("Missing order id.");
  if (!cleanIssue) throw new Error("Issue details cannot be empty.");

  const profile = await fetchBuyerProfile();

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, product_id")
    .eq("id", cleanOrderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!orderRow) throw new Error("Order not found.");

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id")
    .eq("id", orderRow.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const farmerId = productRow?.farmer_id;

  if (!farmerId) {
    throw new Error("Could not find farmer for this order.");
  }

  const { error } = await supabase.from("messages").insert({
    order_id: cleanOrderId,
    sender_id: String(profile.id),
    receiver_id: String(farmerId),
    message: `Issue reported: ${cleanIssue}`,
  });

  if (error) throw error;
};

export { formatDate, formatMoney, getProfileName, normalizeText };
