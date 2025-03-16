import React, { useState, useRef } from 'react';
import { X, Search, Upload, FileText, Check, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadDocument } from '../../store/knowledgeStore';

const DocumentSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  documents = [],
  selectedDocs = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [localSelectedDocs, setLocalSelectedDocs] = useState(selectedDocs);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  
  // Filter documents based on search term
  const filteredDocuments = searchTerm 
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : documents;
  
  // Check if a document is selected
  const isDocSelected = (docId) => {
    return localSelectedDocs.some(doc => doc.id === docId);
  };
  
  // Toggle document selection
  const toggleDocSelection = (doc) => {
    if (isDocSelected(doc.id)) {
      setLocalSelectedDocs(prev => prev.filter(d => d.id !== doc.id));
    } else {
      setLocalSelectedDocs(prev => [...prev, doc]);
    }
  };
  
  // Handle confirm selection
  const handleConfirm = () => {
    onSelect(localSelectedDocs);
  };
  
  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Set default title from filename (without extension)
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setUploadTitle(fileName);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file || !uploadTitle.trim()) {
      toast.error('Veuillez sélectionner un fichier et donner un titre');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const uploadedDoc = await uploadDocument(uploadTitle, file);
      toast.success('Document téléchargé avec succès');
      
      // Add to selected documents
      setLocalSelectedDocs(prev => [...prev, uploadedDoc]);
      
      // Reset form
      setFile(null);
      setUploadTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du document');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Format file size display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Sélectionner des documents
          </h3>
          <button
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search */}
          <div className="relative mb-6">
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
          
          {/* Upload form */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Importer un nouveau document
            </h4>
            
            <div className="mb-3">
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Titre du document"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 relative border border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-3 text-center">
                {file ? (
                  <div className="flex items-center">
                    <FileText size={18} className="text-primary-500 mr-2" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[250px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="ml-auto text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <span className="text-primary-600 dark:text-primary-400 hover:underline">Choisir un fichier</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF, DOCX, TXT (max. 10 MB)
                    </p>
                    <input
                      id="document-upload"
                      ref={fileInputRef}
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt,.csv"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={!file || !uploadTitle.trim() || isUploading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    <span>Importation...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    <span>Importer</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Documents list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Documents disponibles
            </h4>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Aucun document ne correspond à votre recherche' : 'Aucun document disponible'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {filteredDocuments.map(doc => (
                  <div 
                    key={doc.id}
                    className={`flex items-center py-3 px-4 cursor-pointer rounded-md ${
                      isDocSelected(doc.id) 
                        ? 'bg-primary-50 dark:bg-primary-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => toggleDocSelection(doc)}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isDocSelected(doc.id) 
                        ? 'bg-primary-500 border-primary-500' 
                        : 'border-gray-300 dark:border-dark-600'
                    }`}>
                      {isDocSelected(doc.id) && <Check size={12} className="text-white" />}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.metadata?.file_type || '.txt'} • {doc.metadata?.file_size ? formatFileSize(doc.metadata.file_size) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700"
            onClick={onClose}
          >
            Annuler
          </button>
          
          <button
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
            onClick={handleConfirm}
          >
            Confirmer ({localSelectedDocs.length} sélectionné{localSelectedDocs.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelectionModal;