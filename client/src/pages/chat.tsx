import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Calendar, Shield, Plus, ArrowLeft, FileText, Mic, MicOff, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import templates from "@shared/templates.json";
import type { ChatMessage, Conversation } from "@shared/schema";

// Import Markdown renderer
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper: Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supportsSpeechRecognition = !!SpeechRecognition;

export default function Chat() {
  const [, setLocation] = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLang, setSelectedLang] = useState<'en-US' | 'hi-IN'>('en-US');

  // Initialize speech recognition
  useEffect(() => {
    if (!supportsSpeechRecognition) return;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLang;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLang]);

  const startListening = () => {
    if (!supportsSpeechRecognition) {
      alert("Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/messages", currentConversationId],
    enabled: !!currentConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chat", {
        content,
        conversationId: currentConversationId,
      });
    },
    onSuccess: (data) => {
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/messages", currentConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setInput("");
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/conversations", {});
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageMutation.mutate(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createConversationMutation.mutate();
  };

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', currentConversationId || '');
    
    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (data.conversationId) {
          setCurrentConversationId(data.conversationId);
          queryClient.invalidateQueries({ queryKey: ["/api/messages", data.conversationId] });
        }
        alert(`PDF uploaded: ${file.name}. You can now ask questions about it.`);
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      } else {
        alert('Upload failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-4 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Health Chat Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" data-testid="button-book-appointment" onClick={() => setLocation("/appointments")}>
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <aside className="w-80 border-r bg-accent/10 hidden md:flex flex-col">
            <div className="p-4 border-b">
              <Button
                className="w-full gap-2"
                onClick={handleNewChat}
                disabled={createConversationMutation.isPending}
                data-testid="button-new-chat"
              >
                <Plus className="h-4 w-4" />
                {templates.ui.chat.newChat}
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-3">
                  {templates.ui.chat.conversations}
                </h3>
                {conversationsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <Card
                      key={conv.id}
                      className={`cursor-pointer transition-colors hover-elevate ${
                        currentConversationId === conv.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setCurrentConversationId(conv.id)}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium line-clamp-2">
                          {conv.title || "New Conversation"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No conversations yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        <main className="flex flex-1 flex-col">
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {!currentConversationId ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to HealthAI Chat</h2>
                  <p className="text-muted-foreground font-serif mb-6">
                    {templates.chat.welcome}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="secondary" className="px-4 py-2">
                      Ask health questions
                    </Badge>
                    <Badge variant="secondary" className="px-4 py-2">
                      Get cited answers
                    </Badge>
                    <Badge variant="secondary" className="px-4 py-2">
                      Book appointments
                    </Badge>
                  </div>
                </div>
              ) : messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <Skeleton className="h-24 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                        <Shield className="h-4 w-4 text-accent-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.role === "system"
                          ? "bg-accent/50 text-accent-foreground border border-accent"
                          : "bg-card border border-card-border"
                      }`}
                    >
                      {/* Markdown rendering for assistant messages, plain text for user messages */}
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-serif">{message.content}</p>
                      )}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                          {message.citations.map((citation, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs gap-1"
                              data-testid={`citation-${index}`}
                            >
                              <FileText className="h-3 w-3" />
                              {citation}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No messages yet. Type your question below.
                </div>
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-accent-foreground animate-pulse" />
                  </div>
                  <div className="max-w-2xl rounded-2xl px-4 py-3 bg-card border border-card-border">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-background/95 backdrop-blur p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "🎤 Listening..." : templates.ui.chat.placeholder}
                  className="min-h-[80px] pr-36 resize-none"
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-chat-message"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className="flex gap-1 mr-2">
                    <Button
                      size="sm"
                      variant={selectedLang === 'en-US' ? 'default' : 'outline'}
                      onClick={() => setSelectedLang('en-US')}
                      disabled={sendMessageMutation.isPending}
                      className="h-8 px-2"
                    >
                      EN
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedLang === 'hi-IN' ? 'default' : 'outline'}
                      onClick={() => setSelectedLang('hi-IN')}
                      disabled={sendMessageMutation.isPending}
                      className="h-8 px-2"
                    >
                      हिंदी
                    </Button>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sendMessageMutation.isPending}
                    title="Upload PDF"
                  >
                    {uploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={startListening}
                    disabled={sendMessageMutation.isPending}
                    title={supportsSpeechRecognition ? (isListening ? "Stop listening" : "Start voice input") : "Speech not supported"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center font-serif">
                Press Enter to send, Shift+Enter for new line • Click 🎙️ to speak • Click <span className="-rotate-90 inline-block">[➜</span> to upload PDF
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}