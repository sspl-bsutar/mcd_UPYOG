package org.egov.ptr.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@EnableSwagger2
@Configuration
public class SwaggerConfiguration {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2).select()
                .apis(RequestHandlerSelectors.basePackage("org.egov.ptr.web")).paths(PathSelectors.any()).build()
                .apiInfo(apiInfo()); // Completely Optional
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder().title("Pet Registration API")
                .description("API details of Pet Registration service").version("1.0").build();
    }
}
