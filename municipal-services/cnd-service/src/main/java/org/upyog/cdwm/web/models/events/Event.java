package org.upyog.cdwm.web.models.events;

import lombok.*;
import org.springframework.validation.annotation.Validated;

import java.util.Map;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@Validated
@AllArgsConstructor
@EqualsAndHashCode
@Getter
@NoArgsConstructor
@Setter
@ToString
@Builder
public class Event {

	@NotNull
	private String tenantId;

	private String id;

	private String referenceId;

	@NotNull
	private String eventType;

	private String name;

	@NotNull
	private String description;

	private Status status;

	@NotNull
	private Source source;

	private String postedBy;

	@Valid
	@NotNull
	private Recepient recepient;

	private Action actions;

	private EventDetails eventDetails;

}
