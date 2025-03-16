// frontend/src/components/ui/Modal.jsx
import React, { useEffect } from 'react';

/**
 * Un composant Modal réutilisable basé sur DaisyUI
 * 
 * @param {Object} props
 * @param {string} props.id - ID unique pour la modale
 * @param {boolean} props.isOpen - État d'ouverture de la modale
 * @param {Function} props.onClose - Fonction appelée à la fermeture
 * @param {React.ReactNode} props.title - Titre de la modale (optionnel)
 * @param {React.ReactNode} props.children - Contenu de la modale
 * @param {React.ReactNode} props.footer - Pied de page de la modale (optionnel)
 * @param {string} props.size - Taille de la modale ('sm', 'md', 'lg', 'xl')
 * @param {boolean} props.closeOnClickOutside - Fermer la modale au clic à l'extérieur
 */
const Modal = ({ 
  id, 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  closeOnClickOutside = true 
}) => {
  // Référence au dialog
  const dialogRef = React.useRef(null);
  
  // Définir les classes de taille
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full'
  };
  
  const maxWidthClass = sizeClasses[size] || sizeClasses.md;
  
  // Ouvrir/fermer la modale en fonction de isOpen
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);
  
  // Ajouter un gestionnaire d'événements pour la fermeture
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    const handleClose = () => {
      if (onClose) onClose();
    };
    
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog 
      id={id} 
      ref={dialogRef} 
      className={`modal ${isOpen ? 'modal-open' : ''}`}
    >
      <div className={`modal-box ${maxWidthClass} relative`}>
        {title && (
          <h3 className="font-bold text-lg mb-4">{title}</h3>
        )}
        
        {/* Bouton de fermeture */}
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        
        {/* Contenu */}
        <div>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="modal-action">
            {footer}
          </div>
        )}
      </div>
      
      {/* Backdrop pour fermer en cliquant à l'extérieur */}
      {closeOnClickOutside && (
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      )}
    </dialog>
  );
};

export default Modal;