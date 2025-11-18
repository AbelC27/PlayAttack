export const clearAllAuthData = () => {
  // Clear session storage
  sessionStorage.clear();
  
  // Clear Supabase auth from local storage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });
};