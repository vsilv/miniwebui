// frontend/src/pages/Project.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Trash2, 
  Upload, 
  File, 
  Image, 
  X, 
  ArrowLeft,
  Edit2,
  Save,
  Plus,
  FolderOpen,
  Settings,
  Download,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Share2,
  CheckCircle,
  Clock,
  CalendarDays,
  PenTool,
  Loader,
  FilePlus,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  Table
} from "lucide-react";
import { toast } from "react-hot-toast";
import projectApi from "../api/project";

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'name'
  const [filterType, setFilterType] = useState("all"); // 'all', 'image', 'document', 'text'
  const [showFilters, setShowFilters] = useState(false);
  
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const filtersRef = useRef(null);

  // Fermer les menus lorsqu'on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Charger les données du projet
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await projectApi.getProjectById(projectId);
        setProject(projectData);
        setTitle(projectData.title);
        setDescription(projectData.description || "");
        setInstructions(projectData.instructions || "");
        setFiles(projectData.files || []);
      } catch (error) {
        console.error("Erreur lors du chargement du projet:", error);
        toast.error("Impossible de charger le projet");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Mettre à jour le projet
  const handleUpdateProject = async () => {
    try {
      const updatedProject = await projectApi.updateProject(projectId, {
        title,
        description,
        instructions,
      });
      setProject(updatedProject);
      setIsEditing(false);
      toast.success("Projet mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      toast.error("Impossible de mettre à jour le projet");
    }
  };

  // Annuler les modifications
  const handleCancelEdit = () => {
    setTitle(project.title);
    setDescription(project.description || "");
    setInstructions(project.instructions || "");
    setIsEditing(false);
  };

  // Supprimer le projet
  const handleDeleteProject = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      try {
        await projectApi.deleteProject(projectId);
        toast.success("Projet supprimé avec succès");
        navigate("/projects");
      } catch (error) {
        console.error("Erreur lors de la suppression du projet:", error);
        toast.error("Impossible de supprimer le projet");
      }
    }
  };

  // Télécharger un fichier
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadedFile = await projectApi.uploadProjectFile(projectId, file);
      setFiles([...files, uploadedFile]);
      toast.success("Fichier téléchargé avec succès");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier:", error);
      toast.error("Impossible de télécharger le fichier");
    } finally {
      setUploading(false);
    }
  };

  // Supprimer un fichier
  const handleDeleteFile = async (fileId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      try {
        await projectApi.deleteProjectFile(projectId, fileId);
        setFiles(files.filter((file) => file.id !== fileId));
        toast.success("Fichier supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression du fichier:", error);
        toast.error("Impossible de supprimer le fichier");
      }
    }
  };

  // Télécharger plusieurs fichiers
  const handleMultipleDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFiles.length} fichier(s) ?`)) {
      try {
        // Suppression un par un
        for (const fileId of selectedFiles) {
          await projectApi.deleteProjectFile(projectId, fileId);
        }
        
        // Mise à jour de l'état
        setFiles(files.filter(file => !selectedFiles.includes(file.id)));
        setSelectedFiles([]);
        
        toast.success(`${selectedFiles.length} fichier(s) supprimé(s)`);
      } catch (error) {
        console.error("Erreur lors de la suppression des fichiers:", error);
        toast.error("Impossible de supprimer certains fichiers");
      }
    }
  };

  // Obtenir l'icône pour un type de fichier
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <Image size={20} className="text-primary-500" />;
      case "pdf":
        return <FileText size={20} className="text-red-500" />;
      case "text":
        return <FileText size={20} className="text-green-500" />;
      default:
        return <File size={20} className="text-dark-400" />;
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };
  
  // Formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  
  // Sélectionner/Désélectionner un fichier
  const toggleFileSelection = (fileId) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };
  
  // Filtrer et trier les fichiers
  const getFilteredFiles = () => {
    let filtered = [...files];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.file_type === filterType);
    }
    
    // Trier
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.created_at - a.created_at;
      } else if (sortBy === 'oldest') {
        return a.created_at - b.created_at;
      } else if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      return 0;
    });
    
    return filtered;
  };
  
  const filteredFiles = getFilteredFiles();
  
  // Vérifier si tous les fichiers affichés sont sélectionnés
  const areAllFilesSelected = () => {
    return filteredFiles.length > 0 && filteredFiles.every(file => selectedFiles.includes(file.id));
  };
  
  // Sélectionner/Désélectionner tous les fichiers
  const toggleSelectAll = () => {
    if (areAllFilesSelected()) {
      // Désélectionner tous les fichiers affichés
      const filteredIds = filteredFiles.map(file => file.id);
      setSelectedFiles(selectedFiles.filter(id => !filteredIds.includes(id)));
    } else {
      // Sélectionner tous les fichiers affichés
      const filteredIds = filteredFiles.map(file => file.id);
      const newSelected = [...new Set([...selectedFiles, ...filteredIds])];
      setSelectedFiles(newSelected);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary-600 border-r-transparent animate-spin mb-4"></div>
          <p className="text-lg font-medium text-dark-800 dark:text-light-200 mb-1">
            Chargement...
          </p>
          <p className="text-dark-500 dark:text-dark-400 max-w-sm">
            Préparation de votre projet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête du projet */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-dark-500 dark:text-dark-400 mb-4">
          <Link 
            to="/projects"
            className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Tous les projets</span>
          </Link>
          <span>/</span>
          <span className="text-dark-700 dark:text-dark-300 truncate">
            {project.title}
          </span>
        </div>
        
        {isEditing ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 p-6 mb-6">
            <h2 className="text-xl font-medium text-dark-800 dark:text-light-200 mb-4">
              Modifier le projet
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                >
                  Annuler
                </button>
                
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-light-100 mb-1">
                {project.title}
              </h1>
              
              {project.description && (
                <p className="text-dark-600 dark:text-dark-400 max-w-2xl">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm text-dark-500 dark:text-dark-400">
                <div className="flex items-center">
                  <CalendarDays size={14} className="mr-1.5" />
                  <span>Créé le {formatDate(project.created_at)}</span>
                </div>
                
                <div className="flex items-center">
                  <Table size={14} className="mr-1.5" />
                  <span>{files.length} fichier{files.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            <div ref={menuRef} className="relative flex flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors shadow-sm"
                >
                  <Edit2 size={16} />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors shadow-sm"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-medium border border-dark-200/50 dark:border-dark-700/50 z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      /* TODO: Implement share functionality */
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  >
                    <Share2 size={16} className="text-dark-500" />
                    <span>Partager le projet</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      /* TODO: Implement duplicate functionality */
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  >
                    <Copy size={16} className="text-dark-500" />
                    <span>Dupliquer</span>
                  </button>
                  
                  <button
                    onClick={handleDeleteProject}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 text-red-600 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Contenu du projet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche : Instructions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 overflow-hidden">
            <div className="p-4 border-b border-light-300/50 dark:border-dark-700/50 flex justify-between items-center">
              <h2 className="text-lg font-medium text-dark-800 dark:text-light-200 flex items-center">
                <PenTool size={18} className="mr-2 text-primary-500" />
                Instructions
              </h2>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            <div className="p-4">
              {isEditing ? (
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ajoutez des instructions pour ce projet..."
                />
              ) : (
                <div className="prose prose-dark dark:prose-light max-w-none">
                  {instructions ? (
                    <div className="whitespace-pre-wrap text-dark-800 dark:text-light-200">
                      {instructions}
                    </div>
                  ) : (
                    <p className="text-dark-500 dark:text-dark-500 italic">
                      Aucune instruction pour ce projet. Cliquez sur modifier pour en ajouter.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Colonne de droite : Fichiers */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 overflow-hidden">
            <div className="p-4 border-b border-light-300/50 dark:border-dark-700/50 flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-lg font-medium text-dark-800 dark:text-light-200 flex items-center">
                <FolderOpen size={18} className="mr-2 text-primary-500" />
                Fichiers {files.length > 0 && `(${files.length})`}
              </h2>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm text-sm"
                >
                  <FilePlus size={16} />
                  <span>Ajouter</span>
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Actions avec fichiers sélectionnés */}
            {selectedFiles.length > 0 && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-primary-800 dark:text-primary-200">
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="px-2 py-1 text-xs text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/50 rounded"
                  >
                    Désélectionner
                  </button>
                  
                  <button
                    onClick={handleMultipleDelete}
                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Recherche et filtres */}
            <div className="p-3 border-b border-light-300/50 dark:border-dark-700/50 bg-light-100/80 dark:bg-dark-900/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-dark-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un fichier..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  {/* Filters */}
                  <div ref={filtersRef} className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg flex items-center gap-2 text-sm hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                    >
                      <Filter size={16} />
                      <span>Filtres</span>
                      {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {showFilters && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-md border border-dark-200/50 dark:border-dark-700/50 z-10 overflow-hidden">
                        <div className="p-3 border-b border-dark-200 dark:border-dark-700">
                          <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                            Type de fichier
                          </h3>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => setFilterType('all')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              filterType === 'all' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Tous les types
                          </button>
                          
                          <button
                            onClick={() => setFilterType('image')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              filterType === 'image' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Images
                          </button>
                          
                          <button
                            onClick={() => setFilterType('document')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              filterType === 'document' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Documents
                          </button>
                          
                          <button
                            onClick={() => setFilterType('text')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              filterType === 'text' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Texte
                          </button>
                        </div>
                        
                        <div className="p-3 border-t border-dark-200 dark:border-dark-700">
                          <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                            Trier par
                          </h3>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => setSortBy('newest')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              sortBy === 'newest' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Les plus récents
                          </button>
                          
                          <button
                            onClick={() => setSortBy('oldest')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              sortBy === 'oldest' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Les plus anciens
                          </button>
                          
                          <button
                            onClick={() => setSortBy('name')}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                              sortBy === 'name' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                            }`}
                          >
                            Nom (A-Z)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* View toggle */}
                  <div className="flex border border-dark-300 dark:border-dark-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 flex items-center justify-center ${
                        viewMode === 'grid' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                      aria-label="Vue en grille"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 flex items-center justify-center ${
                        viewMode === 'list' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                      aria-label="Vue en liste"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Liste des fichiers */}
            <div className="p-4">
              {uploading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center">
                    <Loader size={24} className="animate-spin text-primary-500 mb-2" />
                    <p className="text-dark-600 dark:text-dark-400 text-sm">
                      Téléchargement en cours...
                    </p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center mb-3">
                    <File size={24} className="text-dark-400" />
                  </div>
                  <h3 className="text-base font-medium text-dark-800 dark:text-light-200 mb-1">
                    {searchTerm ? "Aucun fichier trouvé" : "Aucun fichier"}
                  </h3>
                  <p className="text-dark-500 dark:text-dark-500 text-sm mb-4">
                    {searchTerm 
                      ? "Aucun fichier ne correspond à votre recherche." 
                      : "Ajoutez des fichiers à votre projet."
                    }
                  </p>
                  
                  {!searchTerm && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm text-sm mt-2"
                    >
                      <Upload size={16} />
                      <span>Télécharger un fichier</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Grid view */}
                  {viewMode === 'grid' && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="select-all"
                            checked={areAllFilesSelected()}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-dark-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                          />
                          <label htmlFor="select-all" className="ml-2 text-sm text-dark-700 dark:text-dark-300">
                            Tout sélectionner
                          </label>
                        </div>
                        
                        {filteredFiles.length > 0 && (
                          <span className="text-sm text-dark-500 dark:text-dark-400">
                            {filteredFiles.length} fichier{filteredFiles.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFiles.map((file) => (
                          <div
                            key={file.id}
                            className={`group border rounded-xl overflow-hidden transition-colors ${
                              selectedFiles.includes(file.id)
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50'
                                : 'bg-white dark:bg-dark-700/50 border-light-300/50 dark:border-dark-700/50 hover:border-primary-200 dark:hover:border-primary-800/50'
                            }`}
                          >
                            <div className="flex p-4">
                              <div className="flex-shrink-0 mr-3">
                                <div className="h-10 w-10 rounded-lg bg-light-100 dark:bg-dark-700 flex items-center justify-center">
                                  {getFileIcon(file.file_type)}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start">
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => toggleFileSelection(file.id)}
                                    className="h-4 w-4 rounded border-dark-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500 mt-1 mr-2"
                                  />
                                  
                                  <div>
                                    <h3 className="text-sm font-medium text-dark-800 dark:text-light-200 truncate">
                                      {file.filename}
                                    </h3>
                                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                                      {formatFileSize(file.file_size)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="px-4 py-2 bg-light-100/70 dark:bg-dark-800/70 border-t border-light-300/50 dark:border-dark-700/50 flex justify-between">
                              <button
                                onClick={() => {/* TODO: handle preview */}}
                                className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors text-xs"
                              >
                                Prévisualiser
                              </button>
                              
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {/* TODO: implement download */}}
                                  className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                                  aria-label="Télécharger le fichier"
                                >
                                  <Download size={14} />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1.5 text-dark-500 hover:text-red-600 dark:text-dark-400 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                                  aria-label="Supprimer le fichier"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* List view */}
                  {viewMode === 'list' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-dark-200 dark:divide-dark-700">
                        <thead>
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={areAllFilesSelected()}
                                  onChange={toggleSelectAll}
                                  className="h-4 w-4 rounded border-dark-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-3 text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                                  Nom
                                </span>
                              </div>
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                              Taille
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100 dark:divide-dark-700/50">
                          {filteredFiles.map((file) => (
                            <tr 
                              key={file.id} 
                              className={`hover:bg-light-100 dark:hover:bg-dark-700/50 ${
                                selectedFiles.includes(file.id)
                                  ? 'bg-primary-50 dark:bg-primary-900/20'
                                  : ''
                              }`}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => toggleFileSelection(file.id)}
                                    className="h-4 w-4 rounded border-dark-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                                  />
                                  <div className="flex items-center ml-3">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-md bg-light-100 dark:bg-dark-700 flex items-center justify-center mr-2">
                                      {getFileIcon(file.file_type)}
                                    </div>
                                    <div className="font-medium text-dark-800 dark:text-light-200 text-sm truncate max-w-xs">
                                      {file.filename}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-600 dark:text-dark-400">
                                {file.file_type}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-600 dark:text-dark-400">
                                {formatFileSize(file.file_size)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-600 dark:text-dark-400">
                                {formatDate(file.created_at)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {/* TODO: implement download */}}
                                    className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                                    aria-label="Télécharger le fichier"
                                  >
                                    <Download size={16} />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-1.5 text-dark-500 hover:text-red-600 dark:text-dark-400 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                                    aria-label="Supprimer le fichier"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;