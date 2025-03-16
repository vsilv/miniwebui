// src/api/project.js
import api from './config';

/**
 * Récupérer la liste des projets
 * @returns {Promise<Array>} Liste des projets
 */
export const getProjects = async () => {
  try {
    return await api.get('project').json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Récupérer un projet par son ID
 * @param {string} projectId ID du projet
 * @returns {Promise<Object>} Détails du projet
 */
export const getProjectById = async (projectId) => {
  try {
    return await api.get(`project/${projectId}`).json();
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Créer un nouveau projet
 * @param {Object} projectData Données du projet (title, description)
 * @returns {Promise<Object>} Projet créé
 */
export const createProject = async (projectData) => {
  try {
    return await api.post('project', { json: projectData }).json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Mettre à jour un projet
 * @param {string} projectId ID du projet
 * @param {Object} projectData Données à mettre à jour (title, description, instructions)
 * @returns {Promise<Object>} Projet mis à jour
 */
export const updateProject = async (projectId, projectData) => {
  try {
    return await api.put(`project/${projectId}`, { json: projectData }).json();
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Supprimer un projet
 * @param {string} projectId ID du projet
 * @returns {Promise<Object>} Réponse de confirmation
 */
export const deleteProject = async (projectId) => {
  try {
    return await api.delete(`project/${projectId}`).json();
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Télécharger un fichier pour un projet
 * @param {string} projectId ID du projet
 * @param {File} file Fichier à télécharger
 * @returns {Promise<Object>} Informations sur le fichier téléchargé
 */
export const uploadProjectFile = async (projectId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    return await api.post(`project/${projectId}/file`, {
      body: formData,
    }).json();
  } catch (error) {
    console.error(`Error uploading file to project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Supprimer un fichier de projet
 * @param {string} projectId ID du projet
 * @param {string} fileId ID du fichier
 * @returns {Promise<Object>} Réponse de confirmation
 */
export const deleteProjectFile = async (projectId, fileId) => {
  try {
    return await api.delete(`project/${projectId}/file/${fileId}`).json();
  } catch (error) {
    console.error(`Error deleting file ${fileId} from project ${projectId}:`, error);
    throw error;
  }
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectFile,
  deleteProjectFile
};
