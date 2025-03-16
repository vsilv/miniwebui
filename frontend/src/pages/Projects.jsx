// frontend/src/pages/Projects.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PlusCircle, 
  Folder, 
  Search, 
  Trash2, 
  Edit2, 
  Clock, 
  X, 
  FolderPlus,
  FolderOpen,
  Loader,
  Files,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckSquare,
  AlertCircle,
  CalendarDays,
  ClipboardList
} from "lucide-react";
import { toast } from "react-hot-toast";
import projectApi from "../api/project";

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'alphabetical'
  const [showFilters, setShowFilters] = useState(false);
  
  const filtersRef = useRef(null);
  const modalRef = useRef(null);

  // Handle clicks outside of menus to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target) && showNewProjectModal) {
        // We only want to close if the click is outside the modal and not on the button that opens it
        if (!event.target.closest('button[data-action="open-modal"]')) {
          setShowNewProjectModal(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNewProjectModal]);

  // Charger la liste des projets
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projects = await projectApi.getProjects();
        setProjects(projects);
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
        toast.error("Impossible de charger les projets");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filtrer et trier les projets
  const filteredAndSortedProjects = () => {
    let result = [...projects];
    
    // Filtrage par recherche
    if (searchTerm) {
      result = result.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Tri
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.created_at - a.created_at;
      } else if (sortBy === 'oldest') {
        return a.created_at - b.created_at;
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    
    return result;
  };
  
  const filteredProjects = filteredAndSortedProjects();

  // Créer un nouveau projet
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProjectTitle.trim()) {
      toast.error("Le titre du projet est requis");
      return;
    }

    try {
      setCreating(true);
      const newProject = await projectApi.createProject({
        title: newProjectTitle,
        description: newProjectDescription,
      });
      
      setProjects([newProject, ...projects]);
      setShowNewProjectModal(false);
      setNewProjectTitle("");
      setNewProjectDescription("");
      
      // Rediriger vers le nouveau projet
      navigate(`/project/${newProject.id}`);
      
      toast.success("Projet créé avec succès");
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      toast.error("Impossible de créer le projet");
    } finally {
      setCreating(false);
    }
  };

  // Supprimer un projet
  const handleDeleteProject = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      try {
        await projectApi.deleteProject(projectId);
        setProjects(projects.filter((project) => project.id !== projectId));
        toast.success("Projet supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression du projet:", error);
        toast.error("Impossible de supprimer le projet");
      }
    }
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

  // Générer une couleur aléatoire cohérente basée sur le titre du projet
  const getProjectColor = (title) => {
    const colors = [
      'from-primary-500 to-primary-600',
      'from-secondary-500 to-secondary-600',
      'from-accent-500 to-accent-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-indigo-500 to-indigo-600',
      'from-rose-500 to-rose-600',
      'from-purple-500 to-purple-600',
    ];
    
    // Calculer un index basé sur la somme des codes de caractères
    const sum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-light-100 mb-1">
            Mes projets
          </h1>
          <p className="text-dark-600 dark:text-dark-300">
            Organisez votre travail en projets structurés
          </p>
        </div>
        
        <button
          onClick={() => setShowNewProjectModal(true)}
          data-action="open-modal"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm font-medium"
        >
          <FolderPlus size={18} />
          <span>Nouveau projet</span>
        </button>
      </div>
      
      {/* Search and filters bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-dark-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2.5 border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Filters dropdown */}
          <div ref={filtersRef} className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2.5 border border-dark-300 dark:border-dark-600 rounded-lg flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300 transition-colors shadow-sm"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Trier</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-md border border-dark-200/50 dark:border-dark-700/50 z-10 overflow-hidden">
                <div className="p-3 border-b border-dark-200 dark:border-dark-700">
                  <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                    Trier par
                  </h3>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                      sortBy === 'newest' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                    }`}
                  >
                    <Clock size={16} />
                    <span>Les plus récents</span>
                  </button>
                  
                  <button
                    onClick={() => setSortBy('oldest')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                      sortBy === 'oldest' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                    }`}
                  >
                    <Clock size={16} />
                    <span>Les plus anciens</span>
                  </button>
                  
                  <button
                    onClick={() => setSortBy('alphabetical')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                      sortBy === 'alphabetical' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                    }`}
                  >
                    <Files size={16} />
                    <span>Alphabétique</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* View mode toggle */}
          <div className="flex border border-dark-300 dark:border-dark-600 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
              }`}
              aria-label="Vue en grille"
            >
              <LayoutGrid size={18} />
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 flex items-center justify-center ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
              }`}
              aria-label="Vue en liste"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Projects content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader size={32} className="animate-spin text-primary-500 mb-4" />
          <p className="text-dark-600 dark:text-dark-400">
            Chargement des projets...
          </p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <>
          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="group bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 hover:shadow-medium transition-shadow overflow-hidden flex flex-col h-full"
                >
                  {/* Project header with gradient */}
                  <div className={`h-24 bg-gradient-to-r ${getProjectColor(project.title)} flex items-center justify-center p-4 relative`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <FolderOpen size={48} className="text-white/90" />
                    </div>
                    
                    {/* Delete button (top-right corner) */}
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 text-white/90 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Supprimer le projet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* Project content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-dark-800 dark:text-light-200 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {project.title}
                    </h3>
                    
                    {project.description ? (
                      <p className="text-dark-600 dark:text-dark-400 text-sm line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-dark-500 dark:text-dark-500 text-sm italic mb-3">
                        Aucune description
                      </p>
                    )}
                    
                    <div className="mt-auto text-sm text-dark-500 dark:text-dark-400 flex items-center">
                      <CalendarDays size={14} className="mr-1.5" />
                      <span>Créé le {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* List view */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-200 dark:divide-dark-700">
                  <thead className="bg-light-100 dark:bg-dark-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Projet
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Date de création
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-dark-200 dark:divide-dark-700">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-light-100 dark:hover:bg-dark-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            to={`/project/${project.id}`}
                            className="flex items-center group"
                          >
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${getProjectColor(project.title)} flex items-center justify-center mr-3 shadow-sm`}>
                              <Folder size={20} className="text-white" />
                            </div>
                            <div className="font-medium text-dark-900 dark:text-light-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {project.title}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-dark-600 dark:text-dark-400 truncate max-w-xs">
                            {project.description || <span className="text-dark-500 dark:text-dark-500 italic">Aucune description</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-dark-600 dark:text-dark-400">
                            {formatDate(project.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <Link
                              to={`/project/${project.id}`}
                              className="p-1.5 text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                              aria-label="Voir le projet"
                            >
                              <FolderOpen size={18} />
                            </Link>
                            
                            <button
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className="p-1.5 text-dark-500 hover:text-red-600 dark:text-dark-400 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                              aria-label="Supprimer le projet"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center mb-4">
            <FolderOpen size={32} className="text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 dark:text-light-100 mb-1">
            {searchTerm ? "Aucun projet trouvé" : "Vous n'avez pas encore de projets"}
          </h3>
          <p className="text-dark-600 dark:text-dark-400 max-w-md mb-6">
            {searchTerm 
              ? "Aucun projet ne correspond à votre recherche." 
              : "Créez votre premier projet pour commencer à organiser votre travail."
            }
          </p>
          
          {!searchTerm && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              data-action="open-modal"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <FolderPlus size={18} />
              <span>Créer un projet</span>
            </button>
          )}
        </div>
      )}
      
      {/* Modal de création de projet */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={modalRef} className="bg-white dark:bg-dark-800 rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-dark-900 dark:text-light-100">
                Nouveau projet
              </h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-1 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 rounded-full hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-4">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1"
                  >
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg shadow-sm bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nom du projet"
                    required
                  />
                </div>
                
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-dark-300 dark:border-dark-600 rounded-lg shadow-sm bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Description du projet (optionnelle)"
                  />
                </div>
                
                <div className="flex items-center pt-2">
                  <div className="flex h-5 items-center">
                    <input
                      id="template"
                      name="template"
                      type="checkbox"
                      className="h-4 w-4 rounded border-dark-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="template" className="text-sm text-dark-700 dark:text-dark-300">
                      Utiliser un modèle de projet
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                    <ClipboardList size={20} />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-dark-900 dark:text-light-200">
                      Structure recommandée
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      Initialiser avec des sections prédéfinies
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={creating || !newProjectTitle.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus size={16} />
                      <span>Créer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;