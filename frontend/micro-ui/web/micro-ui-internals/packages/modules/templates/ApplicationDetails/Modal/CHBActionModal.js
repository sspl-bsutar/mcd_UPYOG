import { Loader, Modal, FormComposer } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useState, useEffect } from "react";

import { configCHBApproverApplication} from "../config";

/*
  ActionModal Component
  
  This component is responsible for rendering a modal that allows an approver to take action 
  on a specific task. It includes form fields for comments and file uploads, and provides the 
  ability to select an approver from a list fetched via an API. When the form is submitted, 
  it triggers the `submitAction` function with the necessary data.
  
  Key Features:
  - **File Upload**: Handles file upload with size validation (max 5MB).
  - **Approver Selection**: Dynamically loads approvers based on roles and sets the selected approver.
  - **Form Configuration**: Configures the form dynamically based on the `action` prop.
  - **Error Handling**: Displays error messages for file uploads or other validation issues.
  - **Submit Action**: Calls the provided `submitAction` function with the form data when submitted.
*/


const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const Close = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

const CloseBtn = (props) => {
  return (
    <div className="icon-bg-secondary" onClick={props.onClick}>
      <Close />
    </div>
  );
};

const ActionModal = ({ t, action, tenantId, state, id, closeModal, submitAction, actionData, applicationData, businessService, moduleCode }) => {

  const { data: approverData, isLoading: PTALoading } = Digit.Hooks.useEmployeeSearch(
    tenantId,
    {
      roles: action?.assigneeRoles?.map?.((e) => ({ code: e })),
      isActive: true,
    },
    { enabled: !action?.isTerminateState }
  );


  const [config, setConfig] = useState({});
  const [defaultValues, setDefaultValues] = useState({});
  const [approvers, setApprovers] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
 
  const [disableActionSubmit, setDisableActionSubmit] = useState(false);

  
 
  useEffect(() => {
    setApprovers(approverData?.Employees?.map((employee) => ({ uuid: employee?.uuid, name: employee?.user?.name })));
  }, [approverData]);

  function selectFile(e) {
    setFile(e.target.files[0]);
  }

  useEffect(() => {
      (async () => {
        setError(null);
        if (file) {
          if (file.size >= 5242880) {
            setError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
          } else {
            try {
            const response = await Digit.UploadServices.Filestorage("CHB", file, tenantId);
              if (response?.data?.files?.length > 0) {
                setUploadedFile(response?.data?.files[0]?.fileStoreId);
              } else {
                setError(t("CS_FILE_UPLOAD_ERROR"));
              }
            } catch (err) {
              setError(t("CS_FILE_UPLOAD_ERROR"));
            }
          }
        }
      })();
    }, [file]);
  

  function submit(data) {
      let workflow = { action: action?.action, comment: data?.comments, businessService, moduleName: moduleCode };
      if (uploadedFile)
        workflow["documents"] = [
          {
            documentType: action?.action + " DOC",
            fileName: file?.name,
            fileStoreId: uploadedFile,
          },
        ];
      submitAction({
        hallsBookingApplication: 
          {
            ...applicationData,
            workflow,
          },
      });
   
  }

   useEffect(() => {
    if (action) {
      setConfig(
        configCHBApproverApplication({
          t,
          action,
          approvers,
          selectedApprover,
          setSelectedApprover,
          selectFile,
          uploadedFile,
          setUploadedFile,
          businessService,
        })
      );
      
    }
    }, [action, approvers, uploadedFile]);

  return action && config.form ? (
    <Modal
      headerBarMain={<Heading label={t(config.label.heading)} />}
      headerBarEnd={<CloseBtn onClick={closeModal} />}
      actionCancelLabel={t(config.label.cancel)}
      actionCancelOnSubmit={closeModal}
      actionSaveLabel={t(config.label.submit)}
      actionSaveOnSubmit={() => {}}
      formId="modal-action"
    >
       
        <FormComposer
          config={config.form}
          noBoxShadow
          inline
          childrenAtTheBottom
          onSubmit={submit}
          defaultValues={defaultValues}
          formId="modal-action"
        />
      
    </Modal>
  ) : (
    <Loader />
  );
};

export default ActionModal;
