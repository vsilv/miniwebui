// frontend/src/components/chat/MessageInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Loader,
  X,
  File,
  Image,
  Link,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Menu
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { sendMessage } from "../../store/chatStore";

const MessageInput = ({
  chatId,
  isLoading,
  onDocumentSelect,
  selectedDocs = [],
  onRemoveDoc,
}) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const optionsRef = useRef(null);

  // Speech recognition setup
  const recognition = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "fr-FR"; // Set language

      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        setMessage(transcript);

        // Auto-submit after a pause in speaking
        if (event.results[0].isFinal) {
          setTimeout(() => {
            if (isListening) {
              setIsListening(false);
              setIsProcessingVoice(true);
              stopRecording();
              // Small delay to show processing state
              setTimeout(() => {
                handleSendMessage();
                setIsProcessingVoice(false);
              }, 1000);
            }
          }, 1500);
        }
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        setIsListening(false);
        toast.error("Erreur de reconnaissance vocale");
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognition.current) {
        stopRecording();
      }
    };
  }, []);

  // Close options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus textarea on component mount and chat id changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [chatId]);

  // Refocus after message is sent
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Start voice recording
  const startRecording = () => {
    if (!recognition.current) {
      toast.error(
        "La reconnaissance vocale n'est pas supportée par votre navigateur"
      );
      return;
    }

    try {
      recognition.current.start();
      setIsRecording(true);
      setIsListening(true);
      toast.success("Écoute en cours...");
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Erreur lors du démarrage de la reconnaissance vocale");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (recognition.current && isRecording) {
      recognition.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  // Toggle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle file input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Add to attached docs
      setAttachedDocs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        },
      ]);

      toast.success(`Fichier ajouté: ${selectedFile.name}`);
    }
  };

  // Handle file button click - now opens the document modal
  const handleFileButtonClick = () => {
    if (typeof onDocumentSelect === "function") {
      onDocumentSelect();
    } else {
      // Fallback to direct file input if modal handler not provided
      fileInputRef.current.click();
    }
    
    // Close options menu if open
    setShowOptions(false);
  };

  // Insert template messages or prompts
  const insertPrompt = (promptTemplate) => {
    setMessage(message ? `${message}\n\n${promptTemplate}` : promptTemplate);
    setShowOptions(false);
    textareaRef.current.focus();
  };

  // Remove attached file
  const removeFile = () => {
    setFile(null);
    fileInputRef.current.value = "";
  };

  // Remove attached document
  const removeAttachedDoc = (docId) => {
    setAttachedDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Submit the message
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    const allDocs = [ ...selectedDocs];

    if (!trimmedMessage && !file && allDocs.length === 0) return;

    // Reset input
    setMessage("");
    const currentFile = file;
    const currentSelectedDocs = [...selectedDocs];
    setFile(null);

    // Clear selected documents from parent component if handler provided
    if (typeof onRemoveDoc === "function") {
      currentSelectedDocs.forEach((doc) => onRemoveDoc(doc.id));
    }

    try {
      // Send text message with document context
      if (trimmedMessage) {
        await sendMessage(trimmedMessage, currentSelectedDocs, true); // true for streaming
      }

      // Refocus the textarea after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  return (
    <div className="sticky bottom-0 z-10 pt-2 px-4 pb-4 bg-gradient-to-b from-transparent via-light-100/90 to-light-100 dark:from-transparent dark:via-dark-900/90 dark:to-dark-900 backdrop-blur-md">
      {/* Selected documents badges */}
      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 px-1 py-1">
          {selectedDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 pl-2 pr-1 py-1 rounded-md text-sm flex items-center shadow-sm"
            >
              <File size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{doc.title}</span>
              <button
                onClick={() => onRemoveDoc(doc.id)}
                className="ml-1 p-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 rounded-md hover:bg-primary-200/50 dark:hover:bg-primary-800/30"
                aria-label="Remove document"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div className="relative">
        <div className="flex flex-col rounded-xl shadow-md bg-white dark:bg-dark-800 border border-light-300/50 dark:border-dark-700/50 ">
          {/* Text input area */}
          <div className="relative">
            <TextareaAutosize
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envoyer un message..."
              className="w-full resize-none px-4 py-4 pr-24 text-dark-900 dark:text-light-100 bg-white dark:bg-dark-800 focus:outline-none min-h-[56px] max-h-[200px]"
              maxRows={6}
              disabled={isLoading || isProcessingVoice}
            />

            {/* Actions container - always visible on the right */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 mr-1">
              {/* Additional options button */}
              <div ref={optionsRef} className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  disabled={isLoading || isProcessingVoice}
                  className="p-2 text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg disabled:opacity-50 transition-colors"
                  aria-label="Plus d'options"
                >
                  <Menu size={18} />
                </button>
                
                {/* Options dropdown menu */}
                {showOptions && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-light-300/50 dark:border-dark-700/50 z-50 ">
                    <div className="p-3 border-b border-light-300/50 dark:border-dark-700/50">
                      <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                        Actions
                      </h3>
                    </div>
                    
                    <div className="p-1">
                      <button
                        onClick={handleFileButtonClick}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <File size={16} className="mr-2 text-primary-500" />
                        <span>Joindre un document</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          /* Handle image upload */
                          setShowOptions(false);
                        }}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <Image size={16} className="mr-2 text-primary-500" />
                        <span>Joindre une image</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          /* Handle link insertion */
                          setShowOptions(false);
                        }}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <Link size={16} className="mr-2 text-primary-500" />
                        <span>Insérer un lien</span>
                      </button>
                    </div>
                    
                    <div className="p-3 border-t border-b border-light-300/50 dark:border-dark-700/50">
                      <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                        Prompts rapides
                      </h3>
                    </div>
                    
                    <div className="p-1">
                      <button
                        onClick={() => insertPrompt("Explique-moi en détail...")}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <Sparkles size={16} className="mr-2 text-accent-500" />
                        <span>Demande d'explication</span>
                      </button>
                      
                      <button
                        onClick={() => insertPrompt("Résume ce texte en bullet points: ")}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <Sparkles size={16} className="mr-2 text-accent-500" />
                        <span>Résumé en bullet points</span>
                      </button>
                      
                      <button
                        onClick={() => insertPrompt("Traduis ce texte en anglais: ")}
                        className="flex items-center w-full p-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      >
                        <Sparkles size={16} className="mr-2 text-accent-500" />
                        <span>Traduction en anglais</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice input button */}
              <button
                onClick={toggleRecording}
                disabled={isLoading || isProcessingVoice}
                className={`p-2 rounded-lg disabled:opacity-50 transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white"
                    : "text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                }`}
                aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={
                  (!message.trim() && !file) || isLoading || isProcessingVoice
                }
                className={`p-2 rounded-lg transition-colors ${
                  message.trim() 
                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm" 
                    : "bg-dark-200 dark:bg-dark-700 text-dark-400 dark:text-dark-500"
                } disabled:opacity-50`}
                aria-label="Envoyer le message"
              >
                {isLoading || isProcessingVoice ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Footer with hint */}
          <div className="px-4 py-2 text-xs text-dark-500 dark:text-dark-400 border-t border-light-300/30 dark:border-dark-700/50 bg-light-100/50 dark:bg-dark-900/30">
            <span>
              Appuyez sur <kbd className="px-1.5 py-0.5 bg-dark-100 dark:bg-dark-700 rounded text-dark-500 dark:text-dark-400 font-mono text-xs mx-1">Entrée</kbd> pour envoyer, <kbd className="px-1.5 py-0.5 bg-dark-100 dark:bg-dark-700 rounded text-dark-500 dark:text-dark-400 font-mono text-xs mx-1">Maj+Entrée</kbd> pour sauter une ligne
            </span>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
      />
    </div>
  );
};

export default MessageInput;