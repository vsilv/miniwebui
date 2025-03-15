// frontend/src/api/urlHelper.js

/**
 * S'assure qu'une URL d'API se termine par un slash pour éviter les redirections 307
 * @param {string} url - L'URL à formater
 * @returns {string} - L'URL correctement formatée
 */
export const ensureTrailingSlash = (url) => {
    // Si l'URL est vide ou undefined, retourner une chaîne vide
    if (!url) return '';
    
    // Si l'URL contient déjà des paramètres de requête, ne pas ajouter de slash
    if (url.includes('?')) return url;
    
    // Ajouter un slash à la fin si nécessaire
    return url.endsWith('/') ? url : `${url}/`;
  };
  
  export default {
    ensureTrailingSlash
  };