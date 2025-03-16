import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, Upload, FileText, Image, FileIcon, X } from "lucide-react";
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

  // Obtenir l'icône pour un type de fichier
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <Image size={20} />;
      case "pdf":
        return <FileText size={20} />;
      default:
        return <FileIcon size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête du projet */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Titre
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateProject}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                {project.description && (
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-3 py-1.5 border border-red-300 dark:border-red-800 rounded-md text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu du projet */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instructions */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Instructions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ajoutez des instructions spécifiques pour ce projet
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700"
                placeholder="Ajoutez des instructions pour ce projet..."
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>

          {/* Fichiers */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Fichiers
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gérez les fichiers associés à ce projet
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-dark-600 border-dashed rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  <div className="flex items-center space-x-2">
                    <Upload size={18} />
                    <span>Télécharger un fichier</span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="mb-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Téléchargement en cours...
                  </span>
                </div>
              )}

              {files.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-dark-700">
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.file_type)}
                        <span className="text-sm text-gray-900 dark:text-gray-200">
                          {file.filename}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Aucun fichier téléchargé
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
