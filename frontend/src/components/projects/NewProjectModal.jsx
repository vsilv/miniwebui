// src/components/projects/NewProjectModal.jsx
import React, { useState } from 'react';
import { X, Loader, FolderPlus, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import projectApi from '../../api/project';
import Modal from '../ui/Modal';

const NewProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

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
      
      // Réinitialiser les champs
      setNewProjectTitle("");
      setNewProjectDescription("");
      
      // Fermer le modal et informer le parent
      onClose();
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      toast.success("Projet créé avec succès");
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      toast.error("Impossible de créer le projet");
    } finally {
      setCreating(false);
    }
  };

  // Footer buttons
  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="btn"
      >
        Annuler
      </button>
      
      <button
        type="submit"
        form="new-project-form"
        disabled={creating || !newProjectTitle.trim()}
        className="btn btn-primary"
      >
        {creating ? (
          <>
            <Loader size={16} className="animate-spin mr-2" />
            <span>Création en cours...</span>
          </>
        ) : (
          <>
            <FolderPlus size={16} className="mr-2" />
            <span>Créer</span>
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal
      id="new-project-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau projet"
      footer={footer}
      size="md"
    >
      <form id="new-project-form" onSubmit={handleCreateProject} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium mb-1"
          >
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Nom du projet"
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            rows={3}
            className="textarea textarea-bordered w-full"
            placeholder="Description du projet (optionnelle)"
          />
        </div>
        
        <div className="flex items-center">
          <div className="flex h-5 items-center">
            <input
              id="template"
              name="template"
              type="checkbox"
              className="checkbox"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="template" className="text-sm">
              Utiliser un modèle de projet
            </label>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
            <ClipboardList size={20} />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium">
              Structure recommandée
            </div>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              Initialiser avec des sections prédéfinies
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewProjectModal;