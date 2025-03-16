import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@nanostores/react";
import {
  PlusCircle,
  MessageCircle,
  BookOpen,
  Trash2,
  Edit2,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
} from "lucide-react";
import { chats, fetchChats, deleteChat, updateChatTitle } from "../store/chatStore";
import { useChat } from '../hooks/useChat';
import { toast } from "react-hot-toast";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const $chats = useStore(chats);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [folderOpen, setFolderOpen] = useState(true);
  const { isCreatingChat, handleNewChat } = useChat();

  // Filtrer les chats en fonction de la recherche
  const filteredChats = $chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Charger les chats au démarrage
  useEffect(() => {
    const loadChats = async () => {
      setIsLoading(true);
      await fetchChats();
      setIsLoading(false);
    };

    loadChats();
  }, []);

  // Créer un nouveau chat


  // Supprimer un chat
  const handleDeleteChat = async (chatId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")
    ) {
      try {
        await deleteChat(chatId);

        // Rediriger vers la page d'accueil si le chat supprimé est le chat actuel
        if (location.pathname === `/chat/${chatId}`) {
          navigate("/");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du chat:", error);
      }
    }
  };

  // Commencer à éditer le titre d'un chat
  const startEditChat = (chatId, title, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chatId);
    setNewChatTitle(title);
  };

  // Mettre à jour le titre d'un chat
  const updateChatTitle = async (e) => {
    e.preventDefault();

    if (!editingChatId || !newChatTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      // TODO: Implement chat title update
      // For now, we'll just update the local state
      const updatedChats = $chats.map((chat) =>
        chat.id === editingChatId ? { ...chat, title: newChatTitle } : chat
      );
      chats.set(updatedChats);

      setEditingChatId(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du titre:", error);
      setEditingChatId(null);
    }
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed md:static inset-y-0 left-0 z-30 w-64 bg-gray-50 dark:bg-dark-800 shadow-md transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Conversations
          </h2>

          <button
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New chat button */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            disabled={isCreatingChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
          >
            <PlusCircle size={18} />
            <span>Nouvelle conversation</span>
          </button>
          
          {/* New project button */}
          <Link
            to="/projects"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
          >
            <Folder size={18} />
            <span>Nouveau projet</span>
          </Link>
        </div>

        {/* Search box */}
        <div className="px-3 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Chats folder */}
          <div className="mb-2">
            <button
              onClick={() => setFolderOpen(!folderOpen)}
              className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-gray-200 dark:hover:bg-dark-700"
            >
              {folderOpen ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              <MessageCircle size={18} className="mr-2" />
              <span className="font-medium">Chats</span>
            </button>

            {folderOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {isLoading && filteredChats.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                    Chargement...
                  </div>
                ) : filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <div key={chat.id} className="relative group">
                      {editingChatId === chat.id ? (
                        <form
                          onSubmit={updateChatTitle}
                          className="flex items-center"
                        >
                          <input
                            type="text"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            className="flex-1 py-1 px-2 text-sm border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            autoFocus
                            onBlur={updateChatTitle}
                          />
                        </form>
                      ) : (
                        <Link
                          to={`/chat/${chat.id}`}
                          className={`flex items-center py-1.5 px-3 rounded-md text-sm ${
                            location.pathname === `/chat/${chat.id}`
                              ? "bg-gray-200 dark:bg-dark-700 font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-dark-700"
                          }`}
                        >
                          <span className="flex-1 truncate">{chat.title}</span>

                          <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) =>
                                startEditChat(chat.id, chat.title, e)
                              }
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Edit chat title"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
                              aria-label="Delete chat"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "Aucun résultat" : "Aucune conversation"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Knowledge base link */}
          <Link
            to="/knowledge"
            className={`flex items-center py-2 px-3 rounded-md ${
              location.pathname === "/knowledge"
                ? "bg-gray-200 dark:bg-dark-700 font-medium"
                : "hover:bg-gray-200 dark:hover:bg-dark-700"
            }`}
          >
            <BookOpen size={18} className="mr-2" />
            <span>Base de connaissances</span>
          </Link>
          
          {/* Projects link */}
          <Link
            to="/projects"
            className={`flex items-center py-2 px-3 rounded-md ${
              location.pathname === "/projects" || location.pathname.startsWith("/project/")
                ? "bg-gray-200 dark:bg-dark-700 font-medium"
                : "hover:bg-gray-200 dark:hover:bg-dark-700"
            }`}
          >
            <Folder size={18} className="mr-2" />
            <span>Projets</span>
          </Link>
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-200 dark:border-dark-700">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            MiniWebUI v0.1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
