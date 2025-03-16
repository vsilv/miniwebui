// src/store/knowledgeStore.js
import { atom } from 'nanostores';
import api from '../api/config';

// Store for knowledge base
export const documents = atom([]);
export const isLoadingDocuments = atom(false);
export const searchResults = atom([]);
export const isSearching = atom(false);

// Fetch documents
export const fetchDocuments = async () => {
  try {
    isLoadingDocuments.set(true);
    const response = await api.get('knowledge/documents').json();
    documents.set(response);
    isLoadingDocuments.set(false);
    return response;
  } catch (error) {
    console.error('Error fetching documents:', error);
    isLoadingDocuments.set(false);
    return [];
  }
};

// Upload a document
export const uploadDocument = async (title, file) => {
  try {
    isLoadingDocuments.set(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await api.post('knowledge/documents', { body: formData }).json();

    // Update documents list
    const currentDocs = documents.get();
    documents.set([response, ...currentDocs]);

    isLoadingDocuments.set(false);
    return response;
  } catch (error) {
    console.error('Error uploading document:', error);
    isLoadingDocuments.set(false);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (documentId) => {
  try {
    isLoadingDocuments.set(true);
    await api.delete(`knowledge/documents/${documentId}`);

    // Update documents list
    const updatedDocs = documents.get().filter(doc => doc.id !== documentId);
    documents.set(updatedDocs);
    
    isLoadingDocuments.set(false);
    return true;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    isLoadingDocuments.set(false);
    throw error;
  }
};

// Download a document
export const downloadDocument = (documentId) => {
  window.open(`/api/knowledge/documents/${documentId}/download`, '_blank');
};

// Search documents
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
    console.error('Error searching documents:', error);
    isSearching.set(false);
    return [];
  }
};