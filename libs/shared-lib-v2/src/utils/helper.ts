export interface trackDataPorps {
  courseId: string;
  status: string;
  percentage: string | number;
  completed: number;
  completed_list: string[];
  in_progress: number;
  in_progress_list: string[];
}
export function calculateCourseStatus({
  statusData,
  allCourseIds,
  courseId,
}: {
  statusData: { completed_list: string[]; in_progress_list: string[] };
  allCourseIds: string[];
  courseId: string;
}): trackDataPorps {
  // Convert to Sets for faster lookup
  const completedList = new Set(
    statusData.completed_list?.map((id) => id.trim()) || []
  );
  const inProgressList = new Set(
    statusData.in_progress_list?.map((id) => id.trim()) || []
  );

  // Initialize counters
  let completedCount = 0;
  let inProgressCount = 0;
  const completed_list: string[] = [];
  const in_progress_list: string[] = [];



  // Check each course ID
  for (const id of allCourseIds.map((id) => id.trim())) {
    if (completedList.has(id)) {
      completedCount++;
      completed_list.push(id);
    } else if (inProgressList.has(id)) {
      inProgressCount++;
      in_progress_list.push(id);
    }
  }

  const total = allCourseIds.length;
  let status = "";
  
  console.log("[calculateCourseStatus] Input:", {
    courseId,
    totalCourseIds: total,
    allCourseIds: allCourseIds.slice(0, 5), // Show first 5 for debugging
    statusDataCompleted: statusData.completed_list?.length || 0,
    statusDataInProgress: statusData.in_progress_list?.length || 0,
    statusDataCompletedList: statusData.completed_list?.slice(0, 5),
    statusDataInProgressList: statusData.in_progress_list?.slice(0, 5),
  });
  
  // Determine status
  if (total === 0) {
    status = "not started";
  } else if (completedCount === total) {
    status = "completed";
  } else if (completedCount > 0 || inProgressCount > 0) {
    status = "in progress";
  }

  // Calculate percentage - include both completed and in-progress items
  // For in-progress items, count them as 50% progress
  // Formula: (completed * 100 + in_progress * 50) / total
  let percentage = 0;
  if (total > 0) {
    const completedPercentage = (completedCount / total) * 100;
    const inProgressPercentage = (inProgressCount / total) * 50; // In-progress counts as 50%
    percentage = Math.round(completedPercentage + inProgressPercentage);
    // Ensure percentage doesn't exceed 100%
    percentage = Math.min(100, percentage);
  }

  // console.log("[calculateCourseStatus] Output:", {
  //   status,
  //   completed: completedCount,
  //   in_progress: inProgressCount,
  //   total,
  //   percentage,
  //   completed_list: completed_list.slice(0, 5),
  //   in_progress_list: in_progress_list.slice(0, 5),
  // });

  return {
    completed_list,
    in_progress_list,
    completed: completedCount,
    in_progress: inProgressCount,
    courseId,
    status,
    percentage,
  };
}
export const calculateTrackData = (newTrack: any, children: any) => {
  const newTrackData = children?.map((item: any) => {
    return calculateTrackDataItem(newTrack, item);
  });
  return newTrackData;
};

export const calculateTrackDataItem = (newTrack: any, item: any) => {
  // console.log("[calculateTrackDataItem] Input:", {
  //   newTrack: {
  //     courseId: newTrack?.courseId,
  //     hasCompletedList: !!newTrack?.completed_list,
  //     hasInProgressList: !!newTrack?.in_progress_list,
  //     completedListLength: newTrack?.completed_list?.length || 0,
  //     inProgressListLength: newTrack?.in_progress_list?.length || 0,
  //     completedListSample: newTrack?.completed_list?.slice(0, 3),
  //     inProgressListSample: newTrack?.in_progress_list?.slice(0, 3),
  //   },
  //   item: {
  //     identifier: item?.identifier,
  //     mimeType: item?.mimeType,
  //     hasLeafNodes: !!item?.leafNodes,
  //     leafNodesLength: item?.leafNodes?.length || 0,
  //     leafNodesSample: item?.leafNodes?.slice(0, 3),
  //   },
  // });

  // Ensure newTrack has the expected structure
  const statusData = {
    completed_list: newTrack?.completed_list || [],
    in_progress_list: newTrack?.in_progress_list || [],
  };

  if (item?.mimeType === "application/vnd.ekstep.content-collection") {
    const allCourseIds = item?.leafNodes ?? [];
    const result = calculateCourseStatus({
      statusData,
      allCourseIds,
      courseId: item.identifier,
    });
    // console.log("[calculateTrackDataItem] Course result:", {
    //   courseId: item.identifier,
    //   percentage: result.percentage,
    //   status: result.status,
    // });
    return result;
  } else {
    const allCourseIds = item.identifier ? [item.identifier] : [item.id];
    const result = calculateCourseStatus({
      statusData,
      allCourseIds,
      courseId: item.identifier ? item.identifier : item.id,
    });
    // console.log("[calculateTrackDataItem] Content result:", {
    //   courseId: item.identifier || item.id,
    //   percentage: result.percentage,
    //   status: result.status,
    // });
    return result;
  }
};

type KeyFormat = string | { key: string; format?: string; suffix: string };

export function findCourseUnitPath({
  node,
  targetId,
  keyArray,
  contentBaseUrl,
  path = [],
}: {
  node: any;
  targetId: string;
  keyArray: KeyFormat[];
  contentBaseUrl?: string;
  path?: any[];
}): any[] | null {
  // Build current node's object by processing keyArray
  const currentObj = keyArray.reduce((acc, keyItem) => {
    if (typeof keyItem === "string") {
      // simple key, just pick the value if exists
      if (node[keyItem] !== undefined) acc[keyItem] = node[keyItem];
    } else if (typeof keyItem === "object" && keyItem.key) {
      let formattedValue = "";
      if (keyItem.key === "link") {
        if (
          path?.length > 0 &&
          node.mimeType === "application/vnd.ekstep.content-collection"
        ) {
          formattedValue = `${contentBaseUrl ?? "/content"}/${
            path?.[0]?.identifier
          }/${node.identifier}${keyItem?.suffix ?? ""}`;
        } else {
          formattedValue = `${contentBaseUrl ?? "/content"}/${node.identifier}${
            keyItem?.suffix ?? ""
          }`;
        }
      }
      if (keyItem.format) {
        // Replace ${id} or any ${key} in format with node[key]
        formattedValue = keyItem.format.replace(
          /\$\{(\w+)\}/g,
          (_, k) => node[k] ?? ""
        );
      }
      acc[keyItem.key] = formattedValue;
    }
    return acc;
  }, {} as Record<string, any>);

  const newPath = [...path, currentObj];

  if (node.identifier === targetId) {
    return newPath;
  }

  const children = node.children;

  if (Array.isArray(children)) {
    for (const child of children) {
      const result = findCourseUnitPath({
        node: child,
        targetId,
        keyArray,
        contentBaseUrl,
        path: newPath,
      });
      if (result) return result;
    }
  }

  return null;
}

type NameMapEntry = string | { key: string; replaceCode: string };

export function sortJsonByArray({
  jsonArray,
  nameArray,
  key = "code",
  onlyMatched = true,
}: {
  jsonArray: any[];
  nameArray?: NameMapEntry[];
  key?: string;
  onlyMatched?: boolean;
}) {
  if (nameArray === undefined || nameArray.length === 0) return jsonArray;
  const orderMap = new Map<string, { index: number; replaceCode?: string }>();
  nameArray.forEach((entry, index) => {
    if (typeof entry === "string") {
      orderMap.set(entry, { index });
    } else {
      orderMap.set(entry.key, { index, replaceCode: entry.replaceCode });
    }
  });

  return jsonArray
    .filter((item) => {
      const val = String(item[key]);
      return !onlyMatched || orderMap.has(val);
    })
    .sort((a, b) => {
      const aIndex = orderMap.get(String(a[key]))?.index ?? Infinity;
      const bIndex = orderMap.get(String(b[key]))?.index ?? Infinity;
      return aIndex - bIndex;
    })
    .map((item) => {
      const val = String(item[key]);
      const entry = orderMap.get(val);

      if (entry?.replaceCode) {
        return {
          ...item,
          [key]: entry.replaceCode.replace("{code}", val),
          [`old_${key}`]: val,
        };
      }

      return item;
    });
}
