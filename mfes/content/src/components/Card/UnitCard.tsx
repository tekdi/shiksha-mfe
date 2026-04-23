import { CommonCard, ContentItem } from "@shared-lib";
import { Box } from "@mui/material";
import AppConst from "../../utils/AppConst/AppConst";
import Description from "./Description";
import { StatusIcon } from "../CommonCollapse";
import { CardWrap } from "./ContentCard";
import { transformImageUrl } from "../../utils/imageUtils";

const UnitCard = ({
  item,
  trackData,
  type,
  _card,
  default_img,
  handleCardClick,
}: {
  item: ContentItem;
  trackData: any[];
  type?: any;
  _card?: any;
  default_img?: string;
  handleCardClick: (content: ContentItem) => void;
}) => {
  if (_card?.cardComponent) {
    return (
      <CardWrap isWrap={_card?.isWrap} _card={_card}>
        <_card.cardComponent
          item={item}
          type={type}
          default_img={default_img}
          _card={_card}
          handleCardClick={handleCardClick}
          trackData={trackData}
        />
      </CardWrap>
    );
  }
  return (
    <CardWrap isWrap>
      <CommonCard
        minheight="100%"
        title={(item?.name || "").trim()}
        description={item?.description ?? ""}
        image={
          transformImageUrl(item?.posterImage || item?.appIcon) ||
          (default_img ?? `${AppConst.BASEPATH}/assests/images/image_ver.png`)
        }
        content={null}
        orientation="horizontal"
        item={item}
        TrackData={trackData}
        type={type}
        onClick={() => handleCardClick(item)}
        _card={{
          _contentParentText: { sx: { height: "50px" } },
          _cardMedia: { sx: { maxHeight: "132px" } },
          ..._card,
        }}
        actions={
          <StatusIcon
            showMimeTypeIcon
            mimeType={"application/unit"}
            _icon={{
              isShowText: true,
              _box: {
                py: "7px",
                px: "8px",
                borderRadius: "10px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "#79747E",
              },
            }}
          />
        }
      />
    </CardWrap>
  );
};

export default UnitCard;
