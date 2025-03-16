// frontend/src/pages/Knowledge.jsx
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useStore } from '@nanostores/react';
import { 
  Upload, 
  Search, 
  FileText, 
  Trash2, 
  Download,
  File, 
  FilePlus, 
  Loader, 
  AlertCircle,
  Plus,
  LayoutGrid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  AlignLeft,
  Paperclip,
  XCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  documents, 
  isLoadingDocuments, 
  fetchDocuments, 
  uploadDocument, 
  deleteDocument, 
  downloadDocument 
} from '../store/knowledgeStore';

const Knowledge = () => {
  const $documents = useStore(documents);
  const $isLoading = useStore(isLoadingDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'name'
  const [documentType, setDocumentType] = useState('all'); // 'all', 'pdf', 'docx', 'txt'
  const [showFilters, setShowFilters] = useState(false);
  
  const fileInputRef = useRef(null);
  const filtersRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Supporter les extensions de fichier
  const supportedExtensions = ['.pdf', '.docx', '.txt', '.csv'];
  const fileTypeIcons = {
    '.pdf': <FileText size={20} className="text-red-500" />,
    '.docx': <FileText size={20} className="text-blue-500" />,
    '.txt': <AlignLeft size={20} className="text-green-500" />,
    '.csv': <AlignLeft size={20} className="text-amber-500" />,
  };

  // Gérer les clics en dehors des filtres pour les fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filtrer les documents en fonction de la recherche
  const getFilteredDocuments = () => {
    let filtered = [...$documents];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par type de document
    if (documentType !== 'all') {
      filtered = filtered.filter(doc => {
        const fileType = doc.metadata?.file_type || '';
        return fileType.includes(documentType);
      });
    }
    
    // Trier les documents
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.created_at - a.created_at;
      } else if (sortOrder === 'oldest') {
        return a.created_at - b.created_at;
      } else if (sortOrder === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    
    return filtered;
  };
  
  const filteredDocuments = getFilteredDocuments();
  
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
  
  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  // Formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Obtenir l'icône pour un type de fichier
  const getFileTypeIcon = (fileType) => {
    const extension = fileType ? fileType.toLowerCase() : '';
    return fileTypeIcons[extension] || <File size={20} className="text-dark-400" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-light-100 mb-1">
            Base de connaissances
          </h1>
          <p className="text-dark-600 dark:text-dark-300">
            Gérez vos documents pour enrichir le contexte des conversations
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm font-medium"
          >
            <FilePlus size={18} />
            <span>Ajouter un document</span>
          </button>
        </div>
      </div>
      
      {/* Upload form */}
      {showUploadForm && (
        <div className="mb-8 p-6 bg-white dark:bg-dark-800 rounded-xl shadow-md border border-light-300/50 dark:border-dark-700/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-display font-semibold text-dark-800 dark:text-light-200">
              Télécharger un nouveau document
            </h2>
            <button
              onClick={() => setShowUploadForm(false)}
              className="p-1 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 rounded-full hover:bg-dark-100 dark:hover:bg-dark-700"
            >
              <XCircle size={20} />
            </button>
          </div>
          
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Titre du document
              </label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-3 border border-dark-300 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Titre du document"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Fichier ({supportedExtensions.join(', ')})
              </label>
              
              <div className="relative border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-xl p-8 text-center">
                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 dark:text-primary-400">
                      {getFileTypeIcon(`.${selectedFile.name.split('.').pop()}`)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-dark-900 dark:text-light-100">{selectedFile.name}</p>
                      <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadTitle('');
                        fileInputRef.current.value = '';
                      }}
                      className="mt-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto h-14 w-14 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-dark-500 dark:text-dark-400" />
                    </div>
                    <div className="text-center">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Choisir un fichier</span>
                        <span className="text-dark-600 dark:text-dark-400"> ou glisser-déposer</span>
                      </label>
                      <p className="text-xs text-dark-500 dark:text-dark-400 mt-2">
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
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2.5 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                disabled={isUploading}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={!selectedFile || !uploadTitle.trim() || isUploading}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Télécharger</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-dark-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-10 pr-4 py-2.5 border border-dark-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Filters dropdown */}
          <div ref={filtersRef} className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2.5 border border-dark-300 dark:border-dark-600 rounded-lg flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300 transition-colors"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filtres</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-md border border-dark-200/50 dark:border-dark-700/50 z-10">
                <div className="p-3 border-b border-dark-200 dark:border-dark-700">
                  <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                    Type de document
                  </h3>
                </div>
                
                <div className="p-2">
                  <div className="space-y-1.5">
                    {['all', 'pdf', 'docx', 'txt', 'csv'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setDocumentType(type)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center ${
                          documentType === type 
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                        }`}
                      >
                        {type === 'all' ? 'Tous les types' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 border-t border-b border-dark-200 dark:border-dark-700">
                  <h3 className="font-medium text-dark-800 dark:text-light-200 text-sm">
                    Trier par
                  </h3>
                </div>
                
                <div className="p-2">
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSortOrder('newest')}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                        sortOrder === 'newest' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                      }`}
                    >
                      <Clock size={16} />
                      <span>Les plus récents</span>
                    </button>
                    
                    <button
                      onClick={() => setSortOrder('oldest')}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                        sortOrder === 'oldest' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                      }`}
                    >
                      <Clock size={16} />
                      <span>Les plus anciens</span>
                    </button>
                    
                    <button
                      onClick={() => setSortOrder('name')}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                        sortOrder === 'name' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                      }`}
                    >
                      <AlignLeft size={16} />
                      <span>Nom (A-Z)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* View mode buttons */}
          <div className="flex border border-dark-300 dark:border-dark-600 rounded-lg overflow-hidden">
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
      
      {/* Document list */}
      {$isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader size={32} className="animate-spin text-primary-500 mb-4" />
          <p className="text-dark-600 dark:text-dark-400">
            Chargement des documents...
          </p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <>
          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/50 dark:border-dark-700/50 overflow-hidden flex flex-col h-full"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          {getFileTypeIcon(doc.metadata?.file_type)}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-dark-800 dark:text-light-200 line-clamp-1 mb-0.5">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-dark-500">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {doc.metadata?.file_size && (
                      <div className="flex items-center gap-1 mt-4 text-sm text-dark-500 dark:text-dark-400">
                        <Paperclip size={14} />
                        <span>{formatFileSize(doc.metadata.file_size)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-5 py-3 border-t border-light-300/30 dark:border-dark-700/50 bg-light-100/50 dark:bg-dark-900/30 flex justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadDocument(doc.id)}
                        className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                        aria-label="Télécharger le document"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-dark-500 hover:text-red-600 dark:text-dark-400 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                      aria-label="Supprimer le document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
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
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Taille
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Date d'ajout
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-dark-200 dark:divide-dark-700">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-light-100 dark:hover:bg-dark-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                              {getFileTypeIcon(doc.metadata?.file_type)}
                            </div>
                            <div className="font-medium text-dark-900 dark:text-light-200 truncate max-w-sm">
                              {doc.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-dark-600 dark:text-dark-400">
                            {doc.metadata?.file_type?.toUpperCase() || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-dark-600 dark:text-dark-400">
                            {doc.metadata?.file_size 
                              ? formatFileSize(doc.metadata.file_size) 
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-dark-600 dark:text-dark-400">
                            {formatDate(doc.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => handleDownloadDocument(doc.id)}
                              className="p-1.5 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                              aria-label="Télécharger le document"
                            >
                              <Download size={18} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-dark-500 hover:text-red-600 dark:text-dark-400 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors"
                              aria-label="Supprimer le document"
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
            <AlertCircle size={32} className="text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 dark:text-light-100 mb-1">
            Aucun document trouvé
          </h3>
          <p className="text-dark-600 dark:text-dark-400 max-w-md mb-6">
            {searchTerm 
              ? 'Aucun document ne correspond à votre recherche.' 
              : 'Commencez par ajouter des documents à votre base de connaissances.'
            }
          </p>
          
          {!searchTerm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Ajouter un document</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Knowledge;