import React from "react";
import { fetchCohortMemberList, getCohortList } from "@/services/CohortService/cohortService";
import { Typography } from "@mui/material";
import { Status } from "@/utils/app.constant";

const ActiveArchivedLearner = ({ cohortId, type }: any) => {
  const [countLabel, setCountLabel] = React.useState('-');

  React.useEffect(() => {
    let isMounted = true;
    const fetchLabel = async () => {
      const label = await getCountLabel(cohortId, type);
      if (isMounted) {
        setCountLabel(label);
      }
    };
    fetchLabel();

    return () => {
      isMounted = false;
    };
  }, [cohortId]);

  return <Typography sx={{ color: type == Status.ACTIVE ? "green" : "red" }}>{countLabel}</Typography>;
};

const getCountLabel = async (cohortId: any, type: any) => {
  try {
    const data: any = {
      filters: {
        cohortId: cohortId,
        status: [type],
        role:'Learner'
      },
    };
    const response = await fetchCohortMemberList(data);

    let totalCount = response?.result?.totalCount;

    return totalCount || "-"
    //  console.log(resp?.results?.cohortDetails[0]?.name)

  }
  catch (e) {
    console.log(e)
    return "-"
  }

  //  console.log(resp)
};
export default ActiveArchivedLearner;
