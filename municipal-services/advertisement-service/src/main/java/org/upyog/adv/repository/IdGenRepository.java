package org.upyog.adv.repository;


import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.upyog.adv.config.BookingConfiguration;
import org.upyog.adv.web.models.idgen.IdGenerationRequest;
import org.upyog.adv.web.models.idgen.IdGenerationResponse;
import org.upyog.adv.web.models.idgen.IdRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
     * This class is responsible for interacting with the ID generation service.
     * It uses a RestTemplate to make HTTP calls to the ID generation API.
     * The configuration for the service is provided by the BookingConfiguration class.
     * The repository is annotated with @Repository to indicate that it is a Spring-managed component.
     */

@Repository
public class IdGenRepository {



    private RestTemplate restTemplate;

    private BookingConfiguration config;

    @Autowired
    public IdGenRepository(RestTemplate restTemplate, BookingConfiguration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }


    /**
     * Call iDgen to generateIds
     * @param requestInfo The rquestInfo of the request
     * @param tenantId The tenantiD of the service request
     * @param name Name of the foramt
     * @param format Format of the ids
     * @param count Total Number of idGen ids required
     * @return
     */
    public IdGenerationResponse getId(RequestInfo requestInfo, String tenantId, String name, String format, int count) {

        List<IdRequest> reqList = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            reqList.add(IdRequest.builder().idName(name).format(format).tenantId(tenantId).build());
        }
        IdGenerationRequest req = IdGenerationRequest.builder().idRequests(reqList).requestInfo(requestInfo).build();
        IdGenerationResponse response = null;
        try {
            response = restTemplate.postForObject( config.getIdGenHost()+ config.getIdGenPath(), req, IdGenerationResponse.class);
        } catch (HttpClientErrorException e) {
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            Map<String, String> map = new HashMap<>();
            map.put(e.getCause().getClass().getName(),e.getMessage());
            throw new CustomException(map);
        }
        return response;
    }



}
