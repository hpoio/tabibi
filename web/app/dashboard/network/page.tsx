"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Search, Loader2, Stethoscope, MessageCircle, Plus, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type DoctorSummary = {
  id: string;
  specialty: string;
  clinicName: string | null;
  user: { fullName: string };
};

type Conversation = {
  doctor: DoctorSummary;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

// نحصل على معرّف ملف الطبيب الحالي من الرسائل نفسها (أي طرف غير المُحادَث)
// بدل الاعتماد على مصدر خارجي، لتفادي أي تبعية إضافية غير ضرورية بهذه المرحلة.
function resolveMyDoctorId(messages: Message[], otherDoctorId: string): string | null {
  const withOther = messages.find(
    (m) => m.senderId === otherDoctorId || m.receiverId === otherDoctorId,
  );
  if (!withOther) return null;
  return withOther.senderId === otherDoctorId ? withOther.receiverId : withOther.senderId;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
}

export default function DoctorNetworkPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const myDoctorIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get<Conversation[]>("/doctor-messages/conversations");
      setConversations(data);
    } catch {
      /* صامت - التحديث الدوري لا يجب أن يقاطع المستخدم برسالة خطأ */
    }
  }, []);

  const loadMessages = useCallback(async (doctorId: string) => {
    try {
      const data = await api.get<Message[]>(`/doctor-messages/with/${doctorId}`);
      setMessages(data);
      const mine = resolveMyDoctorId(data, doctorId);
      if (mine) myDoctorIdRef.current = mine;
    } catch {
      /* صامت */
    }
  }, []);

  useEffect(() => {
    setLoadingList(true);
    Promise.all([
      api.get<Conversation[]>("/doctor-messages/conversations"),
      api.get<DoctorSummary[]>("/doctor-messages/doctors"),
    ])
      .then(([convs, docs]) => {
        setConversations(convs);
        setDoctors(docs);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل شبكة الأطباء"))
      .finally(() => setLoadingList(false));
  }, []);

  // تحديث دوري لقائمة المحادثات (كل 8 ثوانٍ) لإظهار رسائل جديدة واردة
  useEffect(() => {
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // تحديث دوري لمحادثة مفتوحة حالياً (كل 4 ثوانٍ)
  useEffect(() => {
    if (!selectedDoctor) return;
    const interval = setInterval(() => loadMessages(selectedDoctor.id), 4000);
    return () => clearInterval(interval);
  }, [selectedDoctor, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConversation(doctor: DoctorSummary) {
    setSelectedDoctor(doctor);
    setShowNewChat(false);
    setLoadingMessages(true);
    setMessages([]);
    try {
      await loadMessages(doctor.id);
      await api.patch(`/doctor-messages/with/${doctor.id}/read`);
      loadConversations();
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    const content = newMessage.trim();
    if (!content || !selectedDoctor || sending) return;
    setSending(true);
    setNewMessage("");
    try {
      await api.post("/doctor-messages", { receiverId: selectedDoctor.id, content });
      await loadMessages(selectedDoctor.id);
      loadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إرسال الرسالة");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  }

  const conversationDoctorIds = new Set(conversations.map((c) => c.doctor.id));
  const newChatCandidates = doctors.filter(
    (d) =>
      !conversationDoctorIds.has(d.id) &&
      (search.trim() === "" || d.user.fullName.includes(search.trim())),
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-danger" />
          شبكة الأطباء
        </h1>
        <p className="text-foreground/50 text-sm mt-1">تواصل مباشرة مع زملائك الأطباء</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden" style={{ height: "70vh" }}>
        <div className="grid md:grid-cols-[300px_1fr] h-full">
          {/* عمود المحادثات */}
          <div className="border-l border-border flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-border shrink-0">
              <button
                onClick={() => setShowNewChat((v) => !v)}
                className="w-full h-10 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary-dark"
              >
                {showNewChat ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showNewChat ? "إلغاء" : "محادثة جديدة"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
                </div>
              ) : showNewChat ? (
                <div className="p-2">
                  <div className="relative mb-2 px-1">
                    <Search className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="بحث باسم الطبيب"
                      className="w-full h-9 rounded-lg border border-border pr-8 pl-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  {newChatCandidates.length === 0 ? (
                    <p className="text-xs text-foreground/40 text-center py-6">لا يوجد أطباء آخرون بعد</p>
                  ) : (
                    newChatCandidates.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => openConversation(d)}
                        className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-accent-soft flex items-center gap-2.5"
                      >
                        <span className="w-9 h-9 rounded-full bg-danger/15 text-danger flex items-center justify-center shrink-0 text-sm font-bold">
                          {d.user.fullName.charAt(0)}
                        </span>
                        <span className="text-right overflow-hidden">
                          <span className="block text-sm font-medium truncate">{d.user.fullName}</span>
                          <span className="block text-xs text-foreground/40 truncate">{d.specialty}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MessageCircle className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-foreground/40">لا توجد محادثات بعد، ابدأ واحدة جديدة</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.doctor.id}
                    onClick={() => openConversation(c.doctor)}
                    className={`w-full text-right px-3 py-2.5 flex items-center gap-2.5 border-b border-border/50 hover:bg-accent-soft ${
                      selectedDoctor?.id === c.doctor.id ? "bg-accent-soft" : ""
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-danger/15 text-danger flex items-center justify-center shrink-0 text-sm font-bold">
                      {c.doctor.user.fullName.charAt(0)}
                    </span>
                    <span className="flex-1 text-right overflow-hidden">
                      <span className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium truncate">{c.doctor.user.fullName}</span>
                        <span className="text-[10px] text-foreground/40 shrink-0">{formatTime(c.lastMessageAt)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-1">
                        <span className="block text-xs text-foreground/40 truncate">{c.lastMessage}</span>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {c.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* عمود المحادثة المفتوحة */}
          <div className="flex flex-col h-full overflow-hidden">
            {!selectedDoctor ? (
              <div className="flex-1 flex flex-col items-center justify-center text-foreground/30">
                <MessageCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">اختر محادثة أو ابدأ واحدة جديدة</p>
              </div>
            ) : (
              <>
                <div className="h-14 border-b border-border flex items-center gap-2.5 px-4 shrink-0">
                  <span className="w-8 h-8 rounded-full bg-danger/15 text-danger flex items-center justify-center text-sm font-bold">
                    {selectedDoctor.user.fullName.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{selectedDoctor.user.fullName}</span>
                    <span className="block text-xs text-foreground/40">{selectedDoctor.specialty}</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-foreground/40 py-10">ابدأ المحادثة بإرسال أول رسالة</p>
                  ) : (
                    messages.map((m) => {
                      const isMine = myDoctorIdRef.current === m.senderId;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                              isMine
                                ? "bg-primary text-white rounded-bl-sm"
                                : "bg-accent-soft text-foreground rounded-br-sm"
                            }`}
                          >
                            <span className="block">{m.content}</span>
                            <span className={`block text-[10px] mt-0.5 ${isMine ? "text-white/70" : "text-foreground/40"}`}>
                              {formatTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-border flex items-center gap-2 shrink-0">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="اكتب رسالة..."
                    className="flex-1 h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
