import { supabase } from "./supabaseClient";

const normalizeText = (value) => String(value || "").trim();

const toDisplayOrderId = (id) => {
  const value = normalizeText(id).replace(/[^a-zA-Z0-9]/g, "");
  if (!value) return "ORD-000000";
  return `ORD-${value.slice(0, 8).toUpperCase()}`;
};

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

const formatStatus = (status) => {
  const value = normalizeText(status).toLowerCase();
  if (value === "accepted") return "Accepted";
  if (value === "rejected") return "Rejected";
  return "Pending";
};

const getAuthUser = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUser = authData?.user;

  if (authError || !authUser) {
    throw new Error("Please sign in again to continue.");
  }

  return authUser;
};

const getProfileByEmail = async (email) => {
  const normalizedEmail = normalizeText(email).toLowerCase();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role, location, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw error;

  return data || null;
};

const getUserDisplayName = (row, fallback = "") => {
  return row?.full_name || row?.name || fallback || "";
};

const findProductForCartItem = async (item) => {
  let query = supabase
    .from("products")
    .select("id, farmer_id, name, category, price, quantity, location, image_url")
    .order("created_at", { ascending: false })
    .limit(1);

  if (item?.productId) {
    query = query.eq("id", item.productId);
  } else if (item?.name) {
    query = query.eq("name", normalizeText(item.name));
  }

  if (item?.origin) {
    query = query.eq("location", normalizeText(item.origin));
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data[0] || null : data || null;
};

export const placeBuyerOrdersFromCart = async (cartItems = []) => {
  const authUser = await getAuthUser();
  const buyerProfile = (await getProfileByEmail(authUser.email)) || { id: authUser.id };
  const createdOrders = [];

  for (const item of cartItems) {
    const product = await findProductForCartItem(item);

    if (!product?.id) {
      throw new Error(`Could not find a product record for ${item?.name || "one of the cart items"}.`);
    }

    const quantity = Math.max(1, Number(item?.quantity || 1));

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: buyerProfile.id || authUser.id,
        product_id: product.id,
        quantity,
        status: "pending",
      })
      .select("id, buyer_id, product_id, quantity, status, created_at")
      .single();

    if (orderError) throw orderError;

    const { data: farmerProfile, error: farmerError } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("id", product.farmer_id)
      .maybeSingle();

    if (farmerError) throw farmerError;

    createdOrders.push({
      ...orderRow,
      displayId: toDisplayOrderId(orderRow.id),
      statusLabel: formatStatus(orderRow.status),
      createdAtLabel: formatDateTime(orderRow.created_at),
      productName: product.name,
      productCategory: product.category || "",
      productLocation: product.location || item?.origin || "",
      farmerId: product.farmer_id,
      farmerName: getUserDisplayName(farmerProfile, item?.farmer || "Farmer"),
      unitPrice: Number(product.price || 0),
      lineTotal: Number(product.price || 0) * quantity,
    });
  }

  return {
    buyerId: buyerProfile.id || authUser.id,
    buyerName: getUserDisplayName(buyerProfile, authUser.email),
    orders: createdOrders,
  };
};

export const fetchBuyerOrders = async () => {
  const authUser = await getAuthUser();
  const buyerProfile = (await getProfileByEmail(authUser.email)) || { id: authUser.id };

  const { data: orderRows, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .eq("buyer_id", buyerProfile.id || authUser.id)
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

  const productIds = [...new Set((orderRows || []).map((row) => row.product_id).filter(Boolean))];
  const farmerIds = [];

  let productsMap = new Map();
  if (productIds.length) {
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, farmer_id, name, category, price, quantity, location, image_url")
      .in("id", productIds);

    if (productError) throw productError;
    productsMap = new Map((productRows || []).map((row) => [String(row.id), row]));
    productRows?.forEach((row) => {
      if (row?.farmer_id) farmerIds.push(row.farmer_id);
    });
  }

  const uniqueFarmerIds = [...new Set(farmerIds.filter(Boolean))];
  let farmersMap = new Map();
  if (uniqueFarmerIds.length) {
    const { data: farmerRows, error: farmerError } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", uniqueFarmerIds);

    if (farmerError) throw farmerError;
    farmersMap = new Map((farmerRows || []).map((row) => [String(row.id), row]));
  }

  return (orderRows || []).map((orderRow) => {
    const product = productsMap.get(String(orderRow.product_id));
    const farmer = product ? farmersMap.get(String(product.farmer_id)) : null;
    const quantity = Number(orderRow.quantity || 0);
    const unitPrice = Number(product?.price || 0);

    return {
      id: orderRow.id,
      displayId: toDisplayOrderId(orderRow.id),
      status: formatStatus(orderRow.status),
      rawStatus: normalizeText(orderRow.status).toLowerCase() || "pending",
      date: formatDateTime(orderRow.created_at),
      product: product?.name || "Product",
      farmer: getUserDisplayName(farmer, "Farmer"),
      quantity: `${quantity} kg`,
      unitPrice: `ETB ${unitPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      total: `ETB ${(unitPrice * quantity).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      action: orderRow.status === "accepted" ? "Track order" : orderRow.status === "rejected" ? "Reorder" : "Cancel",
      accent: product?.category === "Grains" ? "#F8EDDA" : product?.category === "Fruits" ? "#DDE7F8" : "#DCEED7",
      icon: product?.category === "Grains" ? "layers-outline" : product?.category === "Fruits" ? "nutrition-outline" : "cube-outline",
      farmerId: product?.farmer_id || null,
      productId: product?.id || null,
      orderId: orderRow.id,
      createdAt: orderRow.created_at,
      createdAtLabel: formatDateTime(orderRow.created_at),
    };
  });
};

export const fetchFarmerOrders = async () => {
  const authUser = await getAuthUser();
  const farmerProfile = (await getProfileByEmail(authUser.email)) || { id: authUser.id };

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, farmer_id, name, category, price, quantity, location, image_url")
    .eq("farmer_id", farmerProfile.id || authUser.id);

  if (productError) throw productError;

  const productMap = new Map((productRows || []).map((row) => [String(row.id), row]));
  const productIds = [...productMap.keys()];

  if (!productIds.length) {
    return [];
  }

  const { data: orderRows, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, product_id, quantity, status, created_at")
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

  const buyerIds = [...new Set((orderRows || []).map((row) => row.buyer_id).filter(Boolean))];
  let buyersMap = new Map();

  if (buyerIds.length) {
    const { data: buyerRows, error: buyerError } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", buyerIds);

    if (buyerError) throw buyerError;
    buyersMap = new Map((buyerRows || []).map((row) => [String(row.id), row]));
  }

  const scopedOrders = (orderRows || []).filter((orderRow) => {
    const product = productMap.get(String(orderRow.product_id));
    return !!product && String(product.farmer_id) === String(farmerProfile.id || authUser.id);
  });

  return scopedOrders.map((orderRow) => {
    const product = productMap.get(String(orderRow.product_id));
    const buyer = buyersMap.get(String(orderRow.buyer_id));
    const quantity = Number(orderRow.quantity || 0);
    const unitPrice = Number(product?.price || 0);

    return {
      id: orderRow.id,
      displayId: toDisplayOrderId(orderRow.id),
      status: formatStatus(orderRow.status),
      rawStatus: normalizeText(orderRow.status).toLowerCase() || "pending",
      date: formatDateTime(orderRow.created_at),
      product: product?.name || "Product",
      imageUrl: product?.image_url || "",
      buyer: getUserDisplayName(buyer, "Buyer"),
      quantity: `${quantity} kg`,
      total: `ETB ${(unitPrice * quantity).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      amountValue: unitPrice * quantity,
      farmerId: product?.farmer_id || null,
      productId: product?.id || null,
      orderId: orderRow.id,
      createdAt: orderRow.created_at,
      createdAtLabel: formatDateTime(orderRow.created_at),
      accent: product?.category === "Grains" ? "#F8EDDA" : product?.category === "Fruits" ? "#DDE7F8" : "#DCEED7",
      icon: product?.category === "Grains" ? "layers-outline" : product?.category === "Fruits" ? "nutrition-outline" : "cube-outline",
    };
  });
};

export const summarizePendingOrders = (orders = []) => {
  return orders.filter((order) => order.rawStatus === "pending").length;
};

export const updateFarmerOrderStatus = async ({ orderId, status }) => {
  const cleanOrderId = normalizeText(orderId);
  const cleanStatus = normalizeText(status).toLowerCase();

  if (!cleanOrderId) {
    throw new Error("Missing order id.");
  }

  if (!["accepted", "rejected"].includes(cleanStatus)) {
    throw new Error("Invalid order status update.");
  }

  const authUser = await getAuthUser();
  const farmerProfile = (await getProfileByEmail(authUser.email)) || { id: authUser.id };

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, product_id, status")
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
  if (!productRow) throw new Error("Product not found for this order.");
  if (String(productRow.farmer_id) !== String(farmerProfile.id || authUser.id)) {
    throw new Error("You do not have permission to update this order.");
  }

  const { error: updateError } = await supabase.from("orders").update({ status: cleanStatus }).eq("id", cleanOrderId);

  if (updateError) throw updateError;
};
