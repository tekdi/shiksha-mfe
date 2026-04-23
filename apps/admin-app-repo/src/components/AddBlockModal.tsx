import { getCohortList } from "@/services/CohortService/cohortService";
import { formatedStates } from "@/services/formatedCohorts";
import { getDistrictsForState } from "@/services/MasterDataService";
import { CohortTypes, QueryKeys, Role } from "@/utils/app.constant";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import MultipleSelectCheckmarks from "./FormControl";

interface AddBlockModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    value: string,
    controllingField: string,
    cohortId: string,
    fieldId: string,
    districtId?: string,
    stateCode?: string,

  ) => void;
  fieldId: string;
  initialValues?: {
    name?: string;
    value?: string;
    controllingField?: string;
    controllingFieldLabel?: string;
    stateLabel?: string

  };
  districtId?: string;
}
interface State {
  value: string;
  label: string;
  cohortId?: any;
}
export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  open,
  onClose,
  onSubmit,
  fieldId,
  initialValues = {},
  districtId,
}) => {
  const [formData, setFormData] = useState({
    name: initialValues.name || "",
    value: initialValues.value || "",
    controllingField: initialValues.controllingField || "",
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [districts, setDistricts] = useState<
    { value: string; label: string; cohortId: string | null }[]
  >([]);

  const [districtsOptionRead, setDistrictsOptionRead] = useState<any>([]);
  const [districtCodeArr, setDistrictCodeArr] = useState<any>([]);
  const [districtNameArr, setDistrictNameArr] = useState<any>([]);
  const [cohortIdAddNewDropdown, setCohortIdAddNewDropdown] = useState<any>("");
  const [stateCode, setStateCode] = useState<any>("");
  const [stateName, setStateName] = useState<any>("");
  const [states, setStates] = useState<State[]>([]);
  const [defaultStates, setDefaultStates] = useState<any>();
  const [userRole, setUserRole] = useState("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [disabledDistrict, setDisabledDistrict] = useState<boolean>(true);


  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchStates = async () => {
      try {
        if (userRole === Role.CENTRAL_ADMIN) {
          const result = await formatedStates();
          setStates(result);
          setStateCode(result[0]?.value);
          setDefaultStates(result[0]);
        } else {
          const storedUserData = JSON.parse(
            localStorage.getItem("adminInfo") || "{}"
          );
          const stateCodes = storedUserData?.customFields[0]?.code;
          const stateNames = storedUserData?.customFields[0]?.value;
          setStateCode(stateCodes);
          setStateName(stateNames);
        }
      } catch (error) {
        setDistricts([]);

        console.error("Error fetching districts:", error);
      }
    };
    fetchStates();
  }, [open, userRole]);
  useEffect(() => {
    const storedUserData = localStorage.getItem("adminInfo");
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserRole(userData.role);
    }
  }, []);
  useEffect(() => {
    setFormData({
      name: initialValues.name || "",
      value: initialValues.value || "",
      controllingField: initialValues.controllingField || "",
    });

    setErrors({});
  }, [initialValues]);

  useEffect(() => {
    if (formData.controllingField) {
      const selectedDistrict = districts.find(
        (district) => district.value === formData.controllingField
      );
      setCohortIdAddNewDropdown(selectedDistrict?.cohortId || null);
    }
  }, [formData.controllingField, districts]);

  const fetchDistricts = async () => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: [QueryKeys.FIELD_OPTION_READ, stateCode || "", "districts"],
        queryFn: () =>
          getDistrictsForState({
            controllingfieldfk: stateCode || "",
            fieldName: "districts",
          }),
      });

      const districts = data?.result?.values || [];
      setDistrictsOptionRead(districts);

      const districtNameArray = districts.map((item: any) =>
        item?.label?.toLowerCase()
      );
      setDistrictNameArr(districtNameArray);

      const districtCodeArray = districts.map((item: any) => item.value);
      setDistrictCodeArr(districtCodeArray);
    } catch (error) {
      setDistricts([]);
      console.error("Error fetching districts", error);
    }
  };

  useEffect(() => {
    if (stateCode !== "" && stateCode) fetchDistricts();
  }, [open, formData.controllingField, stateCode]);
  const handleStateChangeWrapper = async (
    selectedNames: string[],
    selectedCodes: string[]
  ) => {
    try {
      // setSelectedNames(selectedNames);

      setStateCode(selectedCodes[0]);
      setSelectedState(selectedNames[0]);
      setDisabledDistrict(false);
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.FIELD_OPTION_READ, stateCode, "districts"],
      });
    } catch (error) {
      console.log(error);
    }
  };
  const getFilteredCohortData = async () => {
    try {
      const reqParams = {
        limit: 0,
        offset: 0,
        filters: {
          states: stateCode,
          type: CohortTypes.DISTRICT,
          status: ["active"]

        },
      };

      // const response = await queryClient.fetchQuery({
      //   queryKey: [
      //     QueryKeys.FIELD_OPTION_READ,
      //     reqParams.limit,
      //     reqParams.offset,
      //     CohortTypes.DISTRICT,
      //   ],
      //   queryFn: () => getCohortList(reqParams),
      // });
      const response = await getCohortList(reqParams);
      const cohortDetails = response?.results?.cohortDetails || [];

      const filteredDistrictData = cohortDetails
        .map(
          (districtDetail: {
            cohortId: any;
            name: string;
            createdAt: any;
            updatedAt: any;
            createdBy: any;
            updatedBy: any;
          }) => {
            const transformedName = districtDetail.name;

            const matchingDistrict = districtsOptionRead.find(
              (district: { label: string }) =>
                district?.label?.toLowerCase() ===
                transformedName?.toLowerCase()
            );

            return {
              label: transformedName,
              value: matchingDistrict ? matchingDistrict.value : null,
              createdAt: districtDetail.createdAt,
              updatedAt: districtDetail.updatedAt,
              createdBy: districtDetail.createdBy,
              updatedBy: districtDetail.updatedBy,
              cohortId: districtDetail?.cohortId,
            };
          }
        )
        .filter((district: { label: any }) =>
          districtNameArr.includes(district?.label?.toLowerCase())
        );
      setDistricts(filteredDistrictData);
    } catch (error) {
      setDistricts([]);
      console.error("Error fetching and filtering cohort districts", error);
    }
  };
  useEffect(() => {
    if (stateCode !== "" && stateCode) getFilteredCohortData();
  }, [open, districtNameArr, stateCode]);

  function transformLabels(label: string) {
    if (!label || typeof label !== "string") return "";
    return label
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const validateField = (
    field: keyof typeof formData,
    value: string,
    requiredMessage: string
  ) => {
    if (!value) return null;

    if (field !== "controllingField" && !/^[a-zA-Z\s]+$/.test(value)) {
      return t("COMMON.INVALID_TEXT");
    }

    const isUnique = (fieldName: string, value: string) => {
      return true;
    };

    if (field === "name" && !isUnique("name", value)) {
      return t("COMMON.BLOCK_NAME_NOT_UNIQUE");
    }

    if (field === "value" && !isUnique("value", value)) {
      return t("COMMON.BLOCK_CODE_NOT_UNIQUE");
    }

    return null;
  };

  const handleChange =
    (field: keyof typeof formData) =>
      async (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
        let value = typeof e.target.value === "string" ? e.target.value : "";

        if (field === "value") {
          value = value.toUpperCase().slice(0, 3);
        }

        setFormData((prev) => ({ ...prev, [field]: value }));

        const errorMessage: string | null = validateField(field, value, "");

        setErrors((prev) => ({
          ...prev,
          [field]: errorMessage,
        }));
      };

  const validateForm = () => {
    const newErrors = {
      name:
        validateField("name", formData.name, t("COMMON.BLOCK_NAME_REQUIRED")) ||
        (!formData.name ? t("COMMON.BLOCK_NAME_REQUIRED") : null),
      value:
        validateField(
          "value",
          formData.value,
          t("COMMON.BLOCK_CODE_REQUIRED")
        ) || (!formData.value ? t("COMMON.BLOCK_CODE_REQUIRED") : null),
      controllingField:
        validateField(
          "controllingField",
          formData.controllingField,
          t("COMMON.DISTRICT_NAME_REQUIRED")
        ) ||
        (!formData.controllingField
          ? t("COMMON.DISTRICT_NAME_REQUIRED")
          : null),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== null);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const currentCohortId: any = cohortIdAddNewDropdown;

      onSubmit(
        formData.name,
        formData.value,
        formData.controllingField,
        currentCohortId,
        fieldId,
        districtId,
        stateCode
      );

      setFormData({
        name: "",
        value: "",
        controllingField: "",
      });
      setDefaultStates("");
      setSelectedState("")
      setDistricts([])
      setDisabledDistrict(true)

      onClose();
    }
  };
  if (formData.controllingField === "") {
  }
  const isEditing = !!initialValues.name;
  const buttonText = isEditing ? t("COMMON.UPDATE") : t("COMMON.SUBMIT");
  const dialogTitle = isEditing
    ? t("COMMON.UPDATE_BLOCK")
    : t("COMMON.ADD_BLOCK");

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          setDefaultStates("")
          setDistricts([])
          setDisabledDistrict(true)

          onClose();
        }
      }}
    >
      <DialogTitle sx={{ fontSize: "14px" }}>{dialogTitle}</DialogTitle>
      <Divider />
      <DialogContent>
        {userRole === Role.CENTRAL_ADMIN && (
          <MultipleSelectCheckmarks
            names={states?.map(
              (state) =>
                state.label?.toLowerCase().charAt(0).toUpperCase() +
                state.label?.toLowerCase().slice(1)
            )}
            codes={states?.map((state) => state.value)}
            tagName={t("FACILITATORS.STATE")}
            selectedCategories={initialValues.stateLabel ? [initialValues.stateLabel] : [selectedState]}
            onCategoryChange={handleStateChangeWrapper}
            cohortIds={states?.map((state) => state.cohortId)}
            disabled={isEditing}
            // overall={!inModal}
            width="290px"
          // defaultValue={defaultStates?.label}
          />
        )}
        {!(formData.controllingField === "All") && !initialValues.controllingField && (
          <>
            <FormControl fullWidth sx={{ marginTop: "8px" }}>
              {!disabledDistrict && (<InputLabel id="district-label" >District</InputLabel>)}
              <Select
                labelId="district-label"
                label={!disabledDistrict ? "District" : null}
                value={formData.controllingField !== "" && formData.controllingField ? formData.controllingField : "district"}
                onChange={(e) =>
                  handleChange("controllingField")(
                    e as React.ChangeEvent<HTMLInputElement>
                  )
                }
                sx={{ marginTop: "8px" }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400,
                    },
                  },
                }}
                fullWidth
                // variant="outlined"
                // margin="dense"
                disabled={disabledDistrict}
              >
                {/* Default MenuItem */}
                {disabledDistrict && (<MenuItem value="district">District</MenuItem>)}

                {/* District Options */}
                {districts.length > 0 && !initialValues.controllingField ? (
                  districts.map((district: any) => (
                    <MenuItem key={district.value} value={district.value}>
                      {transformLabels(district.label)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="no_districts" disabled>
                    {t("COMMON.NO_DISTRICTS")}
                  </MenuItem>
                )}
              </Select>
            </FormControl>


          </>
        )}

        {initialValues.controllingField && !(formData.controllingField === "All") && (<FormControl fullWidth disabled>
          <InputLabel id="district-label" sx={{ marginTop: "8px" }}>District</InputLabel>
          <Select
            labelId="district-label"
            id="disabled-select"
            value={initialValues.controllingFieldLabel}
            label="District"
            fullWidth sx={{ marginTop: "8px" }}
          // variant="outlined"
          //     margin="dense"

          >
            <MenuItem value={initialValues.controllingFieldLabel}>{initialValues.controllingFieldLabel}</MenuItem>
          </Select>
        </FormControl>)}
        {errors.controllingField && (
          <Typography variant="caption" color="error">
            {errors.controllingField}
          </Typography>
        )}
        <TextField
          margin="dense"
          label={t("COMMON.BLOCK_NAME")}
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={handleChange("name")}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          margin="dense"
          label={t("COMMON.BLOCK_CODE")}
          type="text"
          fullWidth
          variant="outlined"
          value={formData.value}
          onChange={handleChange("value")}
          error={!!errors.value}
          helperText={errors.value}
          disabled={isEditing}
        />
        <Box display="flex" alignItems="center" mt={2}>
          <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="caption" color="textSecondary">
            {t("COMMON.CODE_NOTIFICATION")}
          </Typography>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => {
            {
              setSelectedState("")
              setDefaultStates("")
              setDistricts([])
              setDisabledDistrict(true)
              onClose();
            }
          }}
          sx={{
            border: "none",
            color: "secondary",
            fontSize: "14px",
            fontWeight: "500",
            "&:hover": {
              border: "none",
              backgroundColor: "transparent",
            },
          }}
          variant="outlined"
        >
          {t("COMMON.CANCEL")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ fontSize: "14px" }}
          color="primary"
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
