/**
 * Normalizes course hierarchy data across Swadhaar modules.
 * 
 * Specifically addresses:
 * 1. Redundant intermediate container unwrapping:
 *    - In modules like "Section 0.1: Introduction to Swadhaar FinAccess", authors created an extra intermediate folder
 *      (e.g. "Introduction to Swadhaar FinAccess (15:00 Mins)") containing the subtopics (HOOK, CONCEPT, ANALYSIS).
 *    - This unwraps that redundant layer so subtopics appear directly under the module (matching Section 0.4, 0.5, and Hindi modules),
 *      promotes the meaningful description to the module level so it appears prominently on the main screen,
 *      and tracks alias identifiers so existing routes remain valid.
 * 2. Module 3, Sub-Topic 1 (HOOK) lesson merge (Multilingual: English & Hindi):
 *    - Merges the introductory text / question lesson and the "Swadhaar FinAccess – Introduction to Digital Platform" video
 *      into a single cohesive lesson with accurate title, introductory text, and video playback.
 * 3. Cleans up empty / solitary dot descriptions ('.' or '-') across nodes.
 */

function isCollection(item: any): boolean {
  if (!item) return false;
  return (
    item.mimeType === 'application/vnd.ekstep.content-collection' ||
    item.contentType === 'CourseUnit' ||
    item.contentType === 'TextBookUnit' ||
    (Array.isArray(item.children) && item.children.length > 0)
  );
}

function isMeaningful(text?: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed !== '.' && trimmed !== '-' && trimmed !== '·';
}

function cleanDescription(desc?: string): string {
  if (!desc) return '';
  const trimmed = desc.trim();
  if (trimmed === '.' || trimmed === '-' || trimmed === '·') return '';
  return desc;
}

export function normalizeCourseHierarchy(hierarchy: any): any {
  if (!hierarchy) return hierarchy;

  const clone = JSON.parse(JSON.stringify(hierarchy));

  // 1. Unwrap redundant intermediate containers
  const unwrapContainers = (node: any, isRoot = false) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children.forEach((c: any) => unwrapContainers(c, false));

    if (!isRoot && node.children.length === 1) {
      const singleChild = node.children[0];
      const isSingleChildContainer =
        isCollection(singleChild) &&
        Array.isArray(singleChild.children) &&
        singleChild.children.length > 0;

      if (isSingleChildContainer) {
        const grandchildrenHaveChildren = singleChild.children.some(
          (c: any) => Array.isArray(c.children) && c.children.length > 0
        );
        const hasSubCollections = singleChild.children.some((c: any) => isCollection(c));
        const isDuplicateNameWrapper =
          singleChild.name &&
          node.name &&
          singleChild.name.trim().toLowerCase() === node.name.trim().toLowerCase();
        const isNameSubset =
          singleChild.name &&
          node.name &&
          (node.name.toLowerCase().includes(singleChild.name.trim().toLowerCase()) ||
            singleChild.name.toLowerCase().includes(node.name.trim().toLowerCase()));

        if (grandchildrenHaveChildren || hasSubCollections || isDuplicateNameWrapper || isNameSubset) {
          if (isMeaningful(singleChild.description) && !isMeaningful(node.description)) {
            node.description = singleChild.description;
          }
          node._aliasIdentifiers = [
            ...(node._aliasIdentifiers || []),
            singleChild.identifier || singleChild.id,
            ...(singleChild._aliasIdentifiers || []),
          ].filter(Boolean);
          node.children = singleChild.children;
        }
      }
    }
  };

  // 2. Merge HOOK lessons in Section 0.1 (both English and Hindi)
  const mergeHookLessons = (node: any) => {
    if (!node) return;

    if (Array.isArray(node.children) && node.children.length > 0) {
      const vIdx = node.children.findIndex((c: any) =>
        typeof c.name === 'string' &&
        (c.name.toLowerCase().includes('introduction to digital platform') ||
          c.name.toLowerCase().includes('intro to digital platform'))
      );

      if (vIdx !== -1) {
        const tIdx = node.children.findIndex((c: any, idx: number) =>
          idx !== vIdx &&
          (
            (typeof c.name === 'string' && (
              c.name.toLowerCase().includes('who is swadhaar finaccess') ||
              c.name.includes('सोचिए') ||
              c.name.toLowerCase().includes('hook') ||
              c.name.includes('स्वाधार फिनएक्सेस क्या है')
            )) ||
            c.mimeType === 'application/vnd.sunbird.questionset'
          )
        );

        if (tIdx !== -1) {
          const vLesson = node.children[vIdx];
          const tLesson = node.children[tIdx];

          const isVVideo =
            (vLesson.mimeType && vLesson.mimeType.includes('video')) ||
            !!vLesson.artifactUrl ||
            !!vLesson.downloadUrl;
          const videoLesson = isVVideo ? vLesson : tLesson;
          const textLesson = videoLesson === vLesson ? tLesson : vLesson;

          let mergedName = textLesson.name ? textLesson.name.trim() : '';
          const lower = mergedName.toLowerCase();
          const isGenericHook =
            lower === 'सोचिए (hook)' || lower === 'hook' || lower === 'सोचिए';
          const isHindi =
            isGenericHook ||
            /[\u0900-\u097F]/.test(mergedName) ||
            (node.name && /[\u0900-\u097F]/.test(node.name));

          if (isGenericHook) {
            mergedName = 'स्वाधार फिनएक्सेस क्या है और यह वंचित समुदायों को कैसे सशक्त बनाता है?';
          }

          let mergedDesc = '';
          if (isMeaningful(textLesson.description)) {
            mergedDesc = textLesson.description.trim();
          } else if (isHindi) {
            mergedDesc =
              'समुदाय के साथ काम शुरू करने से पहले यह समझना ज़रूरी है कि आप किस संस्था का प्रतिनिधित्व कर रहे हैं, उसका उद्देश्य क्या है, उसके मूल्य क्या हैं और वह किन कार्यक्रमों के माध्यम से लोगों के जीवन में बदलाव लाती है। आइए, स्वाधार फिनएक्सेस का परिचय देने वाली यह छोटी-सी वीडियो देखते हैं।';
          } else {
            mergedDesc =
              'Before learning about financial concepts and beginning your role as a Field Trainer, let us first get to know Swadhaar FinAccess—its journey, work, reach, and the communities it serves. We start off this introductory course with a short film that introduces you to Swadhaar FinAccess.';
          }

          const mergedLesson = {
            ...videoLesson,
            name: mergedName,
            description: mergedDesc,
            _aliasIdentifiers: [
              tLesson.identifier || tLesson.id,
              vLesson.identifier || vLesson.id,
              ...(tLesson._aliasIdentifiers || []),
              ...(vLesson._aliasIdentifiers || []),
            ].filter(Boolean),
            identifier: videoLesson.identifier || videoLesson.id,
          };

          const newChildren = [...node.children];
          const minIdx = Math.min(vIdx, tIdx);
          const maxIdx = Math.max(vIdx, tIdx);
          newChildren.splice(maxIdx, 1);
          newChildren.splice(minIdx, 1, mergedLesson);
          node.children = newChildren;
        }
      }

      node.children.forEach(mergeHookLessons);
    }
  };

  // 3. Clean up dot / empty descriptions
  const cleanDescriptions = (node: any) => {
    if (!node) return;
    if (node.description) {
      node.description = cleanDescription(node.description);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(cleanDescriptions);
    }
  };

  unwrapContainers(clone, true);
  mergeHookLessons(clone);
  cleanDescriptions(clone);

  return clone;
}
