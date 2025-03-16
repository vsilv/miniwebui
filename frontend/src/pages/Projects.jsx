import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Folder, Search, Trash2, Edit2 } from "lucide-react";
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

  // Filtrer les projets en fonction de la recherche
  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* En-tête */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projets
          </h1>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
          >
            <PlusCircle size={18} />
            <span>Nouveau projet</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Liste des projets */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block bg-white dark:bg-dark-800 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Folder
                        size={24}
                        className="text-primary-600 dark:text-primary-500"
                      />
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {project.title}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
                        aria-label="Supprimer le projet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Créé le {formatDate(project.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Folder size={48} className="mb-2 opacity-50" />
            {searchTerm ? (
              <p>Aucun projet ne correspond à votre recherche</p>
            ) : (
              <>
                <p className="mb-2">Vous n'avez pas encore de projets</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 mt-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <PlusCircle size={18} />
                  <span>Créer un projet</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de création de projet */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Nouveau projet
              </h2>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="p-4 space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectTitle.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Création en cours..." : "Créer"}
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
