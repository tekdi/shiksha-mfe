
export const likeService = {
  toggleLike: async (
    contentId: string,
    userId: string,
    isLiked: boolean,
    entityType: string = "content"
  ): Promise<boolean> => {
    const action = isLiked ? "remove" : "add";
    
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/todo/bookmark/create`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          entityType,
          doId: contentId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.statusText}`);
      }

      const result = await response.json();
      // console.log(`[API] Toggled like for ${contentId} (${entityType}):`, result);
      
      // We return the new state if successful
      return !isLiked;
    } catch (error) {
      console.error("Error in toggleLike API:", error);
      throw error;
    }
  },

  getBookmarks: async (
    userId: string,
    entityType: string = "content"
  ): Promise<string[]> => {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/todo/bookmark/read?userId=${userId}&entityType=${entityType}`;

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
      }

      const result = await response.json();
      // console.log(`[API] Fetched bookmarks response for ${userId} (${entityType}):`, JSON.stringify(result));
      
      let bookmarkList: any[] = [];

      // Handle various response structures
      if (Array.isArray(result?.result)) {
         bookmarkList = result.result;
      } else if (Array.isArray(result?.data)) {
         bookmarkList = result.data;
      } else if (Array.isArray(result)) {
         bookmarkList = result;
      } else if (Array.isArray(result?.result?.data)) {
          bookmarkList = result.result.data;
      } else if (Array.isArray(result?.result?.bookmarks)) {
          bookmarkList = result.result.bookmarks;
      }

      // console.log(`[API] Raw bookmark list found (count: ${bookmarkList.length}):`, bookmarkList);

      const ids = bookmarkList
        .map((item: any) => {
           const id = item.doId || item.contentId || item.identifier || item.id;
           return id ? String(id) : null;
        })
        .filter((id): id is string => id !== null);

      // console.log(`[API] Parsed bookmark IDs (count: ${ids.length}):`, ids);
      return ids;
    } catch (error) {
      console.error("❌ Error in getBookmarks API:", error);
      return [];
    }
  },
};
