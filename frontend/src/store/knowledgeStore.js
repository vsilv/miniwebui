import { atom } from 'nanostores';
import api from '../api/config';

// Store pour les connaissances
export const documents = atom([]);
export const isLoadingDocuments = atom(false);
export const searchResults = atom([]);
export const isSearching = atom(false);

// Fonction pour récupérer les documents
export const fetchDocuments = async () => {
  try {
    isLoadingDocuments.set(true);
    const response = await api.get('knowledge/documents').json();
    documents.set(response);
    isLoadingDocuments.set(false);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    isLoadingDocuments.set(false);
    return [];
  }
};

// Fonction pour uploader un document
export const uploadDocument = async (title, file) => {
  try {
    isLoadingDocuments.set(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await api.post('knowledge/documents', { body: formData }).json();

    // Mettre à jour la liste des documents
    const currentDocs = documents.get();
    documents.set([response, ...currentDocs]);

    isLoadingDocuments.set(false);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error);
    isLoadingDocuments.set(false);
    throw error;
  }
};

// Fonction pour supprimer un document
export const deleteDocument = async (documentId) => {
  try {
    isLoadingDocuments.set(true);
    await api.delete(`knowledge/documents/${documentId}`);

    // Mettre à jour la liste des documents
    const updatedDocs = documents.get().filter(doc => doc.id !== documentId);
    documents.set(updatedDocs);
    
    isLoadingDocuments.set(false);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du document ${documentId}:`, error);
    isLoadingDocuments.set(false);
    throw error;
  }
};

// Fonction pour télécharger un document
export const downloadDocument = (documentId) => {
  window.open(`/api/knowledge/documents/${documentId}/download`, '_blank');
};

// Fonction pour rechercher dans les documents
export const searchDocuments = async (query, limit = 5) => {
  try {
    isSearching.set(true);
    
    const response = await api.post('knowledge/search', {
      json: {
        query,
        limit
      }
    }).json();
    
    searchResults.set(response);
    isSearching.set(false);
    return response;
  } catch (error) {
    console.error('Erreur lors de la recherche dans les documents:', error);
    isSearching.set(false);
    return [];
  }
};
