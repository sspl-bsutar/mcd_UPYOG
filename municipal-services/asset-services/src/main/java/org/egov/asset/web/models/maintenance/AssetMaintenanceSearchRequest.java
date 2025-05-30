package org.egov.asset.web.models.maintenance;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.models.coremodels.RequestInfoWrapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;


@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssetMaintenanceSearchRequest {

    @JsonProperty("RequestInfo")
    private RequestInfoWrapper requestInfoWrapper = null;

    @JsonProperty("AssetMaintenanceSearchCriteria")
    @Valid
    private AssetMaintenanceSearchCriteria assetMaintenanceSearchCriteria = null;
}
