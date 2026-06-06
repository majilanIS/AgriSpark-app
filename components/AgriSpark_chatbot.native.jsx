// AgriSpark_chatbot.native.jsx
// React Native compatible — requires:
//   expo install expo-linear-gradient
//   npx expo install @react-native-async-storage/async-storage  (if you want persistence)
// No web-only APIs: no CSS keyframes, no style tags, no textarea, no onMouseEnter/Leave

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  StatusBar, SafeAreaView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ─── API KEYS ─────────────────────────────────────────────────────
// Store these in your .env / app.config.js and read via expo-constants
import Constants from "expo-constants";

// ─── DATA IMPORTS ────────────────────────────────────────────────
import {
  GREETING_FLOWS, ROLE_LABELS, ROLE_FOLLOWUP, ROLE_QUICK,
  DASHBOARD_GREETINGS,
  PRICES, CAT_EMOJI, CAT_COLOR, CATS, trendColor,
  LANGS, UI, QUICK_LABEL,
  GROQ_MODEL, GEMINI_MODEL, buildSystemPrompt,
} from "./agriSparkData";
const EXTRA = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ??
  EXTRA.EXPO_PUBLIC_GROQ_API_KEY ??
  EXTRA.GROQ_API_KEY ??
  Constants.manifest2?.extra?.GROQ_API_KEY ??
  Constants.manifest2?.extra?.EXPO_PUBLIC_GROQ_API_KEY ??
  "";
const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
  EXTRA.EXPO_PUBLIC_GEMINI_API_KEY ??
  EXTRA.GEMINI_API_KEY ??
  Constants.manifest2?.extra?.GEMINI_API_KEY ??
  Constants.manifest2?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ??
  "";

const hasConfiguredApiKey = (value) => typeof value === "string" && value.trim().length > 0 && !value.includes("YOUR_");

// ─── COLOURS (no CSS vars in RN) ────────────────────────────────
const C = {
  green900: "#0F4D2A",
  green800: "#146A39",
  green600: "#1E7A35",
  green700: "#175E31",
  green400: "#41C97A",
  green100: "#DDF8E7",
  green50:  "#F4FBF7",
  surface:  "#F6FBF4",
  white:    "#FFFFFF",
  border:   "#DDE9D8",
  muted:    "#708579",
  text:     "#15351F",
  danger:   "#EF4444",
  warn:     "#92400E",
  warnBg:   "#FFFBEB",
  warnBorder:"#FDE68A",
};

function ChatMark({ kind = "assistant", size = 32 }) {
  const isUser = kind === "user";
  return (
    <LinearGradient
      colors={isUser ? ["#E9F9EF", "#D8F1E2"] : ["#0F4D2A", "#1E7A35"]}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.42,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: isUser ? "#C9E8D4" : "rgba(255,255,255,0.14)",
        shadowColor: "#1B4D2B",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: size * 0.2,
          backgroundColor: isUser ? "#FFFFFF" : "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: isUser ? "#DDEEE1" : "rgba(255,255,255,0.18)",
          shadowColor: isUser ? "#1B4D2B" : "#000000",
          shadowOpacity: isUser ? 0.04 : 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <Ionicons
          name={isUser ? "person" : "leaf"}
          size={size * 0.3}
          color={isUser ? C.green600 : "#FFFFFF"}
        />
      </View>
    </LinearGradient>
  );
}

// ─── API CALLS ───────────────────────────────────────────────────
const LANG_MAP = {
  en:  "English",
  am:  "Amharic (አማርኛ) using Ethiopic script",
  oro: "Afaan Oromo using Latin script",
  tig: "Tigrinya (ትግርኛ) using Ethiopic script",
};

async function callGroq(msgs, lang, role, systemContext) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL, max_tokens: 900,
      messages: [
        { role: "system", content: buildSystemPrompt(`Always respond in ${LANG_MAP[lang] ?? "English"}.`, role) },
        ...(systemContext ? [{ role: "system", content: systemContext }] : []),
        ...msgs,
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const d = await res.json();
  const text = d.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq empty");
  return { text, source: "Groq" };
}

async function callGemini(msgs, lang, role, systemContext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          { text: buildSystemPrompt(`Always respond in ${LANG_MAP[lang] ?? "English"}.`, role) },
          ...(systemContext ? [{ text: systemContext }] : []),
        ],
      },
      contents: msgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 900 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const d = await res.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty");
  return { text, source: "Gemini" };
}

async function callAI(msgs, lang, role, systemContext) {
  const groqMissing = !hasConfiguredApiKey(GROQ_API_KEY);
  const geminiMissing = !hasConfiguredApiKey(GEMINI_API_KEY);
  if (groqMissing && geminiMissing) {
    throw new Error("AI is not configured for this build yet. Add a Groq or Gemini key to the Expo environment.");
  }
  try {
    return await callGroq(msgs, lang, role, systemContext);
  } catch (e) {
    console.warn("Groq failed →", e.message);
    return await callGemini(msgs, lang, role, systemContext);
  }
}

// ─── TYPING DOTS ─────────────────────────────────────────────────
function TypingDots() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 3 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.green600, transform: [{ translateY: a }] }}
        />
      ))}
    </View>
  );
}

// ─── RENDER BOLD TEXT ─────────────────────────────────────────────
// Handles **bold** markdown syntax
function BoldText({ text, style }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} style={{ fontWeight: "700" }}>{p.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ role, content, timestamp }) {
  const isUser = role === "user";
  return (
    <View style={{ flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
      <ChatMark kind={isUser ? "user" : "assistant"} size={30} />

      {/* Bubble + timestamp */}
      <View style={{ maxWidth: "80%", alignItems: isUser ? "flex-end" : "flex-start", gap: 3 }}>
        {isUser ? (
          <LinearGradient
            colors={["#F3FCF6", "#DAF2E3", "#C9EAD6"]}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              borderTopRightRadius: 7,
              borderWidth: 1,
              borderColor: "#C7E8D1",
              shadowColor: "#1B4D2B",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 5 },
              elevation: 2,
              overflow: "hidden",
            }}
          >
            <View style={{ position: "absolute", right: -4, top: 12, width: 14, height: 14, borderRadius: 4, backgroundColor: "#C9EAD6", transform: [{ rotate: "45deg" }] }} />
            <View style={{ position: "absolute", left: 0, top: 0, right: 0, height: 2, backgroundColor: "rgba(255,255,255,0.65)" }} />
            <BoldText text={content} style={{ fontSize: 13.1, lineHeight: 20, color: C.text }} />
          </LinearGradient>
        ) : (
          <View style={{
            backgroundColor: C.white,
            borderWidth: 1,
            borderColor: "#DDE9D8",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 20,
            borderTopLeftRadius: 7,
            shadowColor: "#1B4D2B",
            shadowOpacity: 0.09,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
            overflow: "hidden",
          }}>
            <View style={{ position: "absolute", left: -4, top: 12, width: 14, height: 14, borderRadius: 4, backgroundColor: C.white, borderWidth: 1, borderColor: "#DDE9D8", transform: [{ rotate: "45deg" }] }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 8, backgroundColor: C.green100, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CDEBD8" }}>
                <Ionicons name="sparkles" size={11} color={C.green700} />
              </View>
              <Text style={{ color: C.green700, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }}>AgriSpark AI</Text>
            </View>
            <BoldText text={content} style={{ fontSize: 13.1, lineHeight: 20, color: C.text }} />
          </View>
        )}
        {timestamp && (
          <Text style={{ fontSize: 10, color: "#95A197", paddingHorizontal: 4 }}>{timestamp}</Text>
        )}
      </View>
    </View>
  );
}

// ─── ROLE PICKER ─────────────────────────────────────────────────
function RolePicker({ lang, onPick }) {
  const labels = ROLE_LABELS[lang] ?? ROLE_LABELS.en;
  const options = [
    { key: "buyer",  label: labels.buyer,  bg: C.green50,     border: "#BBF7D0" },
    { key: "farmer", label: labels.farmer, bg: "#FFF9E8",     border: "#F7D774" },
    { key: "both",   label: labels.both,   bg: "#F2FAFF",     border: "#C7E7FF" },
  ];
  return (
    <View style={{ paddingLeft: 40, gap: 8 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onPick(o.key)}
          activeOpacity={0.75}
          style={{
            backgroundColor: o.bg, borderWidth: 1.5, borderColor: o.border,
            borderRadius: 14, borderTopLeftRadius: 4,
            paddingHorizontal: 16, paddingVertical: 11,
            flexDirection: "row", alignItems: "center", gap: 10,
          }}
        >
          <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.text }}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── SUGGESTION CHIPS ─────────────────────────────────────────────
function SuggestionChips({ chips, onSelect }) {
  return (
    <View style={{ paddingLeft: 40, gap: 6 }}>
      {chips.map((q, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onSelect(q.label)}
          activeOpacity={0.75}
          style={{
            backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
            borderRadius: 14, borderTopLeftRadius: 4,
            paddingHorizontal: 14, paddingVertical: 9,
            flexDirection: "row", alignItems: "center", gap: 9,
          }}
        >
          <Text style={{ fontSize: 16 }}>{q.icon}</Text>
          <Text style={{ fontSize: 13, color: C.text, flexShrink: 1 }}>{q.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function AgriSparkAIChatbot({ autoGreeting = true, dashboardRole = null, dashboardPage = null, bottomInset = 0 }) {
  const [lang,            setLang]            = useState("en");
  const [tab,             setTab]             = useState("chat");
  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [apiSource,       setApiSource]       = useState(null);
  const [apiError,        setApiError]        = useState(null);
  const [catFilter,       setCatFilter]       = useState("All");
  const [greetingDone,    setGreetingDone]    = useState(false);
  const [typingStep,      setTypingStep]      = useState(null);
  const [userRole,        setUserRole]        = useState(null);
  const [showRolePicker,  setShowRolePicker]  = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [systemContext,   setSystemContext]   = useState(null);

  const flatRef        = useRef(null);
  const greetingFired  = useRef(false);
  const mountedRef     = useRef(false);
  const t              = UI[lang] ?? UI.en;
  const roleLocked     = dashboardRole === "buyer" || dashboardRole === "farmer" || dashboardRole === "admin";
  const pageLabel      = typeof dashboardPage === "string" && dashboardPage.trim() ? dashboardPage.trim() : null;

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addMsg = useCallback((role, content, extra = {}) => {
    const id = `${role[0]}-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id, role, content, ts: nowTime(), ...extra }]);
    return id;
  }, []);

  // ── Greeting sequence ────────────────────────────────────────────
  const runGreeting = useCallback(() => {
    if (greetingFired.current) return;
    greetingFired.current = true;

    if (roleLocked) {
      const langGreetings = DASHBOARD_GREETINGS[lang] ?? DASHBOARD_GREETINGS.en;
      const greetText = langGreetings[dashboardRole] ?? langGreetings.buyer;
      setTypingStep(0);
      setTimeout(() => {
        setTypingStep(null);
        addMsg("assistant", pageLabel ? `${greetText} You are on the ${pageLabel}.` : greetText);
        setUserRole(dashboardRole);
        setGreetingDone(true);
        setShowRolePicker(false);
        setTimeout(() => setShowSuggestions(true), 350);
      }, 700);
      return;
    }

    const steps = GREETING_FLOWS[lang] ?? GREETING_FLOWS.en;
    let elapsed = 400;
    steps.forEach((step, idx) => {
      const typingStart = elapsed;
      elapsed += step.typing;
      const msgStart = elapsed;
      elapsed += step.delay;
      setTimeout(() => setTypingStep(idx), typingStart);
      setTimeout(() => {
        setTypingStep(null);
        addMsg("assistant", step.text);
        if (step.showRoles) {
          setTimeout(() => setShowRolePicker(true), 300);
        }
        if (idx === steps.length - 1 && !step.showRoles) {
          setTimeout(() => { setGreetingDone(true); setShowSuggestions(true); }, 400);
        }
      }, msgStart);
    });
  }, [lang, addMsg, roleLocked, dashboardRole, pageLabel]);

  useEffect(() => {
    if (autoGreeting) runGreeting();
  }, [autoGreeting]);

  useEffect(() => {
    // Language changed — reset everything
    setMessages([]);
    setInput("");
    setApiError(null);
    setGreetingDone(false);
    setShowRolePicker(false);
    setShowSuggestions(false);
    setUserRole(null);
    setTypingStep(null);

    // Avoid resetting the greeting flag on initial mount (which would
    // cause runGreeting to be scheduled a second time). Only reset and
    // re-run greeting when language actually changes after mount.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    greetingFired.current = false;
    if (autoGreeting) setTimeout(runGreeting, 200);
  }, [lang]);

  // Scroll to bottom whenever content changes
  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: true }), 80);
  }, [messages, loading, typingStep, showRolePicker, showSuggestions]);

  const handleRolePick = useCallback((role) => {
    setUserRole(role);
    setShowRolePicker(false);
    const followup = (ROLE_FOLLOWUP[lang] ?? ROLE_FOLLOWUP.en)[role];
    const roleLabels = ROLE_LABELS[lang] ?? ROLE_LABELS.en;
    addMsg("user", roleLabels[role]);
    setTypingStep("role");
    setTimeout(() => {
      setTypingStep(null);
      addMsg("assistant", followup);
      setGreetingDone(true);
      setTimeout(() => setShowSuggestions(true), 300);
    }, 900);
  }, [lang, addMsg]);

  const send = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading || showRolePicker) return;
    setShowSuggestions(false);
    addMsg("user", trimmed);
    setInput("");
    setLoading(true);
    setApiError(null);
    try {
      const history = [...messages, { role: "user", content: trimmed }].map((m) => ({
        role: m.role, content: m.content,
      }));
      const { text: reply, source } = await callAI(history, lang, userRole, systemContext);
      addMsg("assistant", reply);
      setApiSource(source);
      setTimeout(() => setShowSuggestions(true), 600);
    } catch (err) {
      addMsg("assistant", "⚠️ I couldn't reach the server. Please check your API keys and try again.");
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, lang, userRole, systemContext, showRolePicker, addMsg]);

  const roleQuick = ROLE_QUICK[lang] ?? ROLE_QUICK.en;
  const currentSuggestions = roleQuick[userRole ?? "both"] ?? roleQuick.both ?? [];
  const filtered = PRICES.filter((p) => catFilter === "All" || p.cat === catFilter);

  // ── Chat content list items ────────────────────────────────────
  const chatItems = [
    ...messages.map((m) => ({ type: "msg", data: m })),
    ...(typingStep !== null || loading ? [{ type: "typing" }] : []),
    ...(showRolePicker && !loading ? [{ type: "roles" }] : []),
    ...(showSuggestions && greetingDone && !loading && !showRolePicker ? [{ type: "suggestions" }] : []),
    ...(apiError ? [{ type: "error" }] : []),
  ];

  const renderChatItem = ({ item }) => {
    if (item.type === "msg") {
      return (
        <MessageBubble
          role={item.data.role}
          content={item.data.content}
          timestamp={item.data.ts}
        />
      );
    }
    if (item.type === "typing") {
      return (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <ChatMark kind="assistant" size={30} />
          <View style={{ backgroundColor: C.white, borderWidth: 1, borderColor: "#DDE9D8", borderRadius: 20, borderTopLeftRadius: 7, paddingHorizontal: 16, paddingVertical: 10, shadowColor: "#1B4D2B", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2, overflow: "hidden" }}>
            <View style={{ position: "absolute", left: -4, top: 12, width: 14, height: 14, borderRadius: 4, backgroundColor: C.white, borderWidth: 1, borderColor: "#DDE9D8", transform: [{ rotate: "45deg" }] }} />
            <TypingDots />
          </View>
        </View>
      );
    }
    if (item.type === "roles") return <RolePicker lang={lang} onPick={handleRolePick} />;
    if (item.type === "suggestions") {
      return (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, color: C.muted, marginLeft: 40, marginBottom: 2, fontWeight: "600" }}>
            {QUICK_LABEL[lang] ?? QUICK_LABEL.en}
          </Text>
          <SuggestionChips chips={currentSuggestions} onSelect={(txt) => send(txt)} />
        </View>
      );
    }
    if (item.type === "error") {
      return (
        <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 11, color: "#991B1B" }}>
            <Text style={{ fontWeight: "700" }}>Debug: </Text>{apiError}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={["#F8FCF7", "#EAF7EE"]} style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {/* Title row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <ChatMark kind="assistant" size={38} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>AgriSpark AI</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.green400 }} />
              <Text style={{ color: C.green600, fontSize: 10 }}>{t.tagline}</Text>
            </View>
          </View>
          {apiSource && (
            <View style={{ backgroundColor: "#E8F8EE", borderRadius: 20, borderWidth: 1, borderColor: "#CDEBD8", paddingHorizontal: 9, paddingVertical: 3 }}>
              <Text style={{ color: C.green400, fontSize: 9, fontWeight: "800" }}>via {apiSource}</Text>
            </View>
          )}
          {userRole && (
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.green800, fontSize: 10, fontWeight: "700" }}>
                {userRole === "buyer" ? "🛒 Buyer" : userRole === "farmer" ? "🌾 Farmer" : userRole === "admin" ? "🛡️ Admin" : "👁️ Browsing"}
              </Text>
            </View>
          )}
        </View>

        {/* Language switcher */}
        <View style={{ flexDirection: "row", gap: 5, marginBottom: 10 }}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.code}
              onPress={() => setLang(l.code)}
              style={{
                  flex: 1, paddingVertical: 6, borderRadius: 9, alignItems: "center",
                  backgroundColor: lang === l.code ? C.green400 : C.white,
                  borderWidth: 1,
                  borderColor: lang === l.code ? C.green400 : C.border,
              }}
            >
                <Text style={{ fontSize: 11, fontWeight: "800", color: lang === l.code ? C.green900 : C.green600 }}>
                {l.flag} {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border }}>
          {[{ id: "chat", label: t.chatTab }, { id: "prices", label: t.pricesTab }].map((tb) => (
            <TouchableOpacity
              key={tb.id}
              onPress={() => setTab(tb.id)}
              style={{
                flex: 1, paddingVertical: 10, alignItems: "center",
                borderBottomWidth: 2.5,
                  borderBottomColor: tab === tb.id ? C.green600 : "transparent",
              }}
            >
                <Text style={{ fontSize: 13, fontWeight: "700", color: tab === tb.id ? C.green800 : C.muted }}>
                {tb.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ══ CHAT TAB ══ */}
      {tab === "chat" && (
        <KeyboardAvoidingView
          style={{ flex: 1, paddingBottom: bottomInset }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={chatItems}
            keyExtractor={(item, i) => item.data?.id ?? `${item.type}-${i}`}
            renderItem={renderChatItem}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 10 + bottomInset, backgroundColor: C.surface }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input bar */}
          <View style={{ paddingHorizontal: 14, paddingBottom: Platform.OS === "ios" ? 24 : 14, paddingTop: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border }}>
            <View style={{
              flexDirection: "row", alignItems: "flex-end", gap: 8,
              backgroundColor: C.white, borderRadius: 24,
              paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
              borderWidth: 1.5, borderColor: input ? C.green400 : C.border,
              shadowColor: "#1B4D2B",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 1,
            }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={
                  showRolePicker
                    ? (lang === "en" ? "Choose your role above first…" : lang === "am" ? "ቀደም ሚናዎን ይምረጡ…" : "Gahee kee filadhu…")
                    : t.placeholder
                }
                placeholderTextColor={C.muted}
                multiline
                editable={!loading && typingStep === null}
                keyboardType="default"
                returnKeyType="send"
                autoCorrect
                autoCapitalize="sentences"
                textAlignVertical="top"
                style={{ flex: 1, fontSize: 14, color: C.text, lineHeight: 22, maxHeight: 100, paddingTop: 3, opacity: loading || typingStep !== null ? 0.5 : 1, minHeight: 40 }}
                onSubmitEditing={() => send()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={() => send()}
                disabled={!input.trim() || loading || typingStep !== null}
                style={{
                  width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
                  backgroundColor: input.trim() && !loading ? undefined : C.green100,
                  overflow: "hidden",
                }}
              >
                {input.trim() && !loading ? (
                  <LinearGradient colors={["#41C97A", C.green800]} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                    {loading ? <ActivityIndicator color={C.white} size="small" /> : <Text style={{ color: C.white, fontSize: 20, fontWeight: "900" }}>↑</Text>}
                  </LinearGradient>
                ) : (
                  <Text style={{ color: C.green600, fontSize: 20, fontWeight: "900" }}>↑</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: C.muted, textAlign: "center", marginTop: 6 }}>{t.footer}</Text>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ══ PRICES TAB ══ */}
      {tab === "prices" && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Market stats */}
          <LinearGradient colors={["#F6FBF4", "#EAF7EE"]} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.green600, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              {t.marketTitle}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "USD / ETB", value: "~125 ETB" },
                { label: "Inflation 2025", value: "~25%" },
                { label: "Teff/100kg", value: "10,500–11,750" },
                { label: "Korarima/kg", value: "600–1,000 ETB" },
              ].map((s) => (
                <View key={s.label} style={{ width: "47%", backgroundColor: C.white, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ color: C.green600, fontSize: 9, marginBottom: 3, fontWeight: "600" }}>{s.label}</Text>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{s.value}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
            {CATS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCatFilter(c)}
                style={{
                  paddingHorizontal: 13, paddingVertical: 5, borderRadius: 99, marginRight: 6,
                  borderWidth: 1.5, borderColor: catFilter === c ? C.green600 : C.border,
                  backgroundColor: catFilter === c ? C.green600 : C.white,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: catFilter === c ? "700" : "500", color: catFilter === c ? C.white : C.text }}>
                  {c === "All" ? t.filterAll : `${CAT_EMOJI[c]} ${c}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Price cards */}
          <View style={{ padding: 12, gap: 8 }}>
            {filtered.map((item) => {
              const clr = CAT_COLOR[item.cat];
              return (
                <View key={item.key} style={{ backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#1B4D2B", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: clr.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: clr.accent + "22" }}>
                    <Text style={{ fontSize: 22 }}>{CAT_EMOJI[item.cat]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.text }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{item.am} · {t.perUnit} {item.unit}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "800", color: C.green600 }}>
                      {item.low.toLocaleString()}–{item.high.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: trendColor(item.trend), marginTop: 2 }}>
                      ETB {item.trend}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Disclaimer */}
          <View style={{ marginHorizontal: 12, marginBottom: 10, padding: 14, backgroundColor: C.warnBg, borderRadius: 14, borderWidth: 1, borderColor: C.warnBorder }}>
            <Text style={{ fontSize: 11, color: C.warn, lineHeight: 18 }}>{t.disclaimer}</Text>
          </View>

          {/* Ask AI button */}
          <TouchableOpacity
            onPress={() => {
              setTab("chat");
              setTimeout(() => send(currentSuggestions[2]?.label ?? "What are teff prices today?"), 100);
            }}
            activeOpacity={0.85}
            style={{ marginHorizontal: 12, marginBottom: 28, borderRadius: 20, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#0F4D2A", "#1E7A35", "#41C97A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
                shadowColor: "#1B4D2B",
                shadowOpacity: 0.15,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                  <MaterialCommunityIcons name="robot" size={18} color={C.white} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.white, fontSize: 14, fontWeight: "900", letterSpacing: 0.2 }}>Ask AI</Text>
                  <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 10.5, marginTop: 1 }}>Get help with prices, orders, and farmers</Text>
                </View>

                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-forward" size={15} color={C.white} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}