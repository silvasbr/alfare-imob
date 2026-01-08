
export const metaService = {
  getAccountStatus: async () => ({ connected: !!localStorage.getItem('meta_token') }),
  publishToInstagram: async (url: string, caption: string) => {
    console.log('Publicando...', { url, caption });
    return { success: true };
  }
};
