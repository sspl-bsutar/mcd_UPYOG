import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { FSMService } from "../../services/elements/FSM";
import { PTService } from "../../services/elements/PT";
import { PTRService } from "../../services/elements/PTR";
import { filterFunctions } from "./filterFn";
import { getSearchFields } from "./searchFields";
import { TLService } from "../../services/elements/TL";
import { CHBServices } from "../../services/elements/CHB";
import { SVService } from "../../services/elements/SV";
import { EwService } from "../../services/elements/EW";

const inboxConfig = (tenantId, filters) => ({
  PT: {
    services: ["PT.CREATE"],
    searchResponseKey: "Properties",
    businessIdsParamForSearch: "acknowledgementIds",
    businessIdAliasForSearch: "acknowldgementNumber",
    fetchFilters: filterFunctions.PT,
    _searchFn: () => PTService.search({ tenantId, filters }),
  },
  PTR: {
    services: ["ptr"],
    searchResponseKey: "PetRegistrationApplications",
    businessIdsParamForSearch: "applicationNumber",
    businessIdAliasForSearch: "applicationNumber",
    fetchFilters: filterFunctions.PTR,
    _searchFn: () => PTRService.search({ tenantId, filters }),
  },
  ASSET: {
    services: ["asset-create"],
    searchResponseKey: "Asset",
    businessIdsParamForSearch: "applicationNo",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.ASSET,
    _searchFn: () => ASSETService.search({ tenantId, filters }),
  },
  FSM: {
    services: ["FSM"],
    searchResponseKey: "fsm",
    businessIdsParamForSearch: "applicationNos",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.FSM,
    _searchFn: () => FSMService.search(tenantId, filters),
  },
  TL: {
    services: ["TL"],
    searchResponseKey: "items",
    businessIdsParamForSearch: "businessId",
    businessIdAliasForSearch: "businessId",
    fetchFilters: filterFunctions.TL,
    _searchFn: () => TLService.search(tenantId, filters),
  },
  EW: {
    services: ["ewst"],
    searchResponseKey: "EwasteApplication",
    businessIdsParamForSearch: "requestId",
    businessIdAliasForSearch: "requestId",
    fetchFilters: filterFunctions.EW,
    _searchFn: () => EwService.search({ tenantId, filters }),
  },
  SV: {
    services: ["street-vending"],
    searchResponseKey: "SVDetails",
    businessIdsParamForSearch: "applicationNo",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.SV,
    _searchFn: () => SVService.search({ tenantId, filters }),
  },
});

const defaultCombineResponse = ({ totalCount, ...d }, wf) => {
  return { totalCount, searchData: { ...d }, workflowData: { ...wf } };
};

const defaultRawSearchHandler = ({ totalCount, ...data }, searchKey, businessIdAlias) => {
  return { [searchKey]: data[searchKey].map((e) => ({ totalCount, ...e })) };
};

const defaultCatchSearch = (Err) => {
  if (
    Err?.response?.data?.Errors?.some(
      (e) =>
        e.code === "EG_PT_INVALID_SEARCH" &&
        e.message === " Search is not allowed on empty Criteria, Atleast one criteria should be provided with tenantId for EMPLOYEE"
    )
  )
    return [];
  throw Err;
};

/**
 *
 * @param {*} data
 * @param {Array of Objects containing async or pure functions} middlewares
 * @returns {object}
 */

const callMiddlewares = async (data, middlewares) => {
  let applyBreak = false;
  let itr = -1;
  let _break = () => (applyBreak = true);
  let _next = async (data) => {
    if (!applyBreak && ++itr < middlewares.length) {
      let key = Object.keys(middlewares[itr])[0];
      let nextMiddleware = middlewares[itr][key];
      let isAsync = nextMiddleware.constructor.name === "AsyncFunction";
      if (isAsync) return await nextMiddleware(data, _break, _next);
      else return nextMiddleware(data, _break, _next);
    } else return data;
  };
  let ret = await _next(data);
  return ret || [];
};

const useInboxGeneral = ({
  tenantId,
  businessService,
  filters,
  rawWfHandler = (d) => d,
  rawSearchHandler = defaultRawSearchHandler,
  combineResponse = defaultCombineResponse,
  isInbox = true,
  wfConfig = {},
  searchConfig = {},
  middlewaresWf = [],
  middlewareSearch = [],
  catchSearch = defaultCatchSearch,
}) => {
  const client = useQueryClient();
  const { t } = useTranslation();

  const { services, fetchFilters, searchResponseKey, businessIdAliasForSearch, businessIdsParamForSearch } = inboxConfig()[businessService];

  let { workflowFilters, searchFilters } = fetchFilters(filters);

  const { data: processInstances, isFetching: wfFetching, isFetched, isSuccess: wfSuccess } = useQuery(
    ["WORKFLOW_INBOX", businessService, workflowFilters],
    () =>
      Digit.WorkflowService.getAllApplication(tenantId, { businessServices: services.join(), ...workflowFilters })
        .then(rawWfHandler)
        .then((data) => callMiddlewares(data.ProcessInstances, middlewaresWf)),
    {
      enabled: isInbox,
      select: (d) => {
        return d;
      },
      ...wfConfig,
    }
  );

  const applicationNoFromWF = processInstances?.map((e) => e.businessId).join() || "";

  if (isInbox && applicationNoFromWF && !searchFilters[businessIdAliasForSearch])
    searchFilters = { [businessIdsParamForSearch]: applicationNoFromWF, ...searchFilters };

  const { _searchFn } = inboxConfig(tenantId, { ...searchFilters })[businessService];

  /**
   * Convert Wf Array to Object
   */

  const processInstanceBuisnessIdMap = processInstances?.reduce((object, item) => {
    return { ...object, [item?.["businessId"]]: item };
  }, {});

  const allowSearch = isInbox ? isFetched && wfSuccess && !!searchFilters[businessIdsParamForSearch] : true;

  const searchResult = useQuery(
    ["SEARCH_INBOX", businessService, searchFilters, workflowFilters, isInbox],
    () => {
      if (allowSearch)
        return _searchFn()
          .then((d) => rawSearchHandler(d, searchResponseKey, businessIdAliasForSearch))
          .then((data) => callMiddlewares(data[searchResponseKey], middlewareSearch))
          .catch(catchSearch);
    },
    {
      enabled: allowSearch,
      select: (d) => {
        return d.map((searchResult) => ({
          totalCount: d.totalCount,
          ...combineResponse(searchResult, processInstanceBuisnessIdMap?.[searchResult?.[businessIdAliasForSearch]]),
        }));
      },
      ...searchConfig,
    }
  );

  const revalidate = () => {
    client.refetchQueries(["WORKFLOW_INBOX"]);
    client.refetchQueries(["SEARCH_INBOX"]);
  };

  client.setQueryData(`FUNCTION_RESET_INBOX_${businessService}`, { revalidate });

  return {
    ...searchResult,
    revalidate,
    searchResponseKey,
    businessIdsParamForSearch,
    businessIdAliasForSearch,

    searchFields: getSearchFields(isInbox)[businessService],
    wfFetching,
  };
};

export default useInboxGeneral;
