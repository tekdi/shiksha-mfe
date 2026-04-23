import React, { useRef } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ContentItem, useTranslation } from "@shared-lib";
import ContentCard from "./ContentCard";
import { ContentSearchResponse } from "@content-mfes/services/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ContentCardCarousel = ({
  contentData,
  _config,
  type,
  handleCardClick,
  trackData,
  hasMoreData,
  handleLoadMore,
  isLoadingMoreData,
  pageName,
  isHideEmptyDataMessage,
}: {
  contentData: ContentSearchResponse[];
  _config: any;
  type: string;
  handleCardClick: (content: ContentItem) => void;
  trackData?: any[];
  hasMoreData: boolean;
  handleLoadMore: (e: any) => void;
  isLoadingMoreData: boolean;
  pageName?: string;
  isHideEmptyDataMessage?: boolean;
}) => {
  const { t } = useTranslation();
  const { default_img, _subBox, _carousel, _card, isHideNavigation } =
    _config ?? {};
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <Box {..._subBox} sx={{ ...(_subBox?.sx ?? {}) }}>
      {!isHideNavigation && (
        <IconButton
          sx={{
            bgcolor: "white",
            borderRadius: "16px",
            position: "absolute",
            top: "50%",
            left: 0,
            zIndex: 2,
            transform: "translateY(-50%)",
            color: "primary.main",
          }}
          ref={prevRef}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      {!isHideNavigation && (
        <IconButton
          sx={{
            bgcolor: "white",
            borderRadius: "16px",
            position: "absolute",
            top: "50%",
            right: 0,
            zIndex: 2,
            transform: "translateY(-50%)",
            color: "primary.main",
          }}
          ref={nextRef}
        >
          <ArrowForwardIcon />
        </IconButton>
      )}
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={2}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        breakpoints={{
          640: { slidesPerView: 2 },
          900: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
          1536: { slidesPerView: 5 },
        }}
        {..._carousel}
      >
        {contentData?.map((item: any) => (
          <SwiperSlide
            key={item?.identifier}
            style={{ height: "auto", paddingBottom: "8px" }}
            id={`${pageName}-${item?.identifier}`}
          >
            <ContentCard
              item={item}
              type={type}
              default_img={default_img}
              _card={{
                ..._card,
                sx: { ...(_card?.sx ?? {}), height: "100%" },
              }}
              handleCardClick={handleCardClick}
              trackData={trackData as [] | undefined}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <Box sx={{ textAlign: "center", mt: 4 }}>
        {hasMoreData && (
          <Button
            variant="contained"
            onClick={handleLoadMore}
            disabled={isLoadingMoreData}
          >
            {isLoadingMoreData ? (
              <CircularProgress size={20} />
            ) : (
              t("LEARNER_APP.CONTENT_TABS.LOAD_MORE")
            )}
          </Button>
        )}
      </Box>

      {!contentData?.length && (
        <Typography
          variant="body1"
          sx={{
            minHeight: "100px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...(_config?._noData?.sx ?? {}),
          }}
        >
          {_config?.noDataText || t("LEARNER_APP.CONTENT_TABS.NO_MORE_DATA")}
        </Typography>
      )}
    </Box>
  );
};

export default ContentCardCarousel;
