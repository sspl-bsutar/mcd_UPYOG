import { Loader } from "@nudmcdgnpm/digit-ui-react-components";
import React ,{Fragment}from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { createConfig } from "../../../config/Create/createConfig";

const VENDOREMPCreate = ({ parentRoute }) => {
  const queryClient = useQueryClient();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const history = useHistory();
  const stateId = Digit.ULBService.getStateId();
  let config = [];
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage("VENDOR_Test", {});
  const goNext = (skipStep, index, isAddMultiple, key) => {

    
    
    let currentPath = pathname.split("/").pop(),
      lastchar = currentPath.charAt(currentPath.length - 1),
      isMultiple = false,
      nextPage;
    if (Number(parseInt(currentPath)) || currentPath == "0" || currentPath == "-1") {
      if (currentPath == "-1" || currentPath == "-2") {
        currentPath = pathname.slice(0, -3);
        currentPath = currentPath.split("/").pop();
        isMultiple = true;
      } else {
        currentPath = pathname.slice(0, -2);
        currentPath = currentPath.split("/").pop();
        isMultiple = true;
      }
    } else {
      isMultiple = false;
    }
    if (!isNaN(lastchar)) {
      isMultiple = true;
    }
    // let { nextStep = {} } = config.find((routeObj) => routeObj.route === currentPath);
    let { nextStep = {} } = config.find((routeObj) => routeObj.route === (currentPath || '0'));


    
    let redirectWithHistory = history.push;
    if (skipStep) {
      redirectWithHistory = history.replace;
    }
    if (isAddMultiple) {
      nextStep = key;
    }
    if (nextStep === null) {
      return redirectWithHistory(`${match.path}/check`);
    }
    if (!isNaN(nextStep.split("/").pop())) {
      nextPage = `${match.path}/${nextStep}`;
    }
     else {
      nextPage = isMultiple && nextStep !== "map" ? `${match.path}/${nextStep}/${index}` : `${match.path}/${nextStep}`;
    }

    redirectWithHistory(nextPage);
  };


  if(params && Object.keys(params).length>0 && window.location.href.includes("/info") && sessionStorage.getItem("docReqScreenByBack") !== "true")
    {
      clearParams();
      queryClient.invalidateQueries("VEN_CREATE");
    }

  const astcreate = async () => {
    history.push(`${match.path}/acknowledgement`);
  };

  function handleSelect(key, data, skipStep, index, isAddMultiple = false) {
    if (key === "owners") {
      let owners = params.owners || [];
      owners[index] = data;
      setParams({ ...params, ...{ [key]: [...owners] } });
    } else if (key === "units") {
      let units = params.units || [];
      // if(index){units[index] = data;}else{
      units = data;

      setParams({ ...params, units });
    } else {
      setParams({ ...params, ...{ [key]: { ...params[key], ...data } } });
    }
    goNext(skipStep, index, isAddMultiple, key);
  }

  const handleSkip = () => {};
  const handleMultiple = () => {};

  const onSuccess = () => {
    clearParams();
    queryClient.invalidateQueries("VEN_CREATE");
  };

  let isLoading

  if (isLoading) {
    return <Loader />;
  }

  // commonFields=newConfig;
  /* use newConfig instead of commonFields for local development in case needed */
 let commonFields = createConfig;
  commonFields.forEach((obj) => {
    config = config.concat(obj.body.filter((a) => !a.hideInCitizen));
  });
  
  config.indexRoute = "info";

     const CheckPage = Digit?.ComponentRegistryService?.getComponent("ASTCheckPage");
//   const NewResponse = Digit?.ComponentRegistryService?.getComponent("NewResponse");
  
  return (
    <Switch>
      {config.map((routeObj, index) => {
        const { component, texts, inputs, key } = routeObj;
        const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;
        return (
          <Route path={`${match.path}/${routeObj.route}`} key={index}>
            <Component config={{ texts, inputs, key }} onSelect={handleSelect} onSkip={handleSkip} t={t} formData={params} onAdd={handleMultiple} />
          </Route>
        );
      })}

      
      {/* <Route path={`${match.path}/check`}>
        <CheckPage onSubmit={astcreate} value={params} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <NewResponse data={params} onSuccess={onSuccess} />
      </Route> */}
      <Route>
        <Redirect to={`${match.path}/${config.indexRoute}`} />
      </Route>
    </Switch>
  );
};

export default VENDOREMPCreate;