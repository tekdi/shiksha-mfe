import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { ContentItem, useTranslation } from "@shared-lib";
import UnitCard from "./Card/UnitCard";
import ContentCard from "./Card/ContentCard";


interface CommonAccordionProps {
 item: ContentItem;
 skipContentId?: string;
 actions?: { label: string; onClick: () => void }[];
 trackData?: any[];
 _config: any;
 handleItemClick?: (content: ContentItem) => void;
}


export const UnitGrid: React.FC<CommonAccordionProps> = ({
 item,
 skipContentId,
 actions = [],
 trackData,
 _config,
 handleItemClick,
}) => {
 console.log("UnitGrid - Component received item:", {
   identifier: item?.identifier,
   name: item?.name,
   childrenLength: item?.children?.length,
   children: item?.children,
   fullItem: item,
 });
 console.log("UnitGrid - item type:", typeof item);
 console.log("UnitGrid - item keys:", item ? Object.keys(item) : "item is null/undefined");


 const { default_img, _grid, _parentGrid, _card, _containerGrid } =
   _config || {};
 const { t } = useTranslation();


 // Validate item data - if item is empty or missing required fields, show no data message
 if (!item || !item.identifier || (!item.name && !item.children)) {
   console.warn("UnitGrid - Invalid item data:", item);
   return (
     <Grid container spacing={{ xs: 1, sm: 1, md: 2 }} {..._containerGrid} {..._parentGrid}>
       <Grid item xs={12} textAlign="center">
         <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
           {t("LEARNER_APP.CONTENT_TABS.NO_MORE_DATA")}
         </Typography>
       </Grid>
     </Grid>
   );
 }


 // Ensure children is an array
 const childrenArray = Array.isArray(item?.children) ? item.children : [];


 console.log("UnitGrid - childrenArray:", childrenArray);
 console.log("UnitGrid - childrenArray.length:", childrenArray.length);
 console.log("UnitGrid - item.identifier:", item?.identifier);
 console.log("UnitGrid - item.name:", item?.name);


 return (
   <Grid
     container
     spacing={{ xs: 1, sm: 1, md: 2 }}
     {..._containerGrid}
     {..._parentGrid}
   >
     {childrenArray.length <= 0 ? (
       <Grid item xs={12} textAlign="center">
         <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
           {t("LEARNER_APP.CONTENT_TABS.NO_MORE_DATA")}
         </Typography>
       </Grid>
     ) : (
       childrenArray
         ?.filter((subItem: any) => subItem.identifier !== skipContentId)
         ?.map((subItem: any) => (
           <Grid
             key={subItem?.identifier}
             item
             xs={6}
             sm={4}
             md={3}
             lg={2.4}
             xl={2}
             {..._grid}
           >
             {subItem?.mimeType ===
             "application/vnd.ekstep.content-collection" ? (
               <UnitCard
                 item={subItem}
                 trackData={trackData ?? []}
                 default_img={default_img}
                 _card={{
                   ..._card,
                   sx: { ...(_card?.sx ?? {}), height: "100%" },
                 }}
                 handleCardClick={(content: ContentItem) =>
                   handleItemClick?.(content)
                 }
               />
             ) : (
               <ContentCard
                 item={subItem}
                 type={item.mimeType}
                 default_img={default_img}
                 _card={{
                   ..._card,
                   sx: { ...(_card?.sx ?? {}), height: "100%" },
                 }}
                 handleCardClick={(content: ContentItem) =>
                   handleItemClick?.(content)
                 }
                 trackData={trackData as []}
               />
             )}


             {actions.length > 0 && (
               <Box sx={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                 {actions.map((action) => (
                   <Button
                     key={action.label}
                     onClick={action.onClick}
                     variant="contained"
                   >
                     {action.label}
                   </Button>
                 ))}
               </Box>
             )}
           </Grid>
         ))
     )}
   </Grid>
 );
};


export default UnitGrid;



