// frontend/src/components/Sidebar.jsx
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
  FolderPlus,
  FileText,
  Settings,
  Home,
  Layout,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { chats, fetchChats, deleteChat, updateChatTitle } from "../store/chatStore";
import { useChat } from '../hooks/useChat';
import Logo from './Logo';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const $chats = useStore(chats);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [chatsFolderOpen, setChatsFolderOpen] = useState(true);
  const [projectsFolderOpen, setProjectsFolderOpen] = useState(false);
  const [knowledgeFolderOpen, setKnowledgeFolderOpen] = useState(false);
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
  const handleUpdateChatTitle = async (e) => {
    e.preventDefault();

    if (!editingChatId || !newChatTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await updateChatTitle(editingChatId, newChatTitle);
      setEditingChatId(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du titre:", error);
      setEditingChatId(null);
    }
  };
  
  // Déterminer si un élément de menu est actif
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Créer un composant MenuItem réutilisable
  const MenuItem = ({ to, icon: Icon, label, active, onClick, children }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
          : "text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
      }`}
    >
      <Icon size={18} className={`mr-2 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`} />
      <span className="flex-1">{label}</span>
      {children}
    </Link>
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed md:sticky top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-dark-800 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col h-screen`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
          <Logo variant="full" />

          <button
            className="md:hidden text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 p-1 rounded-full hover:bg-dark-100 dark:hover:bg-dark-700"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New chat button */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleNewChat}
            disabled={isCreatingChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 shadow-sm font-medium"
          >
            <PlusCircle size={18} />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* Search box */}
        <div className="px-4 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-dark-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full py-2 pl-10 pr-3 border border-dark-200 dark:border-dark-700 rounded-lg bg-dark-100/60 dark:bg-dark-700/60 text-dark-800 dark:text-light-200 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {/* Main navigation */}
          <div className="space-y-1">
            <MenuItem
              to="/"
              icon={Home}
              label="Accueil"
              active={location.pathname === '/'}
            />
            <MenuItem
              to="/dashboard"
              icon={Layout}
              label="Tableau de bord"
              active={location.pathname === '/dashboard'}
            />
          </div>

          {/* Chats folder */}
          <div>
            <button
              onClick={() => setChatsFolderOpen(!chatsFolderOpen)}
              className="flex items-center w-full text-left py-2 px-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-800 dark:text-light-200"
            >
              {chatsFolderOpen ? (
                <ChevronDown size={18} className="mr-2 text-dark-400" />
              ) : (
                <ChevronRight size={18} className="mr-2 text-dark-400" />
              )}
              <MessageCircle size={18} className="mr-2 text-primary-500" />
              <span className="font-medium">Conversations</span>
            </button>

            {chatsFolderOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {isLoading && filteredChats.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-dark-500 dark:text-dark-400">
                    Chargement...
                  </div>
                ) : filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <div key={chat.id} className="relative group">
                      {editingChatId === chat.id ? (
                        <form
                          onSubmit={handleUpdateChatTitle}
                          className="flex items-center"
                        >
                          <input
                            type="text"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            className="flex-1 py-1.5 px-3 text-sm border border-dark-200 dark:border-dark-700 rounded-md bg-white dark:bg-dark-700 text-dark-800 dark:text-light-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            autoFocus
                            onBlur={handleUpdateChatTitle}
                          />
                        </form>
                      ) : (
                        <Link
                          to={`/chat/${chat.id}`}
                          className={`flex items-center py-1.5 px-3 rounded-md text-sm transition-colors ${
                            location.pathname === `/chat/${chat.id}`
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                              : "hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                          }`}
                        >
                          <span className="flex-1 truncate">{chat.title}</span>

                          <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) =>
                                startEditChat(chat.id, chat.title, e)
                              }
                              className="p-1 text-dark-400 hover:text-dark-600 dark:text-dark-400 dark:hover:text-dark-300"
                              aria-label="Edit chat title"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              className="p-1 text-dark-400 hover:text-red-500 dark:text-dark-400 dark:hover:text-red-500"
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
                  <div className="py-2 px-3 text-sm text-dark-500 dark:text-dark-400">
                    {searchTerm ? "Aucun résultat" : "Aucune conversation"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Projects folder */}
          <div>
            <button
              onClick={() => setProjectsFolderOpen(!projectsFolderOpen)}
              className="flex items-center w-full text-left py-2 px-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-800 dark:text-light-200"
            >
              {projectsFolderOpen ? (
                <ChevronDown size={18} className="mr-2 text-dark-400" />
              ) : (
                <ChevronRight size={18} className="mr-2 text-dark-400" />
              )}
              <Folder size={18} className="mr-2 text-secondary-500" />
              <span className="font-medium">Projets</span>
            </button>
            
            {projectsFolderOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <Link
                  to="/projects"
                  className={`flex items-center py-1.5 px-3 rounded-md text-sm transition-colors ${
                    location.pathname === '/projects'
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                      : "hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  }`}
                >
                  <span>Tous les projets</span>
                </Link>
                <Link
                  to="/projects"
                  className="flex items-center py-1.5 px-3 rounded-md text-sm text-primary-600 dark:text-primary-400 hover:bg-dark-100 dark:hover:bg-dark-700"
                >
                  <FolderPlus size={16} className="mr-2" />
                  <span>Nouveau projet</span>
                </Link>
              </div>
            )}
          </div>

          {/* Knowledge base */}
          <div>
            <button
              onClick={() => setKnowledgeFolderOpen(!knowledgeFolderOpen)}
              className="flex items-center w-full text-left py-2 px-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-800 dark:text-light-200"
            >
              {knowledgeFolderOpen ? (
                <ChevronDown size={18} className="mr-2 text-dark-400" />
              ) : (
                <ChevronRight size={18} className="mr-2 text-dark-400" />
              )}
              <BookOpen size={18} className="mr-2 text-accent-500" />
              <span className="font-medium">Base de connaissances</span>
            </button>
            
            {knowledgeFolderOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <Link
                  to="/knowledge"
                  className={`flex items-center py-1.5 px-3 rounded-md text-sm transition-colors ${
                    location.pathname === '/knowledge'
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                      : "hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  }`}
                >
                  <span>Tous les documents</span>
                </Link>
                <Link
                  to="/knowledge"
                  className="flex items-center py-1.5 px-3 rounded-md text-sm text-primary-600 dark:text-primary-400 hover:bg-dark-100 dark:hover:bg-dark-700"
                >
                  <FileText size={16} className="mr-2" />
                  <span>Ajouter un document</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-dark-100 dark:border-dark-700">
          <div className="flex flex-col space-y-1">
            <MenuItem
              to="/settings"
              icon={Settings}
              label="Paramètres"
              active={location.pathname === '/settings'}
            />
            <MenuItem
              to="/help"
              icon={HelpCircle}
              label="Aide et support"
              active={location.pathname === '/help'}
            />
            <a
              href="https://example.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-lg text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            >
              <ExternalLink size={18} className="mr-2" />
              <span>Documentation</span>
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
            <div className="text-xs text-center text-dark-500 dark:text-dark-400">
              MiniGPT v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;