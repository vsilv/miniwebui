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
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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
      toast.success("Enregistrement terminé");
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

  // Handle keyboard shortcuts (Enter to send)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <div className="border-t border-gray-200 dark:border-dark-700 pt-3 px-2 pb-3">
      {/* Selected documents badges */}
      <div className="flex items-center gap-2 mb-2">
        {selectedDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md text-sm flex items-center"
          >
            <File size={16} className="mr-1" />
            <span>{doc.title}</span>
            <button
              onClick={() => onRemoveDoc(doc.id)}
              className="ml-1 text-primary-500 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-400"
              aria-label="Remove document"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* File attachment preview */}
      {file && (
        <div className="mb-2 bg-gray-100 dark:bg-dark-800 px-3 py-2 rounded-md flex items-center justify-between">
          <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
            {file.name}
          </div>
          <button
            onClick={removeFile}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            aria-label="Remove file"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <TextareaAutosize
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envoyer un message..."
            className="chat-input w-full resize-none px-4 py-3 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[52px] max-h-[200px]"
            maxRows={5}
            disabled={isLoading || isProcessingVoice}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* File attachment button */}
          <button
            onClick={handleFileButtonClick}
            disabled={isLoading || isProcessingVoice}
            className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg disabled:opacity-50"
            aria-label="Attach file"
          >
            <Paperclip size={20} />
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />

          {/* Voice input button */}
          <button
            onClick={toggleRecording}
            disabled={isLoading || isProcessingVoice}
            className={`p-3 rounded-lg disabled:opacity-50 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-dark-700"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={
              (!message.trim() && !file) || isLoading || isProcessingVoice
            }
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
            aria-label="Send message"
          >
            {isLoading || isProcessingVoice ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
