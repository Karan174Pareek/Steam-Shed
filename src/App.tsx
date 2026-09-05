import { useState, useEffect, useRef } from 'react';
import {
  Header,
  ChatMessage,
  LoadingIndicator,
  ChatInput,
  EmptyState,
  StorageModal,
  SystemBanner,
  SuggestedChips,
  STATIC_SUGGESTED_QUESTIONS,
  deriveSuggestedQuestions,
  type MessageItem,
} from './ui';
import { Train } from 'lucide-react';
import {
  getAllDocuments,
  getAllChunks,
  deleteDocument,
  getStorageUsage,
  getIsInMemoryFallback,
  type DocumentRecord,
} from './storage';
import { ingestDocument } from './ingestion';
import { answerQuestion, getActiveProviderStatus } from './generation';
import { EMBEDDING_MODEL_VERSION } from './embedding';

export function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState({ usedBytes: 0, quotaBytes: 0 });
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryStatus, setQueryStatus] = useState('Thinking through the manual...');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [isLlmReady, setIsLlmReady] = useState(false);
  const [modeLabel, setModeLabel] = useState('matched excerpts only');
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(STATIC_SUGGESTED_QUESTIONS);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  // Initial load: fetch documents, storage stats, chunks for suggestions, and check model provider status
  useEffect(() => {
    async function initApp() {
      try {
        const [docs, storage, chunks, providerStatus] = await Promise.all([
          getAllDocuments(),
          getStorageUsage(),
          getAllChunks(),
          getActiveProviderStatus(),
        ]);

        setDocuments(docs);
        setStorageUsage(storage);
        setSuggestedQuestions(deriveSuggestedQuestions(chunks));
        setIsLlmReady(providerStatus.isLlmReady);
        setModeLabel(providerStatus.modeLabel);

        // Check for stale vector index version
        const hasOutdatedDocs = docs.some(
          (d) => d.embeddingModelVersion && d.embeddingModelVersion !== EMBEDDING_MODEL_VERSION
        );
        if (hasOutdatedDocs) {
          setVersionMismatch(true);
        }
      } catch (err) {
        console.error('App initialization error:', err);
      }
    }

    initApp();
  }, []);

  const refreshDocumentsAndStorage = async () => {
    const [docs, storage, chunks] = await Promise.all([
      getAllDocuments(),
      getStorageUsage(),
      getAllChunks(),
    ]);
    setDocuments(docs);
    setStorageUsage(storage);
    setSuggestedQuestions(deriveSuggestedQuestions(chunks));
  };

  // Ingest any user-provided PDF file
  const handleFileUpload = async (file: File): Promise<boolean> => {
    setIsIngesting(true);
    setIngestStatus(`Reading "${file.name}"...`);
    setSystemError(null);

    const result = await ingestDocument(file, (status) => {
      setIngestStatus(status);
    });

    setIsIngesting(false);
    setIngestStatus('');

    if (result.success) {
      await refreshDocumentsAndStorage();
      return true;
    } else {
      setSystemError(result.error || `Failed to process ${file.name}`);
      return false;
    }
  };

  /**
   * =========================================================================
   * INTEGRATION POINT: SEED SAMPLE TECHNICAL MANUAL
   *
   * Real DHR source documents (e.g. Tindharia Works overhaul procedures,
   * boiler code, and vacuum brake specs) can be swapped into
   * public/sample-manuals/ or loaded via the custom PDF upload button.
   * =========================================================================
   */
  const handleLoadSampleManual = async (): Promise<boolean> => {
    try {
      setIsIngesting(true);
      setIngestStatus('Fetching sample DHR B-Class Maintenance Spec (Placeholder)...');
      setSystemError(null);

      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const response = await fetch(`${cleanBase}sample-manuals/bclass_maintenance_manual_sample.pdf`);
      if (!response.ok) {
        throw new Error('Sample manual file not found in local app shell');
      }

      const blob = await response.blob();
      const sampleFile = new File([blob], 'bclass_maintenance_manual_sample.pdf', {
        type: 'application/pdf',
      });

      return await handleFileUpload(sampleFile);
    } catch (err) {
      setIsIngesting(false);
      setIngestStatus('');
      setSystemError(
        `Could not load sample manual: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument(docId);
      await refreshDocumentsAndStorage();
    } catch (err) {
      setSystemError(`Failed to delete document: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isQuerying) return;

    // If user tapped a question before any manual was loaded, load the sample manual first
    if (documents.length === 0) {
      const loaded = await handleLoadSampleManual();
      if (!loaded) return;
    }

    const userMessage: MessageItem = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsQuerying(true);
    setQueryStatus('Thinking through the manual...');

    try {
      const result = await answerQuestion(trimmed, (status) => {
        setQueryStatus(status);
      });

      const assistantMessage: MessageItem = {
        id: `msg_${Date.now()}_assistant`,
        sender: 'assistant',
        text: result.answer,
        timestamp: Date.now(),
        resultMeta: result,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Q&A error:', err);
      const errorMessage: MessageItem = {
        id: `msg_${Date.now()}_error`,
        sender: 'assistant',
        text: "The provided documents don't cover this.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsQuerying(false);
    }
  };

  const isInMemory = getIsInMemoryFallback();

  return (
    <div className="flex flex-col min-h-screen bg-base text-accent-iron">
      {/* Header with status pill and document manager trigger */}
      <Header
        isLlmReady={isLlmReady}
        modeLabel={modeLabel}
        documentCount={documents.length}
        onOpenStorage={() => setIsStorageOpen(true)}
      />

      {/* System Warning Banners (IndexedDB unavailable, version mismatch, upload error) */}
      <SystemBanner
        isInMemory={isInMemory}
        versionMismatch={versionMismatch}
        errorMessage={systemError}
        onDismissError={() => setSystemError(null)}
        onReindexRequired={() => setIsStorageOpen(true)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
        {documents.length === 0 ? (
          <EmptyState
            onFileUpload={handleFileUpload}
            onLoadSampleManual={handleLoadSampleManual}
            isIngesting={isIngesting}
            ingestStatus={ingestStatus}
            suggestedQuestions={suggestedQuestions}
            onSelectQuestion={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col justify-end">
            {messages.length === 0 && (
              <div className="text-center py-6 my-auto select-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-raised mx-auto mb-3.5 border border-shadow-dark/40 shadow-neu-raised">
                  <Train className="w-5 h-5 text-accent-brass flex-shrink-0" />
                  <span className="font-display font-black text-sm tracking-widest text-accent-iron uppercase">
                    DHR &bull; Tindharia Works
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-accent-iron mb-1">
                  Locomotive Maintenance Knowledge Active
                </h3>
                <p className="text-xs sm:text-sm text-accent-iron font-semibold max-w-md mx-auto mb-5">
                  {documents.length} manual{documents.length === 1 ? '' : 's'} indexed on-device &bull; Ask about torque, intervals, and procedures — works fully offline.
                </p>

                {/* Suggested Questions in Initial Knowledge State */}
                <div className="max-w-xl mx-auto">
                  <SuggestedChips
                    questions={suggestedQuestions}
                    onSelect={handleSendMessage}
                    disabled={isQuerying}
                    variant="empty-state"
                  />
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isQuerying && <LoadingIndicator statusText={queryStatus} />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Mid-conversation Compact Suggested Questions Bar */}
      {documents.length > 0 && messages.length > 0 && (
        <SuggestedChips
          questions={suggestedQuestions}
          onSelect={handleSendMessage}
          disabled={isQuerying}
          variant="compact-bar"
        />
      )}

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isQuerying || isIngesting}
        hasDocuments={documents.length > 0}
      />

      {/* Storage and Document Manager Modal */}
      <StorageModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        documents={documents}
        onDeleteDocument={handleDeleteDocument}
        onFileUpload={handleFileUpload}
        isIngesting={isIngesting}
        ingestStatus={ingestStatus}
        storageUsage={storageUsage}
      />
    </div>
  );
}

export default App;
