import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useStore } from '@nanostores/react';
import { 
  Upload, Search, FileText, Trash2, Download,
  File, FilePlus, Loader, AlertCircle
} from 'lucide-react';
import { 
  documents, isLoadingDocuments, fetchDocuments, 
  uploadDocument, deleteDocument, downloadDocument 
} from '../store/knowledgeStore';

const Knowledge = () => {
  const $documents = useStore(documents);
  const $isLoading = useStore(isLoadingDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Filtrer les documents en fonction de la recherche
  const filteredDocuments = $documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Charger les documents au démarrage
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Gérer le changement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Utiliser le nom du fichier comme titre par défaut (sans l'extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setUploadTitle(fileName);
    }
  };
  
  // Soumettre le formulaire d'upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadTitle.trim() || !selectedFile) {
      toast.error('Veuillez fournir un titre et un fichier');
      return;
    }
    
    try {
      setIsUploading(true);
      await uploadDocument(uploadTitle, selectedFile);
      
      // Réinitialiser le formulaire
      setUploadTitle('');
      setSelectedFile(null);
      fileInputRef.current.value = '';
      setShowUploadForm(false);
      
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      toast.error('Erreur lors du téléchargement du document');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Supprimer un document
  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await deleteDocument(documentId);
        toast.success('Document supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
        toast.error('Erreur lors de la suppression du document');
      }
    }
  };
  
  // Télécharger un document
  const handleDownloadDocument = (documentId) => {
    downloadDocument(documentId);
  };
  
  // Afficher les extensions de fichier supportées
  const supportedExtensions = ['.pdf', '.docx', '.txt', '.csv'];
  
  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Base de connaissances
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos documents pour enrichir le contexte des conversations
        </p>
      </div>
      
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
        >
          <FilePlus size={18} />
          <span>Ajouter un document</span>
        </button>
      </div>
      
      {/* Upload form */}
      {showUploadForm && (
        <div className="mb-8 p-4 bg-white dark:bg-dark-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Télécharger un nouveau document
          </h2>
          
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre du document
              </label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Titre du document"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichier ({supportedExtensions.join(', ')})
              </label>
              
              <div className="relative border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <File size={24} className="text-primary-500 mr-2" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadTitle('');
                        fileInputRef.current.value = '';
                      }}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary-600 dark:text-primary-400 hover:underline">Choisir un fichier</span>
                        <span className="text-gray-600 dark:text-gray-400"> ou glisser-déposer</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {supportedExtensions.join(', ')} jusqu'à 10 MB
                      </p>
                    </div>
                  </div>
                )}
                
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.csv"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700"
                disabled={isUploading}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={!selectedFile || !uploadTitle.trim() || isUploading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Télécharger</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Documents list */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Documents
          </h2>
        </div>
        
        {$isLoading ? (
          <div className="p-8 text-center">
            <Loader size={24} className="animate-spin mx-auto mb-2 text-primary-500" />
            <p className="text-gray-600 dark:text-gray-400">
              Chargement des documents...
            </p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taille
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date d'ajout
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText size={18} className="text-primary-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.metadata?.file_type || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.metadata?.file_size 
                          ? formatFileSize(doc.metadata.file_size) 
                          : '-'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          aria-label="Download document"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Delete document"
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
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-dark-700 mb-4">
              <AlertCircle size={24} className="text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              Aucun document trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Aucun document ne correspond à votre recherche.' 
                : 'Commencez par ajouter des documents à votre base de connaissances.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;